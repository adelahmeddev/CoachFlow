import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import sharp from "sharp";

const SRC_DIR = resolve("D:/coach/public/brand");
const OUT_DIR = SRC_DIR; // write back to same dir
const APP_DIR = resolve("D:/coach/src/app");

mkdirSync(OUT_DIR, { recursive: true });
mkdirSync(APP_DIR, { recursive: true });

// -------- Flood fill + trim helper --------
async function removeBackground(inputPath, outputPath, bgColorHint, tolerance = 30, featherTolerance = null) {
  const { data, info } = await sharp(inputPath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info; // channels = 4 (RGBA)
  if (channels !== 4) throw new Error(`Expected RGBA, got ${channels} channels`);

  // Sample background from 4 corners
  const corners = [
    data[0],
    data[3],
    data[(height - 1) * width * 4],
    data[(height - 1) * width * 4 + 3],
  ];
  const avgR = corners.reduce((s, i) => s + data[i], 0) / 4;
  const avgG = corners.reduce((s, i) => s + data[i + 1], 0) / 4;
  const avgB = corners.reduce((s, i) => s + data[i + 2], 0) / 4;
  const bgR = bgColorHint ? parseInt(bgColorHint.slice(1, 3), 16) : Math.round(avgR);
  const bgG = bgColorHint ? parseInt(bgColorHint.slice(3, 5), 16) : Math.round(avgG);
  const bgB = bgColorHint ? parseInt(bgColorHint.slice(5, 7), 16) : Math.round(avgB);
  console.log(`  bg sampled: rgb(${bgR}, ${bgG}, ${bgB})`);

  // BFS from all border pixels
  const removed = new Uint8Array(width * height);
  const queue = [];

  const dist = (i) => {
    const r = data[i * 4];
    const g = data[i * 4 + 1];
    const b = data[i * 4 + 2];
    const dr = r - bgR, dg = g - bgG, db = b - bgB;
    return Math.sqrt(dr * dr + dg * dg + db * db);
  };

  const isBorder = (x, y) => x === 0 || y === 0 || x === width - 1 || y === height - 1;
  const idx = (x, y) => y * width + x;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (isBorder(x, y)) {
        const i = idx(x, y);
        if (dist(i) <= tolerance) {
          removed[i] = 1;
          queue.push([x, y]);
        }
      }
    }
  }

  const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  while (queue.length) {
    const [x, y] = queue.shift();
    for (const [dx, dy] of dirs) {
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
      const ni = idx(nx, ny);
      if (removed[ni]) continue;
      if (dist(ni) <= tolerance) {
        removed[ni] = 1;
        queue.push([nx, ny]);
      }
    }
  }

  // Feather pass: kept pixels adjacent to removed, with dist < featherTolerance*2.5
  const ftol = (featherTolerance ?? tolerance) * 2.5;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = idx(x, y);
      if (removed[i]) continue;
      let touch = false;
      for (const [dx, dy] of dirs) {
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
        if (removed[idx(nx, ny)]) { touch = true; break; }
      }
      if (touch && dist(i) < ftol) {
        data[i * 4 + 3] = 100; // ~40% alpha
      }
    }
  }

  // Set removed pixels alpha = 0
  for (let i = 0; i < width * height; i++) {
    if (removed[i]) data[i * 4 + 3] = 0;
  }

  // Find bounding box of non-transparent pixels
  let minX = width, minY = height, maxX = -1, maxY = -1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const a = data[idx(x, y) * 4 + 3];
      if (a > 0) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (maxX < minX) throw new Error("No opaque pixels found");

  const cropW = maxX - minX + 1;
  const cropH = maxY - minY + 1;
  console.log(`  trim bbox: ${cropW}x${cropH} at (${minX},${minY})`);

  // Create cropped RGBA buffer
  const cropped = Buffer.alloc(cropW * cropH * 4);
  for (let y = 0; y < cropH; y++) {
    const srcOffset = (minY + y) * width * 4 + minX * 4;
    const dstOffset = y * cropW * 4;
    data.copy(cropped, dstOffset, srcOffset, srcOffset + cropW * 4);
  }

  // Resize so max dimension <= 520px (keep aspect)
  let targetW = cropW, targetH = cropH;
  if (cropW > 520 || cropH > 520) {
    if (cropW > cropH) {
      targetW = 520;
      targetH = Math.round(cropH * 520 / cropW);
    } else {
      targetH = 520;
      targetW = Math.round(cropW * 520 / cropH);
    }
  }
  console.log(`  output size: ${targetW}x${targetH}`);

  await sharp(cropped, { raw: { width: cropW, height: cropH, channels: 4 } })
    .resize(targetW, targetH, { fit: "inside", withoutEnlargement: true })
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toFile(outputPath);

  return { width: targetW, height: targetH };
}

