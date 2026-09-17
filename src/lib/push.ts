import webpush from 'web-push';
import 'server-only';
import db from './db';

const vapidPublicKey = process.env.VAPID_PUBLIC_KEY || '';
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || '';
const vapidConfigured = Boolean(vapidPublicKey && vapidPrivateKey);

if (vapidConfigured) {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || 'mailto:admin@example.com',
    vapidPublicKey,
    vapidPrivateKey
  );
} else {
  console.warn('[Push] VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY belum diset, notifikasi push dinonaktifkan.');
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  image?: string;
}

interface PushSubscriptionRow {
  id: number;
  endpoint: string;
  p256dh: string;
  auth: string;
}

async function sendToSubscription(sub: PushSubscriptionRow, payload: PushPayload): Promise<boolean> {
  try {
    await webpush.sendNotification(
      { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
      JSON.stringify(payload)
    );
    return true;
  } catch (error: unknown) {
    const pushError = error as { statusCode?: number; body?: string; message?: string } | null;
    if (pushError?.statusCode === 404 || pushError?.statusCode === 410) {
      await db.query('DELETE FROM hc_push_subscriptions WHERE id = ?', [sub.id]);
    } else {
      console.error(
        '[Push] Gagal kirim notifikasi:',
        pushError?.statusCode,
        pushError?.body || pushError?.message || error
      );
    }
    return false;
  }
}

export class PushBroadcastError extends Error {}

export async function sendPushBroadcast(payload: PushPayload): Promise<number> {
  if (!vapidConfigured) {
    throw new PushBroadcastError('Konfigurasi push di server dashboard belum lengkap. Hubungi admin untuk memeriksa VAPID_PUBLIC_KEY dan VAPID_PRIVATE_KEY.');
  }

  try {
    const [subs] = await db.query('SELECT id, endpoint, p256dh, auth FROM hc_push_subscriptions');
    const subscriptions = subs as PushSubscriptionRow[];
    if (subscriptions.length === 0) {
      throw new PushBroadcastError('Belum ada perangkat terdaftar untuk notifikasi. Minta karyawan mengaktifkan notifikasi di Great.');
    }
    const results = await Promise.all(subscriptions.map((sub) => sendToSubscription(sub, payload)));
    const sent = results.filter(Boolean).length;
    if (sent === 0) {
      throw new PushBroadcastError('Notifikasi gagal dikirim ke semua perangkat. Subscription mungkin kedaluwarsa atau layanan push menolak pengiriman. Periksa log server dan aktifkan ulang notifikasi di Great.');
    }
    return sent;
  } catch (error: unknown) {
    if (error instanceof PushBroadcastError) throw error;
    console.error('[Push] sendPushBroadcast gagal:', error);
    throw new PushBroadcastError('Terjadi kesalahan server saat mengirim notifikasi. Periksa koneksi database dan log server sebelum mencoba lagi.');
  }
}
