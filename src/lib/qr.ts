import "server-only";
import QRCode from "qrcode";

export async function generateQrDataUrl(text: string): Promise<string | null> {
  try {
    return await QRCode.toDataURL(text, {
      margin: 1,
      width: 240,
      color: { dark: "#0f172a", light: "#ffffff" },
    });
  } catch (error) {
    console.error("Failed to generate QR code:", error);
    return null;
  }
}
