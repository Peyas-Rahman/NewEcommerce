// =========================================================
// Code 39 barcode renderer (no external dependency).
// Encodes A-Z, 0-9, "-", "." and space. Renders crisp SVG bars.
// =========================================================

const CODE39: Record<string, string> = {
  "0": "101001101101",
  "1": "110100101011",
  "2": "101100101011",
  "3": "110110010101",
  "4": "101001101011",
  "5": "110100110101",
  "6": "101100110101",
  "7": "101001011011",
  "8": "110100101101",
  "9": "101100101101",
  A: "110101001011",
  B: "101101001011",
  C: "110110100101",
  D: "101011001011",
  E: "110101100101",
  F: "101101100101",
  G: "101010011011",
  H: "110101001101",
  I: "101101001101",
  J: "101011001101",
  K: "110101010011",
  L: "101101010011",
  M: "110110101001",
  N: "101011010011",
  O: "110101101001",
  P: "101101101001",
  Q: "101010110011",
  R: "110101011001",
  S: "101101011001",
  T: "101011011001",
  U: "110010101011",
  V: "100110101011",
  W: "110011010101",
  X: "100101101011",
  Y: "110010110101",
  Z: "100110110101",
  "-": "100101011011",
  ".": "110010101101",
  " ": "100110101101",
  "*": "100101101101",
};

interface BarcodeProps {
  value: string;
  height?: number;
  barWidth?: number;
  className?: string;
}

export default function Barcode({
  value,
  height = 44,
  barWidth = 1.6,
  className,
}: BarcodeProps) {
  const encoded = `*${value
    .toUpperCase()
    .replace(/[^0-9A-Z\-. ]/g, "")}*`;

  const bars: { x: number; width: number }[] = [];
  let x = 0;

  for (const char of encoded) {
    const pattern = CODE39[char];
    if (!pattern) continue;

    for (let i = 0; i < pattern.length; i++) {
      const wide = pattern[i] === "1";
      const width = (wide ? 3 : 1) * barWidth;

      // Even indexes are bars, odd indexes are spaces
      if (i % 2 === 0) {
        bars.push({ x, width });
      }
      x += width;
    }

    // Inter-character gap
    x += barWidth;
  }

  return (
    <svg
      className={className}
      width={x}
      height={height}
      viewBox={`0 0 ${x} ${height}`}
      role="img"
      aria-label={`Barcode ${value}`}
    >
      {bars.map((bar, index) => (
        <rect
          key={index}
          x={bar.x}
          y={0}
          width={bar.width}
          height={height}
          fill="#000"
        />
      ))}
    </svg>
  );
}
