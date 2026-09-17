// Membangun URL foto profil karyawan dari kolom karyawan.foto.
// - Upload baru (lewat app Great) tersimpan sebagai "profil/<file>" (ada subfolder),
//   dilayani lewat /api/uploads yang membaca LEGACY_UPLOAD_DIR secara langsung.
// - Upload lama (admin panel lawas) tersimpan sebagai nama file polos tanpa folder,
//   dilayani lewat /api/legacy-files yang punya fallback remote ke great.ptslu.id.
export function employeeFotoUrl(foto: string | null | undefined): string {
  const trimmed = (foto || '').trim();
  if (!trimmed) return '';
  if (trimmed.includes('/')) {
    return `/api/uploads/${trimmed}`;
  }
  return `/api/legacy-files/admin/uploads/${encodeURIComponent(trimmed)}`;
}
