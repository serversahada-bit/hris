export const SITE_BASE = "https://great.ptslu.id/";
export const EMP_UPLOAD_BASE_URL = "https://great.ptslu.id/admin/uploads/";

const MONTHS_INDO = [
  "",
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

export interface RankingRow {
  jam_masuk: string | null;
  status: string | null;
  foto_masuk: string | null;
  nama: string | null;
  jabatan: string | null;
  foto_profil: string | null;
}

export interface RankingExportRow {
  id: number;
  nama: string | null;
  jabatan: string | null;
  total_hadir: number;
  total_rank_1: number;
}

export function formatDateToYmd(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getTodayYmd() {
  return formatDateToYmd(new Date());
}

export function parseDateParam(value?: string | null) {
  if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  return getTodayYmd();
}

export function formatDisplayDate(ymd: string) {
  const [year, month, day] = ymd.split("-").map(Number);
  if (!year || !month || !day) return ymd;
  return `${day} ${MONTHS_INDO[month]} ${year}`;
}

export function getMonthName(month: number) {
  return MONTHS_INDO[month] ?? "";
}

export function isAbsoluteUrl(value: string) {
  return /^https?:\/\//i.test(value);
}

export function normalizePath(path: string) {
  return path.trim().replace(/^\/+/, "");
}

export function absUrl(base: string, value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (isAbsoluteUrl(trimmed)) return trimmed;
  return `${base.replace(/\/$/, "")}/${normalizePath(trimmed)}`;
}

export function empPhotoUrl(base: string, fotoValue: string) {
  const trimmed = fotoValue.trim();
  if (!trimmed) return "";
  const fileName = trimmed.split("/").pop() ?? "";
  if (!fileName) return "";
  return `${base.replace(/\/$/, "")}/${encodeURIComponent(fileName)}`;
}

export function getRankingPhoto(row: Pick<RankingRow, "foto_masuk" | "foto_profil" | "nama">) {
  const attendancePhoto = row.foto_masuk?.trim() ?? "";
  const profilePhoto = row.foto_profil?.trim() ?? "";
  const fallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(row.nama?.trim() || "User")}`;

  if (attendancePhoto) {
    return absUrl(SITE_BASE, attendancePhoto);
  }

  if (profilePhoto) {
    return empPhotoUrl(EMP_UPLOAD_BASE_URL, profilePhoto);
  }

  return fallback;
}

export function getExportPeriodLabel(filterType: string, month: string, year: string, startDate: string, endDate: string) {
  if (filterType === "range") {
    return `Periode ${formatDisplayDate(startDate)} s/d ${formatDisplayDate(endDate)}`;
  }

  const monthNumber = Number(month);
  return `Bulan ${getMonthName(monthNumber)} ${year}`;
}
