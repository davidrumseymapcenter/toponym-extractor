/*
 * Reads pixel dimensions out of an image file's header, without decoding the
 * image. Works on files far too large to decode in a browser tab — the 440 MB
 * TIFFs that map scans come as need about 64 KB read.
 *
 * Bundled into vendor/image-size.js as window.ImageSize.
 */

// JPEG: walk the marker segments to the first Start-Of-Frame.
function jpegSize (view) {
  let offset = 2
  while (offset + 9 < view.byteLength) {
    if (view.getUint8(offset) !== 0xff) { offset++; continue }
    const marker = view.getUint8(offset + 1)
    // SOF0..SOF3, SOF5..SOF7, SOF9..SOF11, SOF13..SOF15 all carry the size.
    if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
      return { width: view.getUint16(offset + 7), height: view.getUint16(offset + 5) }
    }
    if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) { offset += 2; continue }
    offset += 2 + view.getUint16(offset + 2)
  }
  return null
}

// PNG: IHDR is always the first chunk.
function pngSize (view) {
  return { width: view.getUint32(16), height: view.getUint32(20) }
}

// TIFF: read the first IFD and pick out ImageWidth (256) and ImageLength (257).
function tiffSize (view) {
  const little = view.getUint16(0) === 0x4949
  const u16 = (o) => view.getUint16(o, little)
  const u32 = (o) => view.getUint32(o, little)

  const ifd = u32(4)
  if (ifd + 2 > view.byteLength) return null
  const entries = u16(ifd)

  let width = null
  let height = null
  for (let i = 0; i < entries; i++) {
    const entry = ifd + 2 + i * 12
    if (entry + 12 > view.byteLength) break
    const tag = u16(entry)
    const type = u16(entry + 2)
    if (tag !== 256 && tag !== 257) continue
    const value = type === 3 ? u16(entry + 8) : u32(entry + 8)
    if (tag === 256) width = value
    else height = value
  }
  return width && height ? { width: width, height: height } : null
}

// GIF and WebP round out the formats a browser might be handed.
function gifSize (view) {
  return { width: view.getUint16(6, true), height: view.getUint16(8, true) }
}

function webpSize (view) {
  const fourcc = String.fromCharCode(view.getUint8(12), view.getUint8(13), view.getUint8(14), view.getUint8(15))
  if (fourcc === 'VP8 ') return { width: view.getUint16(26, true) & 0x3fff, height: view.getUint16(28, true) & 0x3fff }
  if (fourcc === 'VP8L') {
    const bits = view.getUint32(21, true)
    return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 }
  }
  if (fourcc === 'VP8X') return { width: (view.getUint32(24, true) & 0xffffff) + 1, height: (view.getUint32(27, true) & 0xffffff) + 1 }
  return null
}

export function imageSize (buffer) {
  const view = new DataView(buffer)
  if (view.byteLength < 24) return null

  const b0 = view.getUint8(0)
  const b1 = view.getUint8(1)

  if (b0 === 0xff && b1 === 0xd8) return jpegSize(view)
  if (view.getUint32(0) === 0x89504e47) return pngSize(view)
  if ((b0 === 0x49 && b1 === 0x49) || (b0 === 0x4d && b1 === 0x4d)) return tiffSize(view)
  if (b0 === 0x47 && b1 === 0x49 && view.getUint8(2) === 0x46) return gifSize(view)
  if (view.getUint32(0) === 0x52494646 && view.getUint32(8) === 0x57454250) return webpSize(view)
  return null
}
