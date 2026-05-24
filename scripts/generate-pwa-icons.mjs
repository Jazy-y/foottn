// Generate flat-color PNG placeholders for the PWA manifest icons.
// Pure Node, no extra deps. Produces public/icon-192.png and public/icon-512.png.
import { writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { deflateSync } from "node:zlib";

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, "..", "public");
mkdirSync(publicDir, { recursive: true });

// Brand-ish near-black background with mint glyph in center.
const BG = [10, 12, 16, 255]; // rgba
const FG = [94, 234, 212, 255]; // mint
const ACC = [167, 139, 250, 255]; // violet accent

function crc32Table() {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[n] = c >>> 0;
  }
  return table;
}
const CRC_TABLE = crc32Table();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, "ascii");
  const crcBuf = Buffer.alloc(4);
  const crcInput = Buffer.concat([typeBuf, data]);
  crcBuf.writeUInt32BE(crc32(crcInput), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function makePng(size) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); // width
  ihdr.writeUInt32BE(size, 4); // height
  ihdr.writeUInt8(8, 8);       // bit depth
  ihdr.writeUInt8(6, 9);       // color type RGBA
  ihdr.writeUInt8(0, 10);      // compression
  ihdr.writeUInt8(0, 11);      // filter
  ihdr.writeUInt8(0, 12);      // interlace

  // Build pixels: solid background with a centered diamond glyph for vibe.
  const stride = size * 4;
  const raw = Buffer.alloc(size * (1 + stride));

  const cx = size / 2;
  const cy = size / 2;
  const inner = size * 0.28;
  const outer = size * 0.36;

  for (let y = 0; y < size; y++) {
    const rowStart = y * (1 + stride);
    raw[rowStart] = 0; // filter: none
    for (let x = 0; x < size; x++) {
      const off = rowStart + 1 + x * 4;
      const dx = Math.abs(x - cx);
      const dy = Math.abs(y - cy);
      const d = dx + dy; // L1 distance for diamond shape
      let color;
      if (d < inner) {
        color = FG;
      } else if (d < outer) {
        color = ACC;
      } else {
        color = BG;
      }
      raw[off] = color[0];
      raw[off + 1] = color[1];
      raw[off + 2] = color[2];
      raw[off + 3] = color[3];
    }
  }

  const idatData = deflateSync(raw, { level: 9 });

  return Buffer.concat([
    sig,
    chunk("IHDR", ihdr),
    chunk("IDAT", idatData),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

for (const size of [192, 512]) {
  const out = join(publicDir, `icon-${size}.png`);
  writeFileSync(out, makePng(size));
  console.log(`[pwa-icons] wrote ${out}`);
}
