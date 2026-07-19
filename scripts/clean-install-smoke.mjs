#!/usr/bin/env node

import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const home = await mkdtemp(join(tmpdir(), "oilpriceapi-gemini-home-"));
const env = {
  ...process.env,
  HOME: home,
  GEMINI_CLI_TRUST_WORKSPACE: "true",
  NO_COLOR: "1",
  OILPRICEAPI_KEY: "",
};

try {
  await execFileAsync(
    "gemini",
    [
      "extensions",
      "install",
      root,
      "--consent",
      "--skip-settings",
    ],
    { cwd: root, env, encoding: "utf8", timeout: 30_000 },
  );

  const installedManifest = JSON.parse(
    await readFile(
      join(
        home,
        ".gemini",
        "extensions",
        "oilpriceapi",
        "gemini-extension.json",
      ),
      "utf8",
    ),
  );
  if (installedManifest.version !== "2.0.0") {
    throw new Error("Clean install did not load Gemini extension 2.0.0.");
  }
  const { stdout, stderr } = await execFileAsync(
    "gemini",
    ["extensions", "list"],
    { cwd: root, env, encoding: "utf8", timeout: 30_000 },
  );
  const listing = `${stdout}\n${stderr}`;
  if (!listing.includes("oilpriceapi") || !listing.includes("2.0.0")) {
    throw new Error("Clean install is absent from Gemini extension listing.");
  }
  process.stdout.write("clean Gemini extension install smoke passed\n");
} finally {
  await rm(home, { recursive: true, force: true });
}
