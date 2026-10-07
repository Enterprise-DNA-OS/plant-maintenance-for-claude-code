---
description: Record a competent inspection and flag defects without authorising operation.
---

Read CLAUDE.md and docs/cli.md. Read current records before answering. Use the operator's real identifiers, dates and evidence, never the illustrative values below.

```bash
node scripts/plant.mjs inspect CV-01 --on=2026-10-07 --due=2026-11-07 --competency=Training-MP --evidence=inspection-123.pdf --result=pass --finding="Guards checked" --actor="Mia Patel"
```

Changes require a named human operator and actual supporting records. Show the resulting record and any remaining gaps.

Use --json when another tool needs the result.
