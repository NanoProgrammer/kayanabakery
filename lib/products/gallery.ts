/**
 * Which picture a product page is showing.
 *
 * Two things want to set it and they were not ordered: the image attached
 * to the chosen size or flavour, and the thumbnail the customer clicked.
 * The page read
 *
 *     choiceImage ?? images[activeImg]
 *
 * so the choice image always won. Clicking a thumbnail moved the selection
 * ring and changed nothing else — the big picture never moved, which is
 * exactly what Karyana filmed.
 *
 * The rule: a deliberate click beats an automatic one, until the customer
 * changes an option, at which point the option is the deliberate act and
 * takes the picture back.
 */
export type GalleryState = {
  /** Index into the product's images. */
  activeIndex: number;
  /** Whether the customer picked that thumbnail themselves. */
  pickedByHand: boolean;
};

export const initialGallery: GalleryState = { activeIndex: 0, pickedByHand: false };

/** A thumbnail click. Deliberate, so it wins. */
export function pickThumbnail(index: number): GalleryState {
  return { activeIndex: Math.max(0, index), pickedByHand: true };
}

/**
 * An option changed. The choice's own image takes over again, and the
 * gallery goes back to following it.
 */
export function optionChanged(): GalleryState {
  return { activeIndex: 0, pickedByHand: false };
}

/**
 * The image to show: the chosen thumbnail when the customer picked one,
 * otherwise the option's image, otherwise the first picture.
 */
export function visibleImage<T>({
  images,
  choiceImage,
  state,
}: {
  images: readonly T[];
  choiceImage: T | null | undefined;
  state: GalleryState;
}): T | null {
  if (state.pickedByHand) {
    return images[state.activeIndex] ?? images[0] ?? choiceImage ?? null;
  }
  return choiceImage ?? images[state.activeIndex] ?? images[0] ?? null;
}

/**
 * Which thumbnail to ring. It has to match what is actually on screen —
 * a ring on a picture you are not looking at is worse than no ring.
 */
export function highlightedIndex<T>({
  images,
  choiceImage,
  state,
}: {
  images: readonly T[];
  choiceImage: T | null | undefined;
  state: GalleryState;
}): number | null {
  const shown = visibleImage({ images, choiceImage, state });
  if (shown === null) return null;
  const index = images.indexOf(shown as T);
  // The option's image is often not one of the thumbnails at all; then
  // nothing is ringed, which is honest.
  return index === -1 ? null : index;
}
