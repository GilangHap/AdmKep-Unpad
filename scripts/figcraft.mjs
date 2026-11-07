#!/usr/bin/env node
// figcraft MCP client over stdio.
//   node scripts/figcraft.mjs                 -> demo diagram -> diagrams/demo.svg
//   node scripts/figcraft.mjs spec.json       -> your spec
//   node scripts/figcraft.mjs spec.json --out diagrams/x.png
// The MCP server writes the file itself; its reply is a status string, not SVG.

import { spawn } from "node:child_process";
import { readFile, mkdir, stat } from "node:fs/promises";
import path from "node:path";

const argv = process.argv.slice(2);
const outIdx = argv.indexOf("--out");
const out = path.resolve(outIdx >= 0 ? argv[outIdx + 1] : "diagrams/demo.svg");
const specPath = argv.find((a, i) => !a.startsWith("--") && i !== outIdx + 1);

const DEMO = {
  width: 900,
  height: 320,
  bg: "#ffffff",
  fontFamily: "Segoe UI, Inter, sans-serif",
  elements: [
    { id: "client", type: "rect", label: "**opencode**", pos: [40, 130], size: [150, 60], fill: "#e3f2fd", stroke: "#1565c0", radius: 8 },
    { id: "mcp", type: "rect", label: "MCP stdio", pos: [270, 130], size: [150, 60], fill: "#fff8e1", stroke: "#f9a825", radius: 8 },
    { id: "fig", type: "rect", label: "figcraft", pos: [500, 130], size: [150, 60], fill: "#e8f5e9", stroke: "#2e7d32", radius: 8 },
    { id: "out", type: "cylinder", label: "SVG / PNG / PDF", pos: [730, 130], size: [150, 60], fill: "#f3e5f5", stroke: "#6a1b9a" },
  ],
  arrows: [
    { from: "client", to: "mcp", label: "tools/call", fromSide: "right", toSide: "left" },
    { from: "mcp", to: "fig", label: "create_diagram", fromSide: "right", toSide: "left" },
    { from: "fig", to: "out", label: "export", fromSide: "right", toSide: "left" },
  ],
};

const spec = specPath ? JSON.parse(await readFile(specPath, "utf8")) : DEMO;
spec.export = { fit: true, margin: 24, ...(spec.export ?? {}), path: out };

await mkdir(path.dirname(out), { recursive: true });

const NPM_ARGS = ["-y", "-p", "figcraft", "figcraft-mcp"];
const [cmd, cmdArgs] = process.platform === "win32"
  ? ["cmd.exe", ["/d", "/s", "/c", "npx", ...NPM_ARGS]]
  : ["npx", NPM_ARGS];

const child = spawn(cmd, cmdArgs, { stdio: ["pipe", "pipe", "pipe"], windowsHide: true });

let buf = "";
const send = (m) => child.stdin.write(JSON.stringify(m) + "\n");
child.stderr.on("data", (d) => process.stderr.write(d));

child.stdout.on("data", async (chunk) => {
  buf += chunk.toString();
  let nl;
  while ((nl = buf.indexOf("\n")) >= 0) {
    const line = buf.slice(0, nl).trim();
    buf = buf.slice(nl + 1);
    if (!line) continue;
    let msg;
    try { msg = JSON.parse(line); } catch { continue; }
    if (msg.id === 1) {
      send({ jsonrpc: "2.0", method: "notifications/initialized", params: {} });
      send({ jsonrpc: "2.0", id: 2, method: "tools/call", params: { name: "create_diagram", arguments: spec } });
    } else if (msg.id === 2) {
      const text = (msg.result?.content ?? []).map((c) => c.text ?? "").join("\n");
      if (msg.error) { console.error("mcp error: " + JSON.stringify(msg.error)); process.exit(1); }
      try {
        const s = await stat(out);
        console.log(text.trim());
        console.log("ok " + out + " (" + s.size + " bytes)");
        process.exit(0);
      } catch {
        console.error("server replied but wrote nothing:\n" + text);
        process.exit(1);
      }
    }
  }
});

send({ jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "opencode-cli", version: "1" } } });
setTimeout(() => { console.error("timeout: no response from figcraft mcp"); process.exit(1); }, 90000);
