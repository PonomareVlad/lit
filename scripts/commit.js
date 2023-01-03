import config from "../config.json" assert { type: "json" };
import { exec } from "node:child_process";

const { version, branch } = config;

const command = `git commit -a -m ${[branch, version].join(".")}`;

exec(command, (error, stdout, stderr) => {
  if (error) return console.error(error);
  if (stderr) console.error(stderr);
  if (stdout) console.log(stdout);
});
