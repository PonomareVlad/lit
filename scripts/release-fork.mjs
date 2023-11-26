import fs from 'node:fs';
import git from 'isomorphic-git';
import {spawnSync} from 'node:child_process';
import fork from '../fork.json' assert {type: 'json'};

const dir = '.';
const options = {fs, dir};
const {packages = {}} = fork;

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
  const url = new URL(`../${path}/`, import.meta.url);
  const packageURL = new URL('./package.json', url);
  const packageJSON = fs.readFileSync(packageURL);
  const packageData = JSON.parse(packageJSON.toString());
  const version = `${packageData.version.split('-', 1).at(0)}-${tag}`;
  Object.assign(packageData, {name, version});
  console.log('📦', name, version, path);
  fs.writeFileSync(packageURL, JSON.stringify(packageData, null, 2));
});

const args = ['run', 'update-version-vars'];
const spawnOptions = {cwd: new URL('..', import.meta.url)};
const {stdout, stderr, error} = spawnSync('npm', args, spawnOptions);
if (stdout.length) console.debug(stdout.toString());
if (stderr.stderr) console.error(stderr.toString());
if (error) console.error(error);

Object.values(packages).forEach(path => {
  const url = new URL(`../${path}/`, import.meta.url);
  const args = ['publish', `--tag=${branch}`, '--access=public'];
  const {stdout, stderr, error} = spawnSync('npm', args, {cwd: url});
  if (stdout.length) console.debug(stdout.toString());
  if (stderr.stderr) console.error(stderr.toString());
  if (error) console.error(error);
});