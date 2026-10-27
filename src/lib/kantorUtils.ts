// Dipakai di client (form Lokasi Kantor) & server (validasi). Perhitungan yang sama ada di absen-main (src/lib/kantor.ts).

/** Parse "lat, lon" — format yang disalin dari Google Maps (klik kanan titik) & format lokasi absen Great. */
export function parseKoordinat(value: string | null | undefined) {
  const match = String(value ?? "").trim().match(/^(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)$/);
  if (!match) return null;
  const lat = Number(match[1]);
  const lon = Number(match[2]);
  if (Math.abs(lat) > 90 || Math.abs(lon) > 180) return null;
  return { lat, lon };
}

export function formatJarak(meter: number) {
  if (meter < 1000) return `${Math.round(meter)} m`;
  return `${(meter / 1000).toLocaleString("id-ID", { maximumFractionDigits: 1 })} km`;
}

export function mapsUrl(lat: number, lon: number) {
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`;
}

/** Pratinjau peta OpenStreetMap (tanpa API key) dengan penanda di titik kantor. */
export function osmEmbedUrl(lat: number, lon: number) {
  const d = 0.0015;
  const bbox = [lon - d, lat - d, lon + d, lat + d].join(",");
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lon}`;
}
