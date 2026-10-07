---
description: Read or update set status records.
---

Read CLAUDE.md and docs/cli.md. Read current records before answering. Use the operator's real identifiers, dates and evidence, never the illustrative values below.

```bash
node scripts/plant.mjs set-status WO-1001 --status=waiting_parts --actor="Planner"
```

Changes require a named human operator and actual supporting records. Show the resulting record and any remaining gaps.

Use --json when another tool needs the result.
