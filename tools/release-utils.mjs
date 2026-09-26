import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve, sep } from "node:path";

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    table[n] = c >>> 0;
  }
  return table;
})();

export function crc32(input) {
  const data = Buffer.isBuffer(input) ? input : Buffer.from(input);
  let crc = 0xffffffff;
  for (const byte of data) crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function dosTimeDate() {
  // Fixed timestamp for reproducible archive metadata.
  return { time: 0, date: 33 }; // 1980-01-01 00:00:00
}

export function createStoreZip(entries) {
  const normalized = entries.map(entry => {
    const name = entry.name.replaceAll("\\", "/").replace(/^\/+/, "");
    if (!name || name.includes("..")) throw new Error("Unsafe ZIP entry: " + entry.name);
    const data = Buffer.isBuffer(entry.data) ? entry.data : Buffer.from(entry.data);
    return { name, data, crc: crc32(data) };
  });

  const locals = [];
  const centrals = [];
  let offset = 0;
  const { time, date } = dosTimeDate();

  for (const entry of normalized) {
    const name = Buffer.from(entry.name, "utf8");
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0, 6);
    local.writeUInt16LE(0, 8);
    local.writeUInt16LE(time, 10);
    local.writeUInt16LE(date, 12);
    local.writeUInt32LE(entry.crc, 14);
    local.writeUInt32LE(entry.data.length, 18);
    local.writeUInt32LE(entry.data.length, 22);
    local.writeUInt16LE(name.length, 26);
    local.writeUInt16LE(0, 28);
    locals.push(local, name, entry.data);

    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0, 8);
    central.writeUInt16LE(0, 10);
    central.writeUInt16LE(time, 12);
    central.writeUInt16LE(date, 14);
    central.writeUInt32LE(entry.crc, 16);
    central.writeUInt32LE(entry.data.length, 20);
    central.writeUInt32LE(entry.data.length, 24);
    central.writeUInt16LE(name.length, 28);
    central.writeUInt16LE(0, 30);
    central.writeUInt16LE(0, 32);
    central.writeUInt16LE(0, 34);
    central.writeUInt16LE(0, 36);
    central.writeUInt32LE(0, 38);
    central.writeUInt32LE(offset, 42);
    centrals.push(central, name);

    offset += local.length + name.length + entry.data.length;
  }

  const centralDirectory = Buffer.concat(centrals);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(0, 4);
  end.writeUInt16LE(0, 6);
  end.writeUInt16LE(normalized.length, 8);
  end.writeUInt16LE(normalized.length, 10);
  end.writeUInt32LE(centralDirectory.length, 12);
  end.writeUInt32LE(offset, 16);
  end.writeUInt16LE(0, 20);

  return Buffer.concat([...locals, centralDirectory, end]);
}

export function extractStoreZip(buffer, destination) {
  const data = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);
  let offset = 0;
  const files = [];

  while (offset + 4 <= data.length) {
    const signature = data.readUInt32LE(offset);
    if (signature === 0x02014b50 || signature === 0x06054b50) break;
    if (signature !== 0x04034b50) throw new Error("Unexpected ZIP signature at " + offset);

    const method = data.readUInt16LE(offset + 8);
    const expectedCrc = data.readUInt32LE(offset + 14);
    const compressedSize = data.readUInt32LE(offset + 18);
    const uncompressedSize = data.readUInt32LE(offset + 22);
    const nameLength = data.readUInt16LE(offset + 26);
    const extraLength = data.readUInt16LE(offset + 28);
    if (method !== 0 || compressedSize !== uncompressedSize) throw new Error("Only stored ZIP entries are supported.");

    const nameStart = offset + 30;
    const contentStart = nameStart + nameLength + extraLength;
    const name = data.subarray(nameStart, nameStart + nameLength).toString("utf8").replaceAll("\\", "/");
    if (!name || name.startsWith("/") || name.split("/").includes("..")) throw new Error("Unsafe ZIP path: " + name);
    const content = data.subarray(contentStart, contentStart + uncompressedSize);
    if (content.length !== uncompressedSize) throw new Error("Truncated ZIP entry: " + name);
    if (crc32(content) !== expectedCrc) throw new Error("CRC mismatch: " + name);

    const output = resolve(destination, name);
    const base = resolve(destination);
    if (output !== base && !output.startsWith(base + sep)) throw new Error("ZIP path escaped destination: " + name);
    mkdirSync(dirname(output), { recursive: true });
    writeFileSync(output, content);
    files.push(name);

    offset = contentStart + uncompressedSize;
  }

  return files;
}
