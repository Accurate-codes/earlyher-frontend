/**
 * Lets the Node scripts in this folder import the app's TypeScript content directly:
 * resolves the "@/" path alias and extensionless imports to .ts files. Node (22.18+)
 * strips the type annotations itself. Used as: node --import ./scripts/ts-loader.mjs ...
 */
import { existsSync } from "node:fs";
import { register } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";

if (!process.argv.includes("--hooks")) {
  register(import.meta.url, { parentURL: import.meta.url, data: { root: pathToFileURL(fileURLToPath(new URL("../", import.meta.url))).href } });
}

let root = "";
export function initialize(data) {
  root = data?.root ?? "";
}

function withExtension(url) {
  const path = fileURLToPath(url);
  if (existsSync(path) && !path.endsWith("\\") && !path.endsWith("/") && /\.[cm]?[jt]sx?$/.test(path)) return url;
  for (const suffix of [".ts", ".tsx", "/index.ts"]) if (existsSync(path + suffix)) return url + suffix;
  return url;
}

export async function resolve(specifier, context, next) {
  if (root && specifier.startsWith("@/")) return next(withExtension(new URL(specifier.slice(2), root).href), context);
  if ((specifier.startsWith("./") || specifier.startsWith("../")) && context.parentURL?.startsWith("file:") && !context.parentURL.includes("node_modules")) {
    return next(withExtension(new URL(specifier, context.parentURL).href), context);
  }
  return next(specifier, context);
}
