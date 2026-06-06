# TypeScript and Bundling

The runtime loads JavaScript from tweak entry files. It does not transpile
TypeScript, JSX, or raw ESM imports at runtime.

Use `@codex-plusplus/sdk` for types, then bundle to CommonJS when you use
TypeScript, JSX, ESM `import` / `export`, npm dependencies, or renderer-side
Node built-ins.

Plain JavaScript renderer tweaks can be split across relative CommonJS or JSON
files without a bundle step:

```js
// index.js
const { render } = require("./src/render");
const defaults = require("./defaults.json");

module.exports = {
  start(api) {
    render(api, defaults);
  },
};
```

Relative `require()` paths are restricted to files inside the tweak directory.

## Install Dev Dependencies

```sh
npm i -D @codex-plusplus/sdk typescript esbuild
```

## TypeScript Source

`src/index.ts`:

```ts
import { defineTweak } from "@codex-plusplus/sdk";

export default defineTweak({
  start(api) {
    api.log.info("typed tweak", api.manifest.id);
  },
});
```

## Build for Renderer

```sh
npx esbuild src/index.ts \
  --bundle \
  --platform=browser \
  --format=cjs \
  --outfile=index.js
```

Use `--platform=browser` for renderer tweaks so Node built-ins do not leak into
the bundle by accident.

## Build for Main

```sh
npx esbuild src/index.ts \
  --bundle \
  --platform=node \
  --format=cjs \
  --outfile=index.js
```

Use `--platform=node` for main-process tweaks.

## Both-Process Builds

For simple tweaks, one dependency-light entry can branch:

```ts
import { defineTweak } from "@codex-plusplus/sdk";

export default defineTweak({
  start(api) {
    if (api.process === "main") {
      api.ipc.handle("ping", () => "pong");
      return;
    }

    api.settings?.registerPage({
      id: "main",
      title: "Ping",
      render(root) {
        const button = document.createElement("button");
        button.textContent = "Ping";
        button.onclick = async () => {
          button.textContent = await api.ipc.invoke("ping");
        };
        root.append(button);
      },
    });
  },
});
```

If renderer and main need different dependencies, keep the manifest entry as a
small CommonJS file. The main branch can `require()` Node/main bundles; the
renderer branch can `require()` relative CommonJS/JSON files inside the tweak
directory. Bundle renderer dependencies that are not local files.

```js
module.exports = {
  start(api) {
    if (api.process === "main") {
      return require("./dist/main.cjs").start(api);
    }

    return require("./src/renderer").start(api);
  },
  stop() {
    // Delegate if needed.
  },
};
```

For most `scope: "both"` tweaks, the simplest durable option is one bundled
entry that branches on `api.process`.

## Package Script

```json
{
  "scripts": {
    "build": "esbuild src/index.ts --bundle --platform=browser --format=cjs --outfile=index.js",
    "validate": "codexplusplus validate-tweak ."
  },
  "devDependencies": {
    "@codex-plusplus/sdk": "^1.0.0",
    "esbuild": "^0.28.0",
    "typescript": "^5.6.0"
  }
}
```

Run:

```sh
npm run build
codexplusplus validate-tweak .
```
