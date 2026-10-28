/** Browser-only helpers that turn a photo of a signature or a logo into a small clean PNG. */
function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("ছবি খোলা যায়নি")); };
    img.src = url;
  });
}

/** Pixel rule used for signatures: light paper becomes transparent, ink becomes solid dark. Returns alpha 0-255. */
export function inkAlpha(r: number, g: number, b: number): number {
  const lum = 0.299 * r + 0.587 * g + 0.114 * b;
  if (lum >= 200) return 0;
  if (lum <= 120) return 255;
  return Math.round(((200 - lum) / 80) * 255);
}

/** Removes the white paper, keeps only the ink in dark blue-black, crops tight and scales down. */
export async function cleanSignature(file: File): Promise<string> {
  const img = await loadImage(file);
  const scale = Math.min(1, 1200 / img.width);
  const w = Math.round(img.width * scale), h = Math.round(img.height * scale);
  const c = document.createElement("canvas"); c.width = w; c.height = h;
  const ctx = c.getContext("2d")!; ctx.drawImage(img, 0, 0, w, h);
  const d = ctx.getImageData(0, 0, w, h);
  let minX = w, minY = h, maxX = -1, maxY = -1;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = (y * w + x) * 4;
    const a = inkAlpha(d.data[i]!, d.data[i + 1]!, d.data[i + 2]!) * (d.data[i + 3]! / 255);
    d.data[i] = 20; d.data[i + 1] = 30; d.data[i + 2] = 80; d.data[i + 3] = a;
    if (a > 60) { if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y; }
  }
  if (maxX < 0) throw new Error("ছবিতে কোনো স্বাক্ষর পাওয়া যায়নি");
  ctx.putImageData(d, 0, 0);
  const pad = 8;
  minX = Math.max(0, minX - pad); minY = Math.max(0, minY - pad); maxX = Math.min(w - 1, maxX + pad); maxY = Math.min(h - 1, maxY + pad);
  const cw = maxX - minX + 1, ch = maxY - minY + 1;
  const fit = Math.min(1, 500 / cw, 160 / ch);
  const out = document.createElement("canvas"); out.width = Math.round(cw * fit); out.height = Math.round(ch * fit);
  out.getContext("2d")!.drawImage(c, minX, minY, cw, ch, 0, 0, out.width, out.height);
  return out.toDataURL("image/png");
}

/** Fits the logo in a 256px square, keeping transparency. */
export async function shrinkLogo(file: File): Promise<string> {
  const img = await loadImage(file);
  const fit = Math.min(1, 256 / Math.max(img.width, img.height));
  const c = document.createElement("canvas"); c.width = Math.round(img.width * fit); c.height = Math.round(img.height * fit);
  c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
  return c.toDataURL("image/png");
}
