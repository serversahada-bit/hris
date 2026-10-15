// Zona waktu aplikasi: WIB (GMT+7). Aman dipakai di server maupun client.
export const APP_TIMEZONE = "Asia/Jakarta";
export const APP_UTC_OFFSET = "+07:00";

const partsFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: APP_TIMEZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

const pad = (n: number) => String(n).padStart(2, "0");

/** Komponen tanggal & jam menurut WIB. */
export function wibParts(date: Date = new Date()) {
  const map: Record<string, number> = {};
  for (const p of partsFormatter.formatToParts(date)) {
    if (p.type !== "literal") map[p.type] = Number(p.value);
  }
  return {
    year: map.year,
    month: map.month,
    day: map.day,
    hour: map.hour % 24,
    minute: map.minute,
    second: map.second,
  };
}

/** YYYY-MM-DD menurut WIB. */
export function toYmd(date: Date = new Date()) {
  const { year, month, day } = wibParts(date);
  return `${year}-${pad(month)}-${pad(day)}`;
}

/** Tanggal hari ini (WIB) dalam format YYYY-MM-DD. */
export function todayYmd() {
  return toYmd(new Date());
}

/** Tanggal 1 bulan berjalan (WIB), YYYY-MM-DD. */
export function firstOfMonthYmd(date: Date = new Date()) {
  const { year, month } = wibParts(date);
  return `${year}-${pad(month)}-01`;
}

/** Tanggal terakhir bulan berjalan (WIB), YYYY-MM-DD. */
export function lastOfMonthYmd(date: Date = new Date()) {
  const { year, month } = wibParts(date);
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return `${year}-${pad(month)}-${pad(lastDay)}`;
}

/** YYYY-MM-DDTHH:mm (WIB) untuk <input type="datetime-local">. */
export function toDateTimeLocalInput(date: Date) {
  const { year, month, day, hour, minute } = wibParts(date);
  return `${year}-${pad(month)}-${pad(day)}T${pad(hour)}:${pad(minute)}`;
}

/** YYYYMMDDHHmmss (WIB), untuk nama file. */
export function toStamp(date: Date = new Date()) {
  const { year, month, day, hour, minute, second } = wibParts(date);
  return `${year}${pad(month)}${pad(day)}${pad(hour)}${pad(minute)}${pad(second)}`;
}

/**
 * Normalisasi nilai tanggal ke YYYY-MM-DD (WIB).
 * String yang sudah diawali YYYY-MM-DD dipakai apa adanya agar tidak bergeser hari.
 */
export function normalizeYmd(value: unknown): string | null {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : toYmd(value);
  const str = String(value);
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) return str.slice(0, 10);
  const date = new Date(str);
  return Number.isNaN(date.getTime()) ? null : toYmd(date);
}

function ymdToUtc(ymd: string) {
  const [y, m, d] = ymd.slice(0, 10).split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

/** Tambah/kurangi hari pada string YYYY-MM-DD. */
export function addDaysYmd(ymd: string, days: number) {
  return new Date(ymdToUtc(ymd) + days * 86400000).toISOString().slice(0, 10);
}

/** Selisih hari kalender (to - from) antara dua string YYYY-MM-DD. */
export function diffDaysYmd(from: string, to: string) {
  return Math.round((ymdToUtc(to) - ymdToUtc(from)) / 86400000);
}

/**
 * Ubah nilai <input type="datetime-local"> (jam dinding WIB) menjadi
 * format DATETIME MySQL "YYYY-MM-DD HH:mm:ss" tanpa konversi ke UTC.
 */
export function toDbDateTime(value: string) {
  const match = /^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2})(:\d{2})?/.exec(value.trim());
  if (match) return `${match[1]} ${match[2]}${match[3] || ":00"}`;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const { hour, minute, second } = wibParts(date);
  return `${toYmd(date)} ${pad(hour)}:${pad(minute)}:${pad(second)}`;
}
