# Toponym Extractor

A static web app that turns [MapReader](https://github.com/Living-with-machines/MapReader)
text detections — whose coordinates are **image pixels** — into a
latitude/longitude table, by applying the ground control points from an
[Allmaps](https://allmaps.org) Georeference Annotation.

Everything runs in the browser. Files are read with `FileReader` and never
uploaded; the only optional network calls are fetching an annotation by URL and
loading tiles for the map preview.

## Use it

1. **Georeference the map** in [Allmaps Editor](https://editor.allmaps.org) and
   save. That produces a Georeference Annotation (a `.json` file holding the
   GCPs and the transformation type). Download it, or copy its
   `https://annotations.allmaps.org/maps/…` URL.
2. **Load the MapReader detections** — the GeoJSON whose polygons are in pixel
   coordinates.
3. **Set the minimum confidence score.** MapReader's `score` is how sure the
   text-recognition stage is about the transcription, from 0 to 1. Detections
   below the threshold are dropped before anything is transformed.
4. **Convert**, then download:
   - **CSV** — one row per detection: text, score, label center lat/long, pixel
     center, vertex count, any other MapReader properties, and the full outline
     as WKT.
   - **GeoJSON (outlines)** — every polygon vertex transformed to WGS84. Compatible with QGIS.
   - **GeoJSON (label points)** — one point per detection, at the label center.
5. **Show map preview** to see the historical map itself, warped live from its
   IIIF tiles, with the detections on top and a slider to fade it against the
   basemap.

### Accuracy depends on the georeferencing

Every coordinate this app produces inherits the accuracy of the annotation it
was given. The transformation is applied faithfully, but a loose or sparse set
of ground control points yields confidently wrong lat/long, and nothing in the
output looks any different from a good result.

Things to check before trusting a batch:

- **The fit of the control points.** In Allmaps Editor, GCPs placed roughly, or
  clustered in one part of the sheet, leave the rest of the map unconstrained.
  Errors grow with distance from the nearest control point.
- **A few known locations.** Compare against a modern basemap using sharp
  features — river confluences, coastal points — rather than place labels. A
  label is a large object drawn *beside* its symbol, so on a sheet at, say,
  0.24 km per pixel a label can be tens of kilometers wide; comparing its
  center to a town's true position measures cartographic convention as much as
  georeferencing error.

Transformation type is unlikely to be a factor. With a modest number of GCPs the
flexible options overfit: on a 12-GCP annotation tested here, leave-one-out
cross-validation put `helmert` and `polynomial1` around 10–11 km mean error,
while `polynomial3` reached 95 km. More or better-distributed control points
help; a fancier transformation usually does not.

### Which score gets used

Text-spotting pipelines often emit two confidences per detection: a **detection**
score (is there text in this box?) and a **recognition** score (did I read the
characters right?). The detection score sits close to 1.0 for almost every box
that survives thresholding, so it is useless as a quality filter.

The app therefore always prefers a recognition field — anything named like
`rec_score`, `text_conf`, `ocr_confidence` — and only falls back to generic
names (`score`, `confidence`, `prob`). Fields that look like detection scores
are never filtered on, but they are kept as their own column so you can see
them. The status line under the file input names the field it chose, its range,
and how many distinct values it holds:

```
2,481 features loaded · 2,481 with a "rec_score" (range 0.12–0.99, 318 distinct
values); not filtering on det_score — shown as its own column instead
```

Two warnings to watch for:

- **`all exactly 1`** or **`whole numbers only`** — the values may have been rounded away
  upstream, so filtering cannot work. 
- **`no recognition score found`** — no usable numeric field at all; every
  detection is then treated as unscored.

Scores are shown and exported exactly as they appear in the input file, with no
rounding or padding, since that column is how you judge the data.

The threshold control reports what it will actually do to the file you loaded,
updating as you drag it, so a threshold can be chosen by its effect rather than
by guesswork:

```
Scores run 0.4–1, median 0.84. At 0.75 this drops 3,259 of 9,552 (34%),
keeping 6,293.
```

When every detection in a file carries the same score — as in the
davidrumsey.com exports, where all of them are `1` — the control switches off
and says why, rather than appearing to filter while doing nothing. The stored
threshold is not applied in that state, so a file whose scores were all `0.5`
cannot silently lose every row.

### Reloading the annotation after an edit

Reviewing the output often shows the georeferencing needs work — control points
to add, or a mask to draw. **Reload annotation**, next to the downloads,
re-fetches the annotation from its URL and converts again without touching the
loaded detections. The loop is: convert, review, fix it in Allmaps Editor, save,
reload.

It appears once an annotation has been loaded from a URL (paste the
`annotations.allmaps.org/…` address and press Fetch). A file-loaded annotation
cannot be re-read without picking the file again, so the button stays hidden.

The status line reports what changed, because a reload that did nothing looks
exactly like one that worked:

```
12 ground control points · transformation: polynomial1 · image 8952×6840 px ·
from reloaded URL · changed: control points 4 → 5, mask added, covering 68%
```

or `unchanged from the previous version` when the edit did not land.

Requests carry a cache-busting parameter and `no-store`. Without it,
`annotations.allmaps.org` serves `s-maxage=300, stale-while-revalidate=3600`
through its CDN, so a reload could return an annotation up to five minutes old —
which would look exactly like an edit that failed to save. Measured cost of
bypassing the cache: none worth noting, about a second either way.

If the map preview is open it is rebuilt around the new control points, so the
overlay moves as the georeferencing changes.

### When the detections came from a different image

Pixel coordinates only mean something against the image they were measured on.
Run MapReader on one scan and georeference another, and every coordinate is off
by the ratio between them — with no error, because the numbers are all still
inside the image bounds. The displacement grows with distance from the pixel
origin, so it reads as a drift toward the top-left corner of the sheet.

A real example: detections from a David Rumsey scan (9196 × 7979) against an
annotation georeferencing the Internet Archive scan (11030 × 8974) put every
toponym about 16 km west and 9 km north. Supplying the source image size fixed
it:

| | mean error at four verified towns |
| --- | --- |
| uncorrected | 19.3 km |
| scaled by the width ratio (×1.1994) | 3.0 km |

3.0 km is the floor here — that annotation's own GCP misfit is ~3.3 km mean.

Open **Measured on a different image?** under the detections and either drop the
image or type its size. Dropping it reads only the header, so dimensions come
back instantly even from a 400 MB TIFF that no browser could decode; JPEG, PNG,
TIFF, GIF and WebP are understood.

**Only the width ratio is applied, to both axes.** Different renditions of one
scan are related by a uniform scale, and scaling the axes independently would
shear the geometry. When the two images have different proportions — as above,
1.153 against 1.229 — they are cropped differently as well as resized, no single
scale is exact, and the app says so. Fitting scale *and* offset freely to those
four towns landed on ×1.1799 with offsets of 11 and −32 pixels, so the crop
difference is almost entirely extra bottom margin rather than a shifted origin.

The app cannot detect this on its own: your GeoJSON carries only `text` and
`score`, nothing about the source image. A bounds check would not have caught
the example above (the coordinates span just 74% × 85% of the annotation's
image), and choosing the scale that best fits the mask is no help either — 47%
of detections fell outside the mask at the wrong scale and 48% at the right one,
because the margin index table dominates.

### Trimming to the Allmaps mask

The annotation carries the polygon drawn in Allmaps Editor around the
cartographic area, as an `SvgSelector` in resource coordinates. With **Discard
detections outside the mask** ticked — the default — any detection whose center
falls outside that polygon is dropped before transformation, which removes
titles, legends, imprints and credits.

Two things to know:

- A mask that traces the whole sheet trims nothing. That is what Allmaps stores
  when nobody adjusted it, and the app says so: *"4-point mask covering 100% of
  the image — it traces the whole sheet"*. To benefit, draw the mask around the
  map area in the Editor.
- The test is on the label's center, not its whole outline, so a label
  straddling the neatline is kept or dropped as a whole.

If the Y axis setting is wrong, every center lands outside the mask and
everything is discarded — a loud signal that the axis, not the mask, is the
problem.

### Seeing the historical map

The preview renders the map itself with
[@allmaps/leaflet](https://github.com/allmaps/allmaps/tree/main/packages/leaflet),
warping its IIIF tiles in WebGL2 using the same annotation that produced the
coordinates. The slider fades it from 100% to 0% against OpenStreetMap, which is
the quickest way to judge a georeference: misplaced control points are obvious
the moment the coastline does not line up.

This is the one feature that needs the image service to be reachable. It also
needs WebGL2, and the viewer bundle (about a megabyte) is loaded only when the
preview is first opened.

**Not every IIIF server serves tiles.** David Rumsey's LUNA returns `info.json`
instantly but currently times out on region requests, which leaves a blank
overlay; the app waits 15 seconds for a first tile and then says which host went
quiet. Internet Archive-hosted maps (`iiif.archive.org`) render fine. Nothing
about the coordinates, table or downloads depends on this.

Note the committed `samples/annotation.example.json` points at
`iiif.archivelab.org`, which no longer resolves — the sample exercises the
math, not the overlay.

### The text filter

A substring match anywhere in the transcription, ignoring both case and
accents. `bou` finds `Diambour`, `Tombouctou` and `##Bouna`; `segou` finds
`SEGOU`, `Segouro` and `Ségouba`, and so does `ségou`. Diacritics are stripped
from the query and the text alike, which matters on these sheets: about 6% of
detections carry accented characters, and the same place is spelled both ways
across a corpus.

### The Y axis matters

Allmaps resource coordinates are image pixels: origin top-left, Y growing
**downward**. MapReader output that has been through a GIS often has Y negative
or measured upward instead — the sample data in `samples/` shows the negative
case. If the axis is wrong the output is mirrored, so the app auto-detects the
all-negative case and lets you override the choice under **Pixel Y axis**.

### Transformation type

The app reads the transformation Allmaps recorded (`polynomial1`, `helmert`,
`thinPlateSpline`, …) and uses that by default, so results match what you saw
in the Editor. You can override it to compare, but each type has a minimum
number of GCPs (`polynomial2` needs 6, `polynomial3` needs 10) and you'll get an
error if the annotation has too few.

Coordinates are transformed point-by-point with no midpoint refinement
(`maxDepth` stays at its default of 0), so an outline comes back with exactly
the vertices it went in with.

## Run locally

Open `index.html` directly in a browser — no server needed, no build step. The
transform library is committed as a bundled file in `vendor/`.

Or, with a server:

```sh
npm run serve   # http://localhost:8000
```

## Deploy

Pushing to `main` republishes <https://davidrumseymapcenter.github.io/toponym-extractor/>
— GitHub Pages serves the files as they are, with no build step. 

## Develop

```sh
npm install
npm run build   # regenerate vendor/allmaps-transform.js from @allmaps/transform
npm test        # end-to-end smoke test in jsdom
```

`npm run build` bundles `build/entry.js` with esbuild into an IIFE that exposes
`window.AllmapsTransform.GcpTransformer`. It is committed on purpose — the
deployed site has no build step, and the app keeps working offline.

`npm test` first verifies the vendor bundles actually execute and export what
the app expects, then loads `index.html` in jsdom and drives the real UI
controls, checking the table, the score filter, the mask trimming, sorting, the
Y-axis handling, all three downloads, and the map preview's wiring.

The vendor check exists because a bundle can build cleanly and still throw on
load: `@allmaps/annotation`'s schemas break under zod >= 4.5, which silently
produced a one-megabyte file that exported nothing. `overrides.zod` in
`package.json` pins 4.4.3, the last version that works — note that 4.4.6 does
not exist on npm, so a bad pin fails open and leaves whatever was installed.

jsdom has no WebGL, so `npm test` can only cover the wiring around the warped
map layer. To confirm the map actually draws:

```sh
npm run serve          # in one terminal
npm run check:browser  # drives headless Chrome, writes PNGs to /tmp
```

That harness measures the map region's brightness at 100% and 0% opacity: no
change means the overlay drew nothing. Point it at other data with
`PIXELS_URL=` and `ANNOTATION_URL=`.

Note: `@allmaps/annotation` is deliberately **not** a dependency. Its current
beta throws on load with recent `zod` versions, and the annotation format is
small enough to parse directly (see `parseAnnotation` in `app.js`), which also
keeps the bundle to the transform math alone.

## Files

| Path | Purpose |
| --- | --- |
| `index.html`, `styles.css`, `app.js` | the app |
| `vendor/allmaps-transform.js` | bundled `@allmaps/transform` (generated, committed) |
| `vendor/allmaps-leaflet.js` | bundled `@allmaps/leaflet` + Leaflet, loaded on demand |
| `vendor/leaflet.css` | Leaflet's stylesheet, copied from the package |
| `build/entry.js`, `build/leaflet-entry.js` | bundle entry points |
| `samples/` | example annotation + MapReader detections with negative Y |
| `test/smoke.mjs` | jsdom end-to-end test |
| `test/vendor-check.mjs` | asserts the vendor bundles load and export |
| `test/browser-check.mjs` | real-Chrome visual check of the map overlay |
