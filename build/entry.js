// Bundle entry point. Exposes the small slice of @allmaps/transform that the
// app needs on `window.AllmapsTransform`, so index.html works straight from
// the filesystem (no module server, no CDN, no network).
export { GcpTransformer } from '@allmaps/transform'
