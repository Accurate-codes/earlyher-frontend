import qrcode from "qrcode-generator";

/** Only public https pages may be encoded. Answers and phone numbers never go into a QR code. */
export function isPublicUrl(value: string | undefined | null): value is string {
  if (!value) return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.search === "" && url.hash === "";
  } catch {
    return false;
  }
}

export function QrCode({ url, label, size = 132 }: { url: string; label: string; size?: number }) {
  if (!isPublicUrl(url)) return null;

  const qr = qrcode(0, "M");
  qr.addData(url);
  qr.make();
  const count = qr.getModuleCount();
  const quiet = 2;
  const span = count + quiet * 2;

  let path = "";
  for (let row = 0; row < count; row++) {
    for (let col = 0; col < count; col++) {
      if (qr.isDark(row, col)) path += `M${col + quiet} ${row + quiet}h1v1h-1z`;
    }
  }

  return (
    <svg
      role="img"
      aria-label={label}
      width={size}
      height={size}
      viewBox={`0 0 ${span} ${span}`}
      shapeRendering="crispEdges"
    >
      <rect width={span} height={span} fill="#fff" />
      <path d={path} fill="#000" />
    </svg>
  );
}
