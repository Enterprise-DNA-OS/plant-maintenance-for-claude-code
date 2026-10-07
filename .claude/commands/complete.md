---
description: Record completed maintenance with supplied evidence and advance its schedule.
---

Read CLAUDE.md and docs/cli.md. Read current records before answering. Use the operator's real identifiers, dates and evidence, never the illustrative values below.

```bash
node scripts/plant.mjs complete WO-1001 --note="Bearing replaced and tested" --isolation=LOTO-123 --labour=90 --downtime=45 --actor="Mia Patel"
```

Changes require a named human operator and actual supporting records. Show the resulting record and any remaining gaps.

Use --json when another tool needs the result.
