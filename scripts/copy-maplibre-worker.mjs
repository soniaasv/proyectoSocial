// MapLibre 6 resolves its web worker relative to its own module URL, which a
// bundler rewrites. Serving the worker as a static file and pointing
// setWorkerUrl() at it keeps the map working in dev and on Vercel.
import { copyFileSync, mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

const require = createRequire(import.meta.url);
const pkg = require.resolve("maplibre-gl/package.json");
const source = path.join(path.dirname(pkg), "dist", "maplibre-gl-worker.mjs");
const target = path.join(process.cwd(), "public", "vendor", "maplibre-gl-worker.mjs");

mkdirSync(path.dirname(target), { recursive: true });
copyFileSync(source, target);
console.log(`maplibre worker -> ${path.relative(process.cwd(), target)}`);
