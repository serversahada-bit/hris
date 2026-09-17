// Definisi kolom untuk template Excel & import massal karyawan.
// Urutan dan field ini SENGAJA disamakan dengan form "Tambah Karyawan Baru"
// supaya template Excel dan form tambah manual selalu konsisten.
export type KaryawanFieldDef = {
  key: string;
  label: string;
  required?: boolean;
  example?: string;
};

export const KARYAWAN_IMPORT_FIELDS: KaryawanFieldDef[] = [
  { key: "nama", label: "Nama Lengkap", required: true, example: "Budi Santoso" },
  { key: "id_karyawan", label: "ID Karyawan (NIP)", required: true, example: "EMP-001" },
  { key: "jenis_kelamin", label: "Jenis Kelamin", example: "Laki-laki" },
  { key: "tempat_lahir", label: "Tempat Lahir", example: "Jakarta" },
  { key: "tanggal_lahir", label: "Tanggal Lahir (YYYY-MM-DD)", example: "1995-08-17" },
  { key: "status_perkawinan", label: "Status Pernikahan", example: "Belum Menikah" },
  { key: "agama", label: "Agama", example: "Islam" },
  { key: "golongan_darah", label: "Golongan Darah", example: "O" },
  { key: "warga", label: "Kewarganegaraan", example: "WNI" },
  { key: "pendidikan_terakhir", label: "Pendidikan Terakhir", example: "S1" },
  { key: "email", label: "Email", example: "budi@email.com" },
  { key: "no_hp", label: "No Handphone", example: "081234567890" },
  { key: "kontak_darurat", label: "Kontak Darurat", example: "081298765432" },
  { key: "id_kartu_identitas", label: "NIK KTP", example: "3201000000000000" },
  { key: "nomor_kk", label: "Nomor KK", example: "3201000000000000" },
  { key: "npwp", label: "NPWP", example: "" },
  { key: "alamat_kartu_identitas", label: "Alamat KTP", example: "Jl. Contoh No. 1" },
  { key: "alamat_domisili", label: "Alamat Domisili", example: "Jl. Contoh No. 1" },
  { key: "jabatan", label: "Jabatan", example: "Staff" },
  { key: "organisasi", label: "Divisi / Organisasi", example: "IT" },
  { key: "status_karyawan", label: "Status Kepegawaian", example: "Tetap" },
  { key: "tanggal_bergabung", label: "Tanggal Bergabung (YYYY-MM-DD)", example: "2024-01-01" },
  { key: "tanggal_masa_akhir_kerja", label: "Tanggal Berakhir Kontrak (YYYY-MM-DD)", example: "" },
  { key: "bank", label: "Nama Bank", example: "BCA" },
  { key: "bpjs_kesehatan", label: "BPJS Kesehatan", example: "" },
  { key: "bpjs_ketenagakerjaan", label: "BPJS Ketenagakerjaan", example: "" },
];
