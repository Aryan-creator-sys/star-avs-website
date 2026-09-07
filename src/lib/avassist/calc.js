// ============================================================================
//  STAR AV ASSIST — calculation engine (real geometry, no fabricated numbers)
//  All results are clearly flagged as approximate; installation dimensions must
//  be confirmed on site.
// ============================================================================

const ASPECTS = {
  "16:9": 16 / 9,
  "2.35:1": 2.35,
  "2.4:1": 2.4,
  "4:3": 4 / 3,
};

export function aspectRatioValue(aspect = "16:9") {
  return ASPECTS[aspect] || 16 / 9;
}

// Screen dimensions from a diagonal (inches) for a given aspect ratio.
export function screenDimensions(diagonalIn, aspect = "16:9") {
  const ar = aspectRatioValue(aspect);
  // diagonal² = w² + h², w = ar·h  ->  h = diag / √(ar²+1)
  const heightIn = diagonalIn / Math.sqrt(ar * ar + 1);
  const widthIn = heightIn * ar;
  return {
    diagonalIn: round(diagonalIn),
    widthIn: round(widthIn),
    heightIn: round(heightIn),
    widthFt: round(widthIn / 12, 2),
    heightFt: round(heightIn / 12, 2),
  };
}

// Diagonal (inches) from a screen width in feet.
export function diagonalFromWidthFt(widthFt, aspect = "16:9") {
  const ar = aspectRatioValue(aspect);
  const widthIn = widthFt * 12;
  const heightIn = widthIn / ar;
  return round(Math.sqrt(widthIn * widthIn + heightIn * heightIn));
}

// Throw distance range (feet) for a projector at a given screen diagonal.
// distance = imageWidth × throwRatio.
export function throwRangeForDiagonal(diagonalIn, projector, aspect = "16:9") {
  if (!projector || projector.throwRatioMin == null) return null;
  const { widthFt } = screenDimensions(diagonalIn, aspect);
  return {
    minFt: round(widthFt * projector.throwRatioMin, 2),
    maxFt: round(widthFt * projector.throwRatioMax, 2),
    widthFt,
  };
}

// Largest 16:9 diagonal a projector can throw at an available distance (feet).
// Using the widest lens setting (min throw ratio) gives the biggest image.
export function maxDiagonalForThrow(distanceFt, projector, aspect = "16:9") {
  if (!projector || !projector.throwRatioMin) return null;
  const widthFtMax = distanceFt / projector.throwRatioMin; // widest image
  const widthFtMin = distanceFt / projector.throwRatioMax; // narrowest image
  return {
    maxDiagonalIn: diagonalFromWidthFt(widthFtMax, aspect),
    minDiagonalIn: diagonalFromWidthFt(widthFtMin, aspect),
  };
}

// Recommended seating distance range for a screen diagonal (inches).
// Rule-of-thumb: 4K comfortable ≈ 1.0–1.5× diagonal; SMPTE/THX cinema ≈ 1.2–1.6×.
export function seatingDistanceFt(diagonalIn) {
  const ft = diagonalIn / 12;
  return { minFt: round(ft * 1.0, 2), maxFt: round(ft * 1.6, 2) };
}

// Is a projector bright enough for a room's ambient light + screen size?
// Editorial guidance from the projector's `ambientLight` score (1–5) vs need.
export function brightnessVerdict(projector, ambient /* 'dark'|'dim'|'bright' */) {
  const need = ambient === "bright" ? 4 : ambient === "dim" ? 3 : 2;
  if (projector.ambientLight == null) return { ok: null, text: "brightness suitability not specified" };
  const ok = projector.ambientLight >= need;
  return {
    ok,
    text: ok
      ? `bright enough for a ${ambient} room`
      : `may look washed out in a ${ambient} room — consider an ALR screen or more light control`,
  };
}

function round(n, dp = 1) {
  const f = Math.pow(10, dp);
  return Math.round(n * f) / f;
}
