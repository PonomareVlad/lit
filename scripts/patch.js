import fs from "node:fs";

const files = [
  "packages/lit-html/lit-html.js",
  "packages/lit-html/is-server.js",
  "packages/lit-html/node/lit-html.js"
];

const getURL = path =>
  new URL(path, new URL(`../`, import.meta.url));

const replacer = path => {
  const url = getURL(path);
  const initialSource = fs.readFileSync(url).toString();
  let source = initialSource;
  switch (path) {
    case "packages/lit-html/lit-html.js":
      source = source.replace(
        `const i=window,{document:s}=i`,
        `const i=globalThis,{document:s,window}=i`
      );
      break;
    case "packages/lit-html/node/lit-html.js":
      source = source.replace(
        `const i=globalThis,{document:s}=i`,
        `const i=globalThis,{document:s,window}=i`
      );
      break;
    case "packages/lit-html/is-server.js":
      source = source.replace(
        `const o=!1;export{o as isServer};`,
        `const o=!0;export{o as isServer};`
      );
      break;
    default:
      return;
  }
  if (source === initialSource) return;
  fs.writeFileSync(url, source);
  console.log("Patched", path);
};

files.forEach(replacer);
