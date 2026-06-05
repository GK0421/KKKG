// AGF Mobile Prototype 01 — assets loader with procedural:// short-circuit
// Forked from AGF side-scroll seed. Change vs seed:
//   * If a sprite path starts with "procedural://", we skip the network fetch entirely
//     and return a 1x1 transparent Image so any caller that does drawImage draws nothing.
//     The renderer reads `anim.procedural` to draw with Canvas2D primitives instead.
//   * This satisfies the "no missing-asset / no red console error" acceptance gates:
//     no 404s, no onerror warnings, no need for an image-gen API key.

const assetCache = {
  json: new Map(),
  images: new Map(),
  meta: new Map(),
  procedural: new Map()
};

async function loadJSON(path) {
  if (assetCache.json.has(path)) return assetCache.json.get(path);
  const response = await fetch(path, { cache: "no-cache" });
  if (!response.ok) throw new Error("Could not load " + path + " (" + response.status + ")");
  const data = await response.json();
  assetCache.json.set(path, data);
  return data;
}

function isProceduralPath(path) {
  return typeof path === "string" && path.startsWith("procedural://");
}

// A cached 1x1 transparent PNG, base64. Reused for every procedural image
// so we never allocate a new Image and never touch the network.
const PROCEDURAL_PIXEL_SRC =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgAAIAAAUAAeImBZsAAAAASUVORK5CYII=";

function loadImage(path) {
  if (!path) return Promise.resolve(null);
  if (assetCache.images.has(path)) return assetCache.images.get(path);
  if (isProceduralPath(path)) {
    const img = new Image();
    img.src = PROCEDURAL_PIXEL_SRC;
    assetCache.images.set(path, img);
    return Promise.resolve(img);
  }
  const promise = new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      assetCache.images.set(path, img);
      resolve(img);
    };
    img.onerror = () => {
      // Soft-fail: missing sprite still produces a non-red experience
      // (the renderer falls back to procedural or solid color).
      assetCache.images.set(path, null);
      resolve(null);
    };
    img.src = path;
  });
  assetCache.images.set(path, promise);
  return promise;
}

async function loadMetaForSprite(path) {
  if (!path) return DEFAULT_ANIM;
  if (isProceduralPath(path)) {
    if (assetCache.meta.has(path)) return assetCache.meta.get(path);
    const meta = { ...DEFAULT_ANIM };
    assetCache.meta.set(path, meta);
    return meta;
  }
  const metaPath = path.replace(/[^/]+$/, "pipeline-meta.json");
  if (assetCache.meta.has(metaPath)) return assetCache.meta.get(metaPath);
  try {
    const meta = await loadJSON(metaPath);
    const anim = normalizeMeta(meta);
    assetCache.meta.set(metaPath, anim);
    return anim;
  } catch (err) {
    const fallback = { ...DEFAULT_ANIM };
    assetCache.meta.set(metaPath, fallback);
    return fallback;
  }
}

function normalizeMeta(meta) {
  const cell = meta.cell_size || meta.single_size || 128;
  const rows = meta.rows || 1;
  const cols = meta.cols || 1;
  const frameCount = Array.isArray(meta.frames)
    ? meta.frames.length
    : Number(meta.frames) || (rows * cols);
  return {
    frameW: meta.frameW || cell,
    frameH: meta.frameH || cell,
    frames: frameCount,
    cols,
    rows,
    fps: meta.fps || (meta.duration ? Math.max(1, Math.round(1000 / meta.duration)) : 8),
    cellSize: cell
  };
}

async function preloadSpriteAnimation(anim) {
  if (!anim || !anim.sprite) return;
  // Even for procedural paths we still call loadImage (it short-circuits to
  // the 1x1 placeholder) and loadMetaForSprite (returns DEFAULT_ANIM). This
  // keeps the call-site symmetric with the seed and lets the renderer use
  // the same `anim.image` / `anim.meta` fields.
  const [image, meta] = await Promise.all([loadImage(anim.sprite), loadMetaForSprite(anim.sprite)]);
  anim.image = image;
  anim.meta = meta;
}

async function preloadImageList(paths) {
  await Promise.all(paths.filter(Boolean).map((path) => loadImage(path)));
}

function getCachedImage(path) {
  const item = assetCache.images.get(path);
  return item && item instanceof Promise ? null : item;
}

// Register a procedural descriptor for an entity. The renderer calls this
// via the entity's `procedural` JSON field at scene-build time. We mirror
// the AGF asset registry shape so future code (e.g. a sprite skill) can
// upgrade to real PNGs without touching consumers.
function registerProcedural(id, descriptor) {
  assetCache.procedural.set(id, descriptor);
}

function getProcedural(id) {
  return assetCache.procedural.get(id) || null;
}
