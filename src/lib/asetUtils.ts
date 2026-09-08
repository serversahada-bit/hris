export function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function generateKodeSistem() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let out = "";
  for (let i = 0; i < 16; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

function monthsElapsed(from: Date, to: Date) {
  let months = (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth());
  if (to.getDate() >= from.getDate()) months += 1;
  return Math.max(months, 0);
}

export type Penyusutan = {
  totalBulanEkonomis: number;
  penyusutanPerBulan: number;
  usiaBulan: number;
  totalPenyusutan: number;
  nilaiSekarang: number;
};

export function hitungPenyusutan(
  hargaTotal: number,
  umurEkonomisTahun: number,
  tanggalPembelian: string | null
): Penyusutan {
  const totalBulanEkonomis = Math.max(umurEkonomisTahun, 0) * 12;
  const penyusutanPerBulan = totalBulanEkonomis > 0 ? hargaTotal / totalBulanEkonomis : 0;

  let usiaBulan = 0;
  if (tanggalPembelian) {
    const beli = new Date(tanggalPembelian);
    if (!Number.isNaN(beli.getTime())) {
      usiaBulan = monthsElapsed(beli, new Date());
    }
  }
  usiaBulan = totalBulanEkonomis > 0 ? Math.min(usiaBulan, totalBulanEkonomis) : usiaBulan;

  const totalPenyusutan = Math.min(penyusutanPerBulan * usiaBulan, hargaTotal);
  const nilaiSekarang = Math.max(hargaTotal - totalPenyusutan, 0);

  return { totalBulanEkonomis, penyusutanPerBulan, usiaBulan, totalPenyusutan, nilaiSekarang };
}

export const PERAWATAN_DUE_SOON_DAYS = 14;

export type StatusPerawatan = "terlambat" | "segera" | "terjadwal";

export type JadwalPerawatan = {
  jadwalBerikutnya: string | null;
  status: StatusPerawatan | null;
  sisaHari: number | null;
};

export function hitungJadwalPerawatan(
  tanggalPembelian: string | null,
  tanggalPerawatanTerakhir: string | null,
  intervalHari: number | null
): JadwalPerawatan {
  if (!intervalHari || intervalHari <= 0) {
    return { jadwalBerikutnya: null, status: null, sisaHari: null };
  }

  const basis = tanggalPerawatanTerakhir || tanggalPembelian;
  if (!basis) {
    return { jadwalBerikutnya: null, status: null, sisaHari: null };
  }

  const basisDate = new Date(basis);
  if (Number.isNaN(basisDate.getTime())) {
    return { jadwalBerikutnya: null, status: null, sisaHari: null };
  }

  const nextDate = new Date(basisDate);
  nextDate.setDate(nextDate.getDate() + intervalHari);
  nextDate.setHours(0, 0, 0, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const sisaHari = Math.round((nextDate.getTime() - today.getTime()) / 86400000);

  let status: StatusPerawatan;
  if (sisaHari < 0) status = "terlambat";
  else if (sisaHari <= PERAWATAN_DUE_SOON_DAYS) status = "segera";
  else status = "terjadwal";

  return { jadwalBerikutnya: nextDate.toISOString().slice(0, 10), status, sisaHari };
}
