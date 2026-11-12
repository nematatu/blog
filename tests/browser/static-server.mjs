import { createReadStream, existsSync, statSync } from "node:fs";
import http from "node:http";
import path from "node:path";

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css",
  ".js": "text/javascript",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".ico": "image/x-icon",
};

// ビルド済みの dist/ をそのまま配信するだけのテスト用サーバー。
export async function serveDist(root) {
  const server = http.createServer((request, response) => {
    const pathname = decodeURIComponent(
      new URL(request.url, "http://localhost").pathname,
    );
    let file = path.join(root, pathname);
    if (!file.startsWith(root)) return response.writeHead(403).end();
    if (existsSync(file) && statSync(file).isDirectory()) {
      file = path.join(file, "index.html");
    }
    if (!existsSync(file)) return response.writeHead(404).end();
    response.writeHead(200, {
      "Content-Type": TYPES[path.extname(file)] ?? "application/octet-stream",
    });
    createReadStream(file).pipe(response);
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  return {
    origin: `http://127.0.0.1:${server.address().port}`,
    close: () => new Promise((resolve) => server.close(resolve)),
  };
}
