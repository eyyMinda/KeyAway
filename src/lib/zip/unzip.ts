/**
 * @fileoverview Minimal in-memory zip reader (stored and deflate entries) for press kits, .docx files and
 * zipped installers. Node built-ins only, so the Node prefill script can run it directly.
 */
import { inflateRawSync } from "node:zlib";

export function unzip(buf: Buffer): Map<string, Buffer> {
  const files = new Map<string, Buffer>();
  let eocd = -1;
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 65_557); i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) throw new Error("Not a zip file");
  const count = buf.readUInt16LE(eocd + 10);
  let p = buf.readUInt32LE(eocd + 16);
  for (let n = 0; n < count && buf.readUInt32LE(p) === 0x02014b50; n++) {
    const method = buf.readUInt16LE(p + 10);
    const compSize = buf.readUInt32LE(p + 20);
    const nameLen = buf.readUInt16LE(p + 28);
    const extraLen = buf.readUInt16LE(p + 30);
    const commentLen = buf.readUInt16LE(p + 32);
    const localOffset = buf.readUInt32LE(p + 42);
    const flags = buf.readUInt16LE(p + 8);
    const name = buf.subarray(p + 46, p + 46 + nameLen).toString(flags & 0x800 ? "utf8" : "latin1");
    p += 46 + nameLen + extraLen + commentLen;
    if (name.endsWith("/")) continue;
    const dataStart = localOffset + 30 + buf.readUInt16LE(localOffset + 26) + buf.readUInt16LE(localOffset + 28);
    const data = buf.subarray(dataStart, dataStart + compSize);
    if (method === 0) files.set(name, Buffer.from(data));
    else if (method === 8) files.set(name, inflateRawSync(data));
  }
  return files;
}
