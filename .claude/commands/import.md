---
description: Preview and import a MEX asset register with explicit mapping.
---

Read CLAUDE.md and docs/cli.md. Read current records before answering. Use the operator's real identifiers, dates and evidence, never the illustrative values below.

```bash
node scripts/plant.mjs import mex imports/assets.csv --dry-run --json
```

Changes require a named human operator and actual supporting records. Show the resulting record and any remaining gaps.

Read docs/replace-mex.md. Review the dry run and mapping, then remove --dry-run and add --actor to load the agreed file. Reconcile counts and retain originals.
