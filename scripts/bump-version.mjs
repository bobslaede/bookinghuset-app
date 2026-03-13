import { readFileSync, writeFileSync } from 'fs';

const version = process.argv[2];
if (!version || !/^\d+\.\d+\.\d+$/.test(version)) {
  console.error('Usage: bun run version:bump <major.minor.patch>');
  console.error('Example: bun run version:bump 0.2.0');
  process.exit(1);
}

const files = [
  {
    path: 'package.json',
    replace: (content) => content.replace(/"version": "[^"]+"/, `"version": "${version}"`),
  },
  {
    path: 'src-tauri/tauri.conf.json',
    replace: (content) => content.replace(/"version": "[^"]+"/, `"version": "${version}"`),
  },
  {
    path: 'src-tauri/Cargo.toml',
    replace: (content) => content.replace(/^version = "[^"]+"/m, `version = "${version}"`),
  },
];

for (const file of files) {
  const content = readFileSync(file.path, 'utf-8');
  const updated = file.replace(content);
  if (content === updated) {
    console.warn(`⚠ No change in ${file.path}`);
  } else {
    writeFileSync(file.path, updated);
    console.log(`✓ ${file.path} → ${version}`);
  }
}

console.log(`\nVersion bumped to ${version}`);
console.log(`Next: git commit and tag with: git tag v${version}`);
