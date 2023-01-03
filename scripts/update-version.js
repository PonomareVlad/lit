import config from "../config.json" assert { type: "json" };
import fs from "node:fs";

const { version, branch, packages } = config;

const getPackageURL = path =>
  new URL(`../packages/${path}/package.json`, import.meta.url);

const updateVersion = target => {
  try {
    const url = getPackageURL(target);
    const meta = JSON.parse(fs.readFileSync(url).toString());
    const [legacy] = meta.version.split("-");
    const feature = [branch, version].join(".");
    meta.version = [legacy, feature].join("-");
    fs.writeFileSync(url, JSON.stringify(meta, null, 2));
  } catch (e) {
    console.error(e);
  }
};

packages.forEach(updateVersion);
