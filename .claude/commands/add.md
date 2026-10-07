---
description: Read or update add records.
---

Read CLAUDE.md and docs/cli.md. Read current records before answering. Use the operator's real identifiers, dates and evidence, never the illustrative values below.

```bash
node scripts/plant.mjs add work-order --asset=CV-01 --code=WO-1003 --title="Check belt alignment" --due=2026-10-20 --actor="Mia Patel"
```

Changes require a named human operator and actual supporting records. Show the resulting record and any remaining gaps.

Use --json when another tool needs the result.
