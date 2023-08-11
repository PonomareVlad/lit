import fs from 'node:fs';
import git from 'isomorphic-git';
import {spawnSync} from 'node:child_process';
import fork from '../fork.json' assert {type: 'json'};

const dir = '../';
const options = {fs, dir};
const {packages = {}} = fork;
const dirURL = new URL(dir, import.meta.url);

let version = 1;
const tags = await git.listTags(options);
const branch = await git.currentBranch(options);

if (typeof branch !== 'string') throw new Error('Empty branch');

const versionTags = tags.filter(tag => tag.startsWith(/** @type {string} */ branch));

if (versionTags.length) {
  const versions = versionTags.map(tag => parseInt(tag.replace(`${branch}-`, '')));
  version = Math.max(...versions) + 1;
}

const tag = `${branch}-${version}`;

console.log('🏷️', tag);

await git.tag({...options, ref: tag, force: true});

Object.entries(packages).forEach(([name, path]) => {
  const url = new URL(`${path}/`, dirURL);
  const packageURL = new URL('./package.json', url);
  const packageJSON = fs.readFileSync(packageURL);
  const packageData = JSON.parse(packageJSON.toString());
  const version = `${packageData.version.split('-', 1).at(0)}-${tag}`;
  console.log('📦', name, version, path);
  Object.assign(packageData, {name, version});
  fs.writeFileSync(packageURL, JSON.stringify(packageData, null, 2));
  const args = ['publish', `--tag=${branch}`, '--access=public'];
  const {status, stdout, stderr, error} = spawnSync('npm', args, {cwd: url});
  if (stdout.length) console.log(stdout.toString());
  if (stderr.stderr) console.log(stderr.toString());
  if (status !== 0) throw error || 'Non-zero exit code';
});
