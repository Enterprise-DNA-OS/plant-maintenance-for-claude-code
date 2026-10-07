# Plant Maintenance for Claude Code

Assets, preventive schedules, work orders, meters, spares and inspection evidence in a database you own. Free MIT-licensed software for plant maintenance planners. Works with Claude Code, Codex, OpenCode or Cursor.

| Do it yourself | We customise it | We run it for you |
|---|---|---|
| Free. Install, try the demo and import the asset register. | Your fields, site rules, MEX records, web front end or different stack. | Installed, connected and operated through Omni by Enterprise DNA. One setup fee, then a retainer. |
| [Quick start](#quick-start) | [Get your version built](https://enterprisedna.co/omni/book/?offer=replace-software&utm_campaign=mex&utm_source=github&utm_medium=customise) | [Book a call](https://enterprisedna.co/omni/book/?offer=replace-software&utm_campaign=mex&utm_source=github&utm_medium=managed) |

## The maintenance week

Review preventive work, allocate the repair backlog, record inspections and meter readings, replenish stores and prepare the Monday work pack. Fictional Northbank Packaging has an overdue conveyor repair waiting for parts, a compressor over its hour threshold, a late inspection and missing registration evidence. Demo dates are relative to the first seed. Reseeding does not reset records.

## Quick start

Node 20 or later, Windows or Linux:

~~~bash
git clone https://github.com/Enterprise-DNA-OS/plant-maintenance-for-claude-code.git
cd plant-maintenance-for-claude-code
npm install
npm run demo
npm test
npm run view
npm run docs
~~~

PGlite stores a local Postgres-compatible database in .data/db. DATABASE_URL selects hosted Postgres with verified TLS. Real data belongs in a fresh DATA_DIR after npm run migrate, without demo seed. Local PGlite is single-process. Shared use needs restricted database credentials, backups and a restore drill. The database owner controls access; no public service is exposed.

## Commands

41 executable commands including help; 42 slash recipes including customise and new-view:

- /assets
- /work-orders
- /pm-due
- /maintenance-round
- /stores
- /spares
- /meters
- /inspections
- /schedules
- /purchase-requests
- /reliability
- /attention
- /critical-backlog
- /stale-work
- /parts-wait
- /crew-load
- /site-review
- /cost-review
- /history
- /audit
- /activity
- /asset
- /compliance
- /weekly-review
- /add
- /assign
- /set-status
- /complete
- /generate-pm
- /meter
- /inspect
- /stock
- /issue
- /request-parts
- /receive
- /log
- /draft-work-order
- /draft-reorder
- /import
- /export
- /customise
- /new-view

[CLI guide](docs/cli.md): arguments, calculations and examples. Human output by default; --json for tools. UUID prefixes and case-insensitive names work, with candidate lists and exit 1 on ambiguous matches.

## Ten questions beyond a fixed dashboard

These queries run today and can be changed to fit your business. MEX also offers reporting and configurable dashboards. We do not claim these questions are impossible in MEX.

- Which critical assets have overdue work? `critical-backlog`
- Which maintenance plans are due by date or meter? `pm-due`
- Which jobs have been untouched for two weeks? `stale-work`
- Which repairs are waiting for parts? `parts-wait`
- Which stores items are at or below their reorder point? `stores`
- Who has the largest open maintenance workload? `crew-load`
- Which sites have the most overdue jobs? `site-review`
- Which assets have the most recorded downtime? `reliability`
- Which assets consumed parts, separated by currency? `cost-review`
- Where are instructions, registrations or inspection records missing? `compliance`

## Your first hour: ten things to ask for

1. Put our business name and colours on the work packs.
2. Preview our MEX asset-register export.
3. Show the oldest urgent repairs.
4. Find preventive work due by running hours.
5. Record an actual equipment reading.
6. Show what stores needs to reorder.
7. Draft a work pack for the maintenance supervisor.
8. Add our cost centre through a migration.
9. Record our manufacturer's inspection interval and source.
10. Add a Monday view for each site.

## Documents and evidence

Edit brand.json once. npm run docs renders draft work packs, asset maintenance histories and internal parts requests under docs-out/. npm run view renders the week, reliability and inspection snapshots under views/. These are read-only HTML files, not an application. Protect them as internal business records.

[Compliance](docs/compliance.md) cites Australian and NZ plant guidance and explains four evidence checks. Site policies set dates; the base does not certify safety, issue permits or authorise work. Inspection defects put the plant on hold, with no automatic release.

[Move from MEX](docs/replace-mex.md): one command loads an asset CSV, with preview, explicit mapping, duplicate checks and preserved original columns. Work history, schedules, readings, parts and attachments need separate mapping. Review those records before ending the incumbent subscription.

[Why no front end](docs/why-no-front-end.md): mobile capture, offline operation, integrations and a site-specific approval experience belong in the custom version. No messages, supplier orders or payments are sent by this base.

## Verification

Tests use a temporary database and exercise every command, import rollback, duplicate generation, stock limits, inspection evidence, meter monotonicity, completion locks, export, escaped HTML and ambiguous CLI matches. Set TEST_DATABASE_URL only to an empty disposable Postgres database for the same suite. CI covers Windows, Linux and Postgres.

Scaffold components come from Enterprise DNA's shared rebuild template. MIT licence. Not affiliated with MEX or Anthropic. Hosting and agent usage have separate costs. [Book 30 minutes with Sam](https://enterprisedna.co/omni/book/?offer=replace-software&utm_campaign=mex&utm_source=github&utm_medium=readme).
