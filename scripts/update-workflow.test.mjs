import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const workflow = readFileSync(new URL('../.github/workflows/update.yml', import.meta.url), 'utf8');

test('manifest updater accepts release notifications and tests idempotency', () => {
  assert.match(workflow, /repository_dispatch:\s*\r?\n\s+types:\s*\[flisk-release-published\]/);
  assert.match(workflow, /RELEASE_TAG:\s*\$\{\{ github\.event\.client_payload\.tag \}\}/);
  assert.match(workflow, /scripts\/update-manifest\.sh "\$RELEASE_TAG"/);
  assert.match(workflow, /scripts\/update-manifest\.sh "v\$version"/);
  assert.match(workflow, /cmp --silent .* bucket\/flisk\.json/);
});

test('manifest publisher opens a signed-off pull request and merges it after required checks pass', () => {
  assert.match(workflow, /SCOOP_BUCKET_AUTOMATION_TOKEN/);
  assert.match(workflow, /git commit -s -m "flisk \$VERSION"/);
  assert.match(workflow, /gh pr create/);
  assert.match(workflow, /gh pr checks .*--required --watch/);
  assert.match(workflow, /gh pr merge .*--squash/);
  assert.doesNotMatch(workflow, /git push\s*$/m);
});
