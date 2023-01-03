import config from "../config.json" assert { type: "json" };
import { exec } from "node:child_process";

const { branch, packages } = config;

const getPackageURL = path =>
  new URL(`../packages/${path}/`, import.meta.url);

const publishPackage = target => {
  const cwd = getPackageURL(target);
  const command = `npm publish --ignore-scripts --access=public --tag=${branch.trim()}`;
  exec(command, { cwd }, (error, stdout, stderr) => {
    if (error) return console.error(error);
    if (stderr) console.error(stderr);
    if (stdout) console.log(stdout);
  });
};

packages.forEach(publishPackage);
