---
description: Read or update issue records.
---

Read CLAUDE.md and docs/cli.md. Read current records before answering. Use the operator's real identifiers, dates and evidence, never the illustrative values below.

```bash
node scripts/plant.mjs issue BR-6205 --quantity=1 --work=WO-1001 --reason="Bearing replacement" --actor="Stores"
```

Changes require a named human operator and actual supporting records. Show the resulting record and any remaining gaps.

Use --json when another tool needs the result.
