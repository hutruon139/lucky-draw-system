const files = import.meta.glob("../assets/screens/*.jpg", { eager: true, import: "default" });

export const SCREEN_IMAGES = Object.values(files);

export function screenImage(prize, screen) {
  return files[`../assets/screens/${prize}-${screen}.jpg`];
}
