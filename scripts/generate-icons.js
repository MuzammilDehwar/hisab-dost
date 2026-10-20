import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

function createPNG(width, height, colorR, colorG, colorB) {
  // Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData.writeUInt8(8, 8); // 8 bits per channel
  ihdrData.writeUInt8(6, 9); // RGBA
  ihdrData.writeUInt8(0, 10); // Compression
  ihdrData.writeUInt8(0, 11); // Filter
  ihdrData.writeUInt8(0, 12); // Interlace
  const ihdrChunk = createChunk('IHDR', ihdrData);

  // Raw image data with filter byte (0) per scanline
  const scanlineLength = width * 4 + 1;
  const rawData = Buffer.alloc(height * scanlineLength);

  const cx = width / 2;
  const cy = height / 2;
  const r = width * 0.42;

  for (let y = 0; y < height; y++) {
    const rowOffset = y * scanlineLength;
    rawData[rowOffset] = 0; // Filter type: None

    for (let x = 0; x < width; x++) {
      const pixelOffset = rowOffset + 1 + x * 4;
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Rounded card or circle with brand emerald green and gold accent
      let rVal = colorR;
      let gVal = colorG;
      let bVal = colorB;
      let aVal = 255;

      // Inside gold emblem
      const coinDist = Math.sqrt((x - width * 0.58) ** 2 + (y - height * 0.58) ** 2);
      if (coinDist < width * 0.22) {
        rVal = 245;
        gVal = 158;
        bVal = 11;
      }

      rawData[pixelOffset] = rVal;
      rawData[pixelOffset + 1] = gVal;
      rawData[pixelOffset + 2] = bVal;
      rawData[pixelOffset + 3] = aVal;
    }
  }

  const compressedData = zlib.deflateSync(rawData);
  const idatChunk = createChunk('IDAT', compressedData);
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    let byte = buf[i];
    for (let j = 0; j < 8; j++) {
      const bit = (crc ^ byte) & 1;
      crc = (crc >>> 1) ^ (bit ? 0xedb88320 : 0);
      byte = byte >>> 1;
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function createChunk(type, data) {
  const len = data.length;
  const buf = Buffer.alloc(12 + len);
  buf.writeUInt32BE(len, 0);
  buf.write(type, 4, 4, 'ascii');
  data.copy(buf, 8);
  const typeAndData = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const checksum = crc32(typeAndData);
  buf.writeUInt32BE(checksum, 8 + len);
  return buf;
}

const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Emerald primary: #047857 -> (4, 120, 87)
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), createPNG(192, 192, 4, 120, 87));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), createPNG(512, 512, 4, 120, 87));
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), createPNG(512, 512, 4, 120, 87));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), createPNG(180, 180, 4, 120, 87));
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), createPNG(32, 32, 4, 120, 87));

console.log('PNG assets created successfully');
