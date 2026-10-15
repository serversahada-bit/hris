// Pastikan seluruh proses server berjalan di zona waktu WIB (GMT+7),
// apa pun zona waktu bawaan mesin/hosting.
export function register() {
  process.env.TZ = "Asia/Jakarta";
}
