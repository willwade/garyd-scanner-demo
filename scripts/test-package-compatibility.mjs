#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import {
  mkdirSync,
  mkdtempSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = fileURLToPath(new URL('..', import.meta.url));
const engineDirectory = join(repositoryRoot, 'packages', 'switch-scanner-engine');
const inputDirectory = join(repositoryRoot, 'packages', 'switch-input');
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';

function run(command, args, cwd) {
  execFileSync(command, args, { cwd, stdio: 'inherit' });
}

function packPackage(packageDirectory, destination) {
  const output = execFileSync(
    npmCommand,
    ['pack', '--json', '--pack-destination', destination],
    {
      cwd: packageDirectory,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'inherit'],
    },
  );
  const [packedPackage] = JSON.parse(output);

  return {
    archive: join(destination, packedPackage.filename),
    files: new Set(packedPackage.files.map((file) => file.path)),
  };
}

const temporaryRoot = mkdtempSync(join(tmpdir(), 'scan-engine-packages-'));
const archivesDirectory = join(temporaryRoot, 'archives');
const consumerDirectory = join(temporaryRoot, 'consumer');

try {
  mkdirSync(archivesDirectory);
  mkdirSync(consumerDirectory);

  const enginePackage = packPackage(engineDirectory, archivesDirectory);
  const inputPackage = packPackage(inputDirectory, archivesDirectory);

  for (const file of ['dist/scheduler.js', 'dist/scheduler.d.ts']) {
    if (!enginePackage.files.has(file)) {
      throw new Error(`scan-engine is missing ${file}`);
    }
  }

  writeFileSync(join(consumerDirectory, 'package.json'), '{}\n');

  run(
    npmCommand,
    [
      'install',
      '--ignore-scripts',
      '--no-audit',
      '--no-fund',
      enginePackage.archive,
      inputPackage.archive,
    ],
    consumerDirectory,
  );
  run(
    process.execPath,
    [
      '--input-type=module',
      '--eval',
      "import { GestureEngine } from 'switch-input'; new GestureEngine().dispose();",
    ],
    consumerDirectory,
  );

  console.log('Packed scan-engine and switch-input are compatible.');
} finally {
  rmSync(temporaryRoot, { recursive: true, force: true });
}
