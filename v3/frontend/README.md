# Enclosure interface

Run the backend on port 8000, then:

```sh
npm ci
npm run dev
```

The local interface is at <http://127.0.0.1:5173>. Vite proxies `/api` to the backend. Production builds use relative API URLs and must be served alongside that API.

```sh
npm test
npm run check
npm run build
```

The browser integration test uses the real backend and Vite server; start both first. It exercises all four door controls, parameter changes, supplier downloads and invalid-input handling.

```sh
npx playwright install chromium
npm run test:browser
```

For an existing Chromium installation, set `PLAYWRIGHT_CHROMIUM_EXECUTABLE` to its executable path. Screenshots and a downloaded order list are written to `../artifacts/`.

To test the production build served by the backend directly, run `npm run build`, start the backend, and use `PLAYWRIGHT_BASE_URL=http://127.0.0.1:8000 npm run test:browser`. This needs no Vite development server.

The renderer consumes world-space CAD meshes. It never makes engineering decisions. Parameter edits invalidate supplier downloads immediately, and server exports require the matching evaluated revision. Draft quotation files remain downloadable when verification is incomplete; their status remains visible.

Automatic verification is enabled initially. Turn it off to keep a live geometry preview without expensive checks. **Verify now** checks the latest inputs explicitly. Preview-only responses contain no report and cannot enable supplier downloads; changing inputs hides evidence from the previous revision immediately. Disabling automatic verification cancels queued client checks and ignores late responses (server computation already started may continue).