// -------- Mark crop helper --------
async function cropMark(inputPath, outputPath, cropBox) {
  // cropBox: { x, y, w, h } in the *trimmed* image coords
  const { data, info } = await sharp(inputPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height } = info;
  const { x, y, w, h } = cropBox;
  if (x < 0 || y < 0 || x + w > width || y + h > height) {
    throw new Error(`Crop box ${w}x${h}@(${x},${y}) exceeds image ${width}x${height}`);
  }
  const cropped = Buffer.alloc(w * h * 4);
  for (let row = 0; row < h; row++) {
    const src = ((y + row) * width + x) * 4;
    const dst = row * w * 4;
    data.copy(cropped, dst, src, src + w * 4);
  }
  // Resize to 256px square-ish (for sidebar @2x ~128px display)
  await sharp(cropped, { raw: { width: w, height: h, channels: 4 } })
    .resize(256, 256, { fit: "inside", withoutEnlargement: true })
    .png({ compressionLevel: 9 })
    .toFile(outputPath);
  console.log(`  mark: ${w}x${h} -> 256px max`);
}

// -------- Compose icon on orange rounded square --------
async function composeIcon(markPath, outputPath, size) {
  const orange = "#F26A1B";
  // Use the mark as-is (already white-outline barbell from dark logo) on orange tile
  await sharp(markPath)
    .resize(Math.round(size * 0.6), Math.round(size * 0.6), { fit: "inside" })
    .extend({
      top: Math.round(size * 0.2),
      bottom: Math.round(size * 0.2),
      left: Math.round(size * 0.2),
      right: Math.round(size * 0.2),
      background: orange,
    })
    .png()
    .toFile(outputPath);
  console.log(`  icon ${size}x${size} composed`);
}

// -------- Compose OG image --------
async function composeOG(fullMarkPath, outputPath) {
  const W = 1200, H = 630;
  // Halftone dot pattern as SVG overlay
  const dotSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    <defs>
      <pattern id="dots" width="24" height="24" patternUnits="userSpaceOnUse">
        <circle cx="12" cy="12" r="3" fill="#F26A1B" opacity="0.12"/>
      </pattern>
    </defs>
    <rect width="${W}" height="${H}" fill="#242424"/>
    <rect width="${W}" height="${H}" fill="url(#dots)"/>
  </svg>`;
  const logo = await sharp(fullMarkPath).resize(600).png().toBuffer();
  await sharp({
    create: { width: W, height: H, channels: 4, background: "#242424" }
  })
    .composite([
      { input: Buffer.from(dotSVG), blend: "over" },
      { input: logo, gravity: "center", blend: "over" }
    ])
    .png()
    .toFile(outputPath);
  console.log(`  OG ${W}x${H} composed`);
}

// -------- Manifest --------
const manifest = {
  name: "NANOUSH",
  short_name: "NANOUSH",
  description: "نظام إدارة المدرب الشخصي",
  start_url: "/",
  display: "standalone",
  background_color: "#F7F5F2",
  theme_color: "#F26A1B",
  orientation: "portrait-primary",
  scope: "/",
  lang: "ar",
  dir: "rtl",
  icons: [
    { src: "/brand/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any maskable" },
    { src: "/brand/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" }
  ]
};

async function main() {
  console.log("=== Processing dark logo (black bg) ===");
  await removeBackground(`${SRC_DIR}/logo-on-dark.png`, `${OUT_DIR}/logo-on-dark.png`, "#000000", 32, 32);
  console.log("=== Processing light logo (white bg) ===");
  await removeBackground(`${SRC_DIR}/logo-on-light.png`, `${OUT_DIR}/logo-on-light.png`, "#FFFFFF", 48, 48);

  // Crop mark from trimmed logos (coordinates for the *resized* 520px-wide images)
  console.log("=== Cropping marks ===");
  // Dark: barbell spans ~x100-400, y0-205 in 520x304
  await cropMark(`${OUT_DIR}/logo-on-dark.png`, `${OUT_DIR}/logo-mark-dark.png`, { x: 80, y: 0, w: 340, h: 220 });
  // Light: similar proportions in 520x302
  await cropMark(`${OUT_DIR}/logo-on-light.png`, `${OUT_DIR}/logo-mark-light.png`, { x: 80, y: 0, w: 340, h: 220 });

  console.log("=== Composing icons ===");
  await composeIcon(`${OUT_DIR}/logo-mark-dark.png`, `${OUT_DIR}/icon-192.png`, 192);
  await composeIcon(`${OUT_DIR}/logo-mark-dark.png`, `${OUT_DIR}/icon-512.png`, 512);
  await composeIcon(`${OUT_DIR}/logo-mark-dark.png`, `${APP_DIR}/apple-icon.png`, 180);

  console.log("=== Composing OG image ===");
  await composeOG(`${OUT_DIR}/logo-on-dark.png`, `${APP_DIR}/opengraph-image.png`);

  writeFileSync(`${OUT_DIR}/manifest.json`, JSON.stringify(manifest, null, 2));
  console.log("=== manifest.json written ===");

  console.log("\n>>> First pass done. View the trimmed logos, then set mark crop coords and uncomment the rest. <<<");
}

main().catch(e => { console.error(e); process.exit(1); });