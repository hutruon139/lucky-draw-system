const files = import.meta.glob("../assets/screens/*.jpg", { eager: true, import: "default" });

export function screenImage(prize, screen) {
  return files[`../assets/screens/${prize}-${screen}.jpg`];
}

// Decode every screen and the font up front so switching screens on stage never flashes.
export function preloadAssets() {
  for (const src of Object.values(files)) {
    const image = new Image();
    image.src = src;
    image.decode?.().catch(() => {});
  }
  document.fonts?.load('700 100px "Gotham Rounded"').catch(() => {});
}
