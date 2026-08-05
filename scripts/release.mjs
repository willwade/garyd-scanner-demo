#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const ROOT = process.cwd();

const PACKAGES = {
  engine: join(ROOT, 'packages', 'switch-scanner-engine'),
  dom: join(ROOT, 'packages', 'scan-engine-dom'),
  react: join(ROOT, 'packages', 'react-scan-engine'),
  input: join(ROOT, 'packages', 'switch-input'),
};

function run(cmd, args, cwd = ROOT) {
  const result = spawnSync(cmd, args, {
    cwd,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function writeJson(path, data) {
  writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

function packageJsonPath(dir) {
  return join(dir, 'package.json');
}

function prepare(versionArg) {
  if (!versionArg) {
    console.error('Usage: npm run release:prepare -- <patch|minor|major|x.y.z>');
    process.exit(1);
  }

  run('npm', ['version', versionArg, '--no-git-tag-version'], PACKAGES.engine);
  run('npm', ['version', versionArg, '--no-git-tag-version'], PACKAGES.dom);
  run('npm', ['version', versionArg, '--no-git-tag-version'], PACKAGES.react);
  run('npm', ['version', versionArg, '--no-git-tag-version'], PACKAGES.input);

  const enginePkgPath = packageJsonPath(PACKAGES.engine);
  const domPkgPath = packageJsonPath(PACKAGES.dom);
  const reactPkgPath = packageJsonPath(PACKAGES.react);
  const inputPkgPath = packageJsonPath(PACKAGES.input);

  const enginePkg = readJson(enginePkgPath);
  const domPkg = readJson(domPkgPath);
  const reactPkg = readJson(reactPkgPath);
  const inputPkg = readJson(inputPkgPath);

  const newVersion = enginePkg.version;
  domPkg.dependencies = domPkg.dependencies || {};
  domPkg.dependencies['scan-engine'] = `^${newVersion}`;
  reactPkg.dependencies = reactPkg.dependencies || {};
  reactPkg.dependencies['scan-engine'] = `^${newVersion}`;
  inputPkg.peerDependencies = inputPkg.peerDependencies || {};
  inputPkg.peerDependencies['scan-engine'] = `^${newVersion}`;

  writeJson(domPkgPath, domPkg);
  writeJson(reactPkgPath, reactPkg);
  writeJson(inputPkgPath, inputPkg);

  run('npm', ['install']);
  run('npm', ['run', 'build:engine']);
  run('npm', ['run', 'build:engine-dom']);
  run('npm', ['run', 'build:react']);
  run('npm', ['run', 'build:input']);

  console.log(`Prepared release version ${newVersion}.`);
  console.log('Next steps: commit, tag, and run `npm run release:publish`.');
}

function publish() {
  run('npm', ['publish', '--access', 'public'], PACKAGES.engine);
  run('npm', ['publish', '--access', 'public'], PACKAGES.dom);
  run('npm', ['publish', '--access', 'public'], PACKAGES.react);
  run('npm', ['publish', '--access', 'public'], PACKAGES.input);
}

function full(versionArg) {
  prepare(versionArg);
  publish();
}

const [, , mode, versionArg] = process.argv;

if (mode === 'prepare') {
  prepare(versionArg);
} else if (mode === 'publish') {
  publish();
} else if (mode === 'full') {
  full(versionArg);
} else {
  console.error('Usage: npm run release:{prepare|publish|full} -- [patch|minor|major|x.y.z]');
  process.exit(1);
}
