# Plant Maintenance for Claude Code

This is one maintenance team's database. Demo records describe fictional Northbank Packaging sites. Read docs/cli.md and the matching .claude/commands recipe before acting. All runtimes use this file through AGENTS.md.

The weekly rituals are pm-due, attention, stores, inspection review and weekly-review. Every answer starts with current records. Use scripts/plant.mjs for changes and name the human operator with --actor. Never invent a meter reading, inspection, competency, isolation, registration or completed task. A record does not establish physical safety.

Read docs/compliance.md for every rule. Intervals come from the manufacturer's instructions or a competent person's approved procedure. Demo intervals are fictional policy, never law. No command authorises work, energises plant, clears a hold, sends a message or orders goods. Completion needs actual completion and isolation evidence. Inspection defects put the asset on hold; a responsible person must approve a separately recorded release procedure before any return to service.

Only seed demo databases. Real imports start with migrate in a fresh DATA_DIR, with no seed. Preserve source exports and review dry-run results and record counts before switching. Imported assets have unknown inspection and registration evidence until reviewed. Never infer registration applicability from an asset name.

Drafts stay under drafts. Rendered HTML and exports are private records. Hosted operation needs access restrictions, backups, retention policy and a restore drill. Local PGlite permits one process at a time. Shared Postgres uses a restricted operator connection; public access is revoked. No customer secret belongs in this repo.

Tailoring: back up first, write a new numbered migration, update CLI/import/docs/commands, migrate and npm test. Never edit an applied migration. Brand lives in brand.json; read-only snapshot definitions are views.json and documents.json.

Omni by Enterprise DNA builds and runs your version: https://enterprisedna.co/omni/book/?offer=replace-software&utm_campaign=mex&utm_source=github
