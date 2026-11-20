/**
 * Which picture the product page shows.
 *
 *   npm run test:gallery
 *
 * From a video of the live site: clicking a thumbnail moved the selection
 * ring and the big picture never changed, because the option's image always
 * won over the customer's click.
 */
import {
  initialGallery,
  pickThumbnail,
  optionChanged,
  visibleImage,
  highlightedIndex,
} from "../lib/products/gallery";

let passed = 0;
let failed = 0;
function check(label: string, actual: unknown, expected: unknown) {
  if (JSON.stringify(actual) === JSON.stringify(expected)) {
    passed++;
    console.log(`  ✓ ${label}`);
  } else {
    failed++;
    console.log(`  ✗ ${label}`);
    console.log(`      expected: ${JSON.stringify(expected)}`);
    console.log(`      got:      ${JSON.stringify(actual)}`);
  }
}

const whole = "whole-cake.jpg";
const slice = "slice.jpg";
const images = [whole, slice];
const sizeImage = "size-8in.jpg";

console.log("\nThe product gallery\n");

console.log("  the bug Karyana filmed");
// Before: choiceImage ?? images[activeImg] — the click changed activeImg
// and the page still rendered the choice image.
const clicked = pickThumbnail(1);
check(
  "clicking the second thumbnail shows the second picture",
  visibleImage({ images, choiceImage: sizeImage, state: clicked }),
  slice
);
check(
  "...even though the size has a picture of its own",
  visibleImage({ images, choiceImage: sizeImage, state: clicked }) === sizeImage,
  false
);
check("...and the ring is on it", highlightedIndex({ images, choiceImage: sizeImage, state: clicked }), 1);

console.log("\n  before anyone clicks anything");
check(
  "the option's picture is shown when there is one",
  visibleImage({ images, choiceImage: sizeImage, state: initialGallery }),
  sizeImage
);
check(
  "the first picture when there is not",
  visibleImage({ images, choiceImage: null, state: initialGallery }),
  whole
);
// The option's image is usually not one of the thumbnails, so nothing is
// ringed — better than ringing a picture you are not looking at.
check("nothing is ringed for an off-gallery option image", highlightedIndex({ images, choiceImage: sizeImage, state: initialGallery }), null);
check("the first is ringed with no option image", highlightedIndex({ images, choiceImage: null, state: initialGallery }), 0);
check(
  "an option image that IS a thumbnail gets the ring",
  highlightedIndex({ images, choiceImage: slice, state: initialGallery }),
  1
);

console.log("\n  changing an option takes the picture back");
const afterOption = optionChanged();
check(
  "a new size shows the new size's picture",
  visibleImage({ images, choiceImage: sizeImage, state: afterOption }),
  sizeImage
);
check("...even right after a click", afterOption.pickedByHand, false);
check("...and the click is forgotten", afterOption.activeIndex, 0);

console.log("\n  going back to the first thumbnail is still a click");
const backToFirst = pickThumbnail(0);
check("it shows the first picture, not the option's", visibleImage({ images, choiceImage: sizeImage, state: backToFirst }), whole);
check("...and is remembered as deliberate", backToFirst.pickedByHand, true);

console.log("\n  nothing to show");
check("no pictures at all is null", visibleImage({ images: [], choiceImage: null, state: initialGallery }), null);
check("...and nothing is ringed", highlightedIndex({ images: [], choiceImage: null, state: initialGallery }), null);
check(
  "no pictures but an option image still shows it",
  visibleImage({ images: [], choiceImage: sizeImage, state: initialGallery }),
  sizeImage
);
// A stale index must not blank the page.
check(
  "an index past the end falls back to the first",
  visibleImage({ images, choiceImage: null, state: pickThumbnail(9) }),
  whole
);
check("a negative index is clamped", pickThumbnail(-3).activeIndex, 0);
check("one picture only", visibleImage({ images: [whole], choiceImage: null, state: initialGallery }), whole);

console.log(`\n  ${passed} passed, ${failed} failed\n`);
if (failed) process.exit(1);
