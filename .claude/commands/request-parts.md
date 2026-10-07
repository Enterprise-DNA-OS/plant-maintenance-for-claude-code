---
description: Read or update request parts records.
---

Read CLAUDE.md and docs/cli.md. Read current records before answering. Use the operator's real identifiers, dates and evidence, never the illustrative values below.

```bash
node scripts/plant.mjs request-parts BR-6205 --quantity=4 --reason="Reorder point reached" --actor="Stores"
```

Changes require a named human operator and actual supporting records. Show the resulting record and any remaining gaps.

Use --json when another tool needs the result.
