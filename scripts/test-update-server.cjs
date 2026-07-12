#!/usr/bin/env node

/**
 * Local Update Server for Testing
 *
 * This script serves the update files locally for testing the Tauri updater.
 *
 * Usage:
 *   1. Build your app: npm run tauri build
 *   2. Copy the built app to src-tauri/target/release/bundle/macos/
 *   3. Create a test latest.json with a higher version
 *   4. Run this server: bun run update:test-server
 *   5. Temporarily update tauri.conf.json to point to http://localhost:3000/updates/latest.json
 *   6. Run your app and test the update
 */

const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = 3000;
const UPDATES_DIR = path.join(
  __dirname,
  "../src-tauri/target/release/bundle/macos"
);

const MIME_TYPES = {
  ".json": "application/json",
  ".tar.gz": "application/gzip",
  ".zip": "application/zip",
};

const server = http.createServer((req, res) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);

  // CORS headers for local testing
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.url === "/updates/latest.json" || req.url === "/latest.json") {
    // Serve the latest.json file
    const latestJsonPath = path.join(__dirname, "../latest.json");

    if (!fs.existsSync(latestJsonPath)) {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end(
        "latest.json not found. Make sure it exists in the project root."
      );
      return;
    }

    const content = fs.readFileSync(latestJsonPath, "utf8");
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(content);
    return;
  }

  // Serve update files (tar.gz, zip, etc.)
  if (req.url.startsWith("/updates/")) {
    const fileName = path.basename(req.url);
    const filePath = path.join(UPDATES_DIR, fileName);

    if (!fs.existsSync(filePath)) {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end(`File not found: ${fileName}`);
      return;
    }

    const ext = path.extname(filePath);
    const contentType = MIME_TYPES[ext] || "application/octet-stream";
    const stat = fs.statSync(filePath);

    res.writeHead(200, {
      "Content-Type": contentType,
      "Content-Length": stat.size,
      "Content-Disposition": `attachment; filename="${fileName}"`,
    });

    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
    return;
  }

  // Health check
  if (req.url === "/") {
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(`
      <html>
        <head><title>Update Server</title></head>
        <body>
          <h1>Local Update Server</h1>
          <p>Server is running on port ${PORT}</p>
          <ul>
            <li><a href="/latest.json">/latest.json</a></li>
            <li><a href="/updates/latest.json">/updates/latest.json</a></li>
          </ul>
        </body>
      </html>
    `);
    return;
  }

  res.writeHead(404, { "Content-Type": "text/plain" });
  res.end("Not found");
});

server.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║         Local Update Server for Testing                  ║
╚═══════════════════════════════════════════════════════════╝

Server running on: http://localhost:${PORT}
Updates directory: ${UPDATES_DIR}

Endpoints:
  - http://localhost:${PORT}/latest.json
  - http://localhost:${PORT}/updates/latest.json
  - http://localhost:${PORT}/updates/[filename]

To test:
  1. Make sure latest.json exists in project root
  2. Make sure update files are in: ${UPDATES_DIR}
  3. Update tauri.conf.json endpoints to: ["http://localhost:${PORT}/updates/latest.json"]
  4. Run your app and check for updates

Press Ctrl+C to stop the server.
  `);
});
