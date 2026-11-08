# Scoop bucket for Flisk

Install the [Flisk CLI](https://flisk.sh) on Windows with [Scoop](https://scoop.sh):

```powershell
scoop bucket add flisk https://github.com/flisk-sh/scoop-bucket
scoop install flisk/flisk
```

Upgrade with `scoop update flisk`.

The manifest installs the same prebuilt binary and bundled engine as the other install methods, from [flisk-sh/releases](https://github.com/flisk-sh/releases/releases), checked against that release's `checksums.txt`. The Windows binary is x86-64.

Each hour, [a workflow](.github/workflows/update.yml) looks for a new release. It installs and tests the new manifest on Windows before pushing it.

`bucket/flisk.json` is written by `scripts/update-manifest.sh`. To change it, change the script.

Bugs in Flisk itself go to [flisk-sh/flisk](https://github.com/flisk-sh/flisk/issues).
