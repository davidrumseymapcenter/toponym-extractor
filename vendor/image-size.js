var ImageSize = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // build/image-size.js
  var image_size_exports = {};
  __export(image_size_exports, {
    imageSize: () => imageSize
  });
  function jpegSize(view) {
    let offset = 2;
    while (offset + 9 < view.byteLength) {
      if (view.getUint8(offset) !== 255) {
        offset++;
        continue;
      }
      const marker = view.getUint8(offset + 1);
      if (marker >= 192 && marker <= 207 && marker !== 196 && marker !== 200 && marker !== 204) {
        return { width: view.getUint16(offset + 7), height: view.getUint16(offset + 5) };
      }
      if (marker === 216 || marker === 1 || marker >= 208 && marker <= 215) {
        offset += 2;
        continue;
      }
      offset += 2 + view.getUint16(offset + 2);
    }
    return null;
  }
  function pngSize(view) {
    return { width: view.getUint32(16), height: view.getUint32(20) };
  }
  function tiffSize(view) {
    const little = view.getUint16(0) === 18761;
    const u16 = (o) => view.getUint16(o, little);
    const u32 = (o) => view.getUint32(o, little);
    const ifd = u32(4);
    if (ifd + 2 > view.byteLength) return null;
    const entries = u16(ifd);
    let width = null;
    let height = null;
    for (let i = 0; i < entries; i++) {
      const entry = ifd + 2 + i * 12;
      if (entry + 12 > view.byteLength) break;
      const tag = u16(entry);
      const type = u16(entry + 2);
      if (tag !== 256 && tag !== 257) continue;
      const value = type === 3 ? u16(entry + 8) : u32(entry + 8);
      if (tag === 256) width = value;
      else height = value;
    }
    return width && height ? { width, height } : null;
  }
  function gifSize(view) {
    return { width: view.getUint16(6, true), height: view.getUint16(8, true) };
  }
  function webpSize(view) {
    const fourcc = String.fromCharCode(view.getUint8(12), view.getUint8(13), view.getUint8(14), view.getUint8(15));
    if (fourcc === "VP8 ") return { width: view.getUint16(26, true) & 16383, height: view.getUint16(28, true) & 16383 };
    if (fourcc === "VP8L") {
      const bits = view.getUint32(21, true);
      return { width: (bits & 16383) + 1, height: (bits >> 14 & 16383) + 1 };
    }
    if (fourcc === "VP8X") return { width: (view.getUint32(24, true) & 16777215) + 1, height: (view.getUint32(27, true) & 16777215) + 1 };
    return null;
  }
  function imageSize(buffer) {
    const view = new DataView(buffer);
    if (view.byteLength < 24) return null;
    const b0 = view.getUint8(0);
    const b1 = view.getUint8(1);
    if (b0 === 255 && b1 === 216) return jpegSize(view);
    if (view.getUint32(0) === 2303741511) return pngSize(view);
    if (b0 === 73 && b1 === 73 || b0 === 77 && b1 === 77) return tiffSize(view);
    if (b0 === 71 && b1 === 73 && view.getUint8(2) === 70) return gifSize(view);
    if (view.getUint32(0) === 1380533830 && view.getUint32(8) === 1464156752) return webpSize(view);
    return null;
  }
  return __toCommonJS(image_size_exports);
})();
