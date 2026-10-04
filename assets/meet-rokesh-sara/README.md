# Meet Rokesh & Sara photo gallery

The carousel uses the optimized JPEGs in this folder. Replace an image with another optimized JPEG using the same filename to swap that slide:

- `rokesh-sara-traditional.jpg`
- `rokesh-sara-selfie.jpg`
- `rokesh-sara-winter-trip.jpg`
- `rokesh-sara-together.jpg`
- `rokesh-sara-evening.jpg`

## Add another slide

1. Add an optimized JPEG to this folder, for example `rokesh-sara-beach.jpg`.
2. In `index.html`, find the `couple-gallery-dots` group and duplicate a `couple-gallery-dot` button.
3. Update its `aria-label`, `data-src`, `data-alt`, and `data-caption`. Set `data-src` to `assets/meet-rokesh-sara/rokesh-sara-beach.jpg`.
4. The carousel reads the buttons automatically, so swiping, arrows, and dots include the new photo.

Original `.jpeg` and `.HEIC` files you place here stay local and are excluded from Git by this folder’s `.gitignore`. The page uses the optimized `.jpg` copies. This avoids publishing the large originals and their camera metadata. Two HEIC files added in this folder could not be rendered correctly during conversion, so they are not in the carousel yet; re-export them as JPEG if you want those included.

The carousel markup is in `index.html`; swipe behavior is in `couple-gallery.js`; styling is in `long-distance.css`.
