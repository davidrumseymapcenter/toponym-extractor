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
   - **CSV** — one row per detection: text, score, label centre lat/long, pixel
     centre, vertex count, any other MapReader properties, and the full outline
     as WKT.
   - **GeoJSON (outlines)** — every polygon vertex transformed to WGS84. Drops
     straight into QGIS.
   - **GeoJSON (label points)** — one point per detection, at the label centre.

### Accuracy depends on the georeferencing

Every coordinate this app produces inherits the accuracy of the annotation it
was given. The transformation is applied faithfully, but a loose or sparse set
of ground control points yields confidently wrong lat/long, and nothing in the
output looks any different from a good result.

Two things are worth checking before trusting a batch:

- **The fit of the control points.** In Allmaps Editor, GCPs placed roughly, or
  clustered in one part of the sheet, leave the rest of the map unconstrained.
  Errors grow with distance from the nearest control point.
- **A few known locations.** Compare against a modern basemap using sharp
  features — river confluences, coastal points — rather than place labels. A
  label is a large object drawn *beside* its symbol, so on a sheet at, say,
  0.24 km per pixel a label can be tens of kilometres wide; comparing its
  centre to a town's true position measures cartographic convention as much as
  georeferencing error.

Transformation type is rarely the fix. With a modest number of GCPs the
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

Two warnings to watch for there:

- **`all exactly 1`** or **`whole numbers only`** — the values were rounded away
  upstream, so filtering cannot work. A GIS round-trip that typed the column as
  an integer does this.
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
— GitHub Pages serves the files as they are, with no build step. The repo has
to stay public: serving Pages from a private repository requires a paid
organisation plan.

## Develop

```sh
npm install
npm run build   # regenerate vendor/allmaps-transform.js from @allmaps/transform
npm test        # end-to-end smoke test in jsdom
```

`npm run build` bundles `build/entry.js` with esbuild into an IIFE that exposes
`window.AllmapsTransform.GcpTransformer`. It is committed on purpose — the
deployed site has no build step, and the app keeps working offline.

`npm test` loads `index.html` in jsdom, drives the real UI controls with the
sample files, and checks the table, the score filter, sorting, the Y-axis
handling and all three downloads. Re-run it after changing `app.js`.

Note: `@allmaps/annotation` is deliberately **not** a dependency. Its current
beta throws on load with recent `zod` versions, and the annotation format is
small enough to parse directly (see `parseAnnotation` in `app.js`), which also
keeps the bundle to the transform maths alone.

## Files

| Path | Purpose |
| --- | --- |
| `index.html`, `styles.css`, `app.js` | the app |
| `vendor/allmaps-transform.js` | bundled `@allmaps/transform` (generated, committed) |
| `build/entry.js` | bundle entry point |
| `samples/` | example annotation + MapReader detections with negative Y |
| `test/smoke.mjs` | jsdom end-to-end test |
