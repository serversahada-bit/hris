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
  } catch (error: any) {
    if (error.statusCode === 404 || error.statusCode === 410) {
      await db.query('DELETE FROM hc_push_subscriptions WHERE id = ?', [sub.id]);
    } else {
      console.error('[Push] Gagal kirim notifikasi:', error.message || error);
    }
    return false;
  }
}

export async function sendPushBroadcast(payload: PushPayload): Promise<number> {
  if (!vapidConfigured) return 0;

  try {
    const [subs] = await db.query('SELECT id, endpoint, p256dh, auth FROM hc_push_subscriptions');
    const results = await Promise.all((subs as PushSubscriptionRow[]).map((sub) => sendToSubscription(sub, payload)));
    return results.filter(Boolean).length;
  } catch (error: any) {
    console.error('[Push] sendPushBroadcast gagal:', error.message || error);
    return 0;
  }
}
