import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { delimiter, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const script = fileURLToPath(new URL('./update-manifest.sh', import.meta.url));
const oldManifest = '{"version":"1.2.2"}\n';
const exeHash = 'a'.repeat(64);
const engineHash = 'b'.repeat(64);
const defaultChecksums = `${exeHash}  flisk-windows-amd64.exe
${engineHash}  flisk-cli-engine.tar.gz`;

function update(t, jqFails, checksums = defaultChecksums) {
  const root = mkdtempSync(join(tmpdir(), 'scoop-update-test-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const bin = join(root, 'bin');
  const manifest = join(root, 'bucket', 'flisk.json');
  mkdirSync(bin);
  mkdirSync(join(root, 'bucket'));
  writeFileSync(manifest, oldManifest);
  writeFileSync(join(bin, 'curl'), `#!/bin/sh
[ "$2" = "https://github.com/flisk-sh/releases/releases/download/v1.2.3/checksums.txt" ] || exit 1
cat <<'EOF'
${checksums}
EOF
`, { mode: 0o755 });
  if (jqFails) {
    writeFileSync(join(bin, 'jq'), '#!/bin/sh\nprintf "{\\"version\\":"\nexit 2\n', { mode: 0o755 });
  }
  const result = spawnSync('bash', [script, 'v1.2.3'], {
    cwd: root,
    encoding: 'utf8',
    env: { ...process.env, PATH: `${bin}${delimiter}${process.env.PATH}` },
  });
  assert.ifError(result.error);
  return { contents: readFileSync(manifest, 'utf8'), result };
}

test('retains the previous manifest when jq fails after emitting partial output', (t) => {
  const { contents, result } = update(t, true);
  assert.equal(result.status, 2, result.stderr);
  assert.equal(result.stdout, '');
  assert.equal(contents, oldManifest);
});

test('writes the new version, URLs and hashes after jq succeeds', (t) => {
  const { contents, result } = update(t, false);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout, '1.2.3\n');
  const manifest = JSON.parse(contents);
  assert.equal(manifest.version, '1.2.3');
  const base = 'https://github.com/flisk-sh/releases/releases/download/v1.2.3';
  assert.deepEqual(manifest.architecture['64bit'], {
    url: [`${base}/flisk-windows-amd64.exe#/flisk.exe`, `${base}/flisk-cli-engine.tar.gz`],
    hash: [exeHash, engineHash],
  });
});

test('accepts binary-mode checksum filenames', (t) => {
  const checksums = `${exeHash} *flisk-windows-amd64.exe
${engineHash} *flisk-cli-engine.tar.gz`;
  const { contents, result } = update(t, false, checksums);
  assert.equal(result.status, 0, result.stderr);
  const manifest = JSON.parse(contents);
  assert.deepEqual(manifest.architecture['64bit'].hash, [exeHash, engineHash]);
});
