# MapReader → lat/long

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

## Deploy to GitHub Pages

The repo is already a valid Pages site: static files, relative paths, and a
`.nojekyll` file so Jekyll doesn't touch the `vendor/` bundle.

```sh
gh repo create mapreader-georeferencer --public --source=. --push
```

Then in the repository: **Settings → Pages → Source: Deploy from a branch →
`main` / `root`**. The site appears at
`https://<user>.github.io/mapreader-georeferencer/` a minute later.

Pushing to `main` republishes it. Nothing needs to be built or installed on the
Pages side.

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
