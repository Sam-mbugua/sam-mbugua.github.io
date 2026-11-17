#!/usr/bin/env node
/*
 * Offline alternative to the editor's Save button:
 * regenerates the editable regions of the pages from content/site.json.
 *
 *   node admin/build.js
 */
const fs = require("fs");
const path = require("path");
const { PAGES, buildPages, validate } = require("./render.js");

const root = path.join(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

const content = JSON.parse(read("content/site.json"));
const errors = validate(content);
if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

const templates = Object.fromEntries(Object.values(PAGES).map((file) => [file, read(file)]));
for (const [file, html] of Object.entries(buildPages(content, templates))) {
  fs.writeFileSync(path.join(root, file), html);
  console.log(`Updated ${file}`);
}
