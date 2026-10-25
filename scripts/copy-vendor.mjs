// Copies browser runtime files that bundlers cannot resolve on their own into
// public/vendor, so they are served from our domain in dev and on Vercel:
// - MapLibre 6 resolves its web worker relative to its own module URL, which
//   the bundler rewrites; the map points setWorkerUrl() at this copy.
// - onnxruntime-web loads its WebAssembly runtime at run time from wasmPaths.
import { copyFileSync, mkdirSync } from "node:fs";
import path from "node:path";

// Direct dependencies are linked at node_modules/<name> (not every package exports package.json).
const distDe = (pkg) => path.join(process.cwd(), "node_modules", pkg, "dist");

const ARCHIVOS = [
  [distDe("maplibre-gl"), "maplibre-gl-worker.mjs", "vendor"],
  [distDe("onnxruntime-web"), "ort-wasm-simd-threaded.mjs", "vendor/ort"],
  [distDe("onnxruntime-web"), "ort-wasm-simd-threaded.wasm", "vendor/ort"],
];

for (const [origen, archivo, destino] of ARCHIVOS) {
  const dir = path.join(process.cwd(), "public", destino);
  mkdirSync(dir, { recursive: true });
  copyFileSync(path.join(origen, archivo), path.join(dir, archivo));
  console.log(`vendor: ${destino}/${archivo}`);
}
