import fs from "node:fs";

const url = new URL(`../config.json`, import.meta.url);
const meta = JSON.parse(fs.readFileSync(url).toString());
meta.version++;
fs.writeFileSync(url, JSON.stringify(meta, null, 2));
