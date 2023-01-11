import fs from 'node:fs';

const files = ['packages/lit-html/lit-html.js'];

const getURL = (path) => new URL(path, new URL(`../`, import.meta.url));

const replacer = (path) => {
  const url = getURL(path);
  const initialSource = fs.readFileSync(url).toString();
  let source = initialSource;
  switch (path) {
    case 'packages/lit-html/lit-html.js':
      source = source.replace(`window`, `globalThis`);
      break;
    default:
      return;
  }
  if (source === initialSource) return;
  fs.writeFileSync(url, source);
  console.log('Patched', path);
};

files.forEach(replacer);
