// Coordinate projection that mirrors React Native's resizeMode="cover".
//
// All snap points are authored against the source background images, which are
// 1376×768. When that image is displayed in a container of a different size /
// aspect ratio with resizeMode="cover", the image is uniformly scaled to FILL
// the container (covering it), then center-cropped. To place an overlay element
// exactly on a feature in the background, we must apply the identical transform
// to the authored coordinate.

export const BASE_W = 1376;
export const BASE_H = 768;

// Returns { scale, offsetX, offsetY } describing how the BASE image is mapped
// into a containerW×containerH box under resizeMode="cover".
export function getCoverTransform(containerW, containerH, baseW = BASE_W, baseH = BASE_H) {
  // cover => scale up so BOTH dimensions are >= container, i.e. use the larger ratio
  const scale = Math.max(containerW / baseW, containerH / baseH);
  const displayedW = baseW * scale;
  const displayedH = baseH * scale;
  // image is centered, so the overflow is split evenly and clipped
  const offsetX = (containerW - displayedW) / 2;
  const offsetY = (containerH - displayedH) / 2;
  return { scale, offsetX, offsetY };
}

// Project a single authored point (in base-image space) to screen space.
export function projectPoint(rawX, rawY, containerW, containerH) {
  const { scale, offsetX, offsetY } = getCoverTransform(containerW, containerH);
  return {
    x: rawX * scale + offsetX,
    y: rawY * scale + offsetY,
  };
}

// Project a size (e.g. a sprite width authored against the base image).
export function projectSize(rawSize, containerW, containerH) {
  const { scale } = getCoverTransform(containerW, containerH);
  return rawSize * scale;
}

// Inverse of projectPoint: screen coords -> base-image coords.
export function unprojectPoint(screenX, screenY, containerW, containerH) {
  const { scale, offsetX, offsetY } = getCoverTransform(containerW, containerH);
  return {
    x: (screenX - offsetX) / scale,
    y: (screenY - offsetY) / scale,
  };
}
