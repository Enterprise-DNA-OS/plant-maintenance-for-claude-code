# Maintenance CLI

Run node scripts/plant.mjs followed by a command. Options use --key=value; quote values with spaces. Every command supports --json. Reads are unfiltered unless described below. Asset names are matched case-insensitively; exact codes and UUID prefixes also work. Multiple matches list IDs and exit 1. All writes require --actor. Errors exit 1 without committing partial changes.

## Read commands

- assets: assets
- work-orders: work orders
- pm-due: Review preventive work due by date or operating hours.
- maintenance-round: maintenance round
- stores: stores
- spares: spares
- meters: meters
- inspections: inspections
- schedules: schedules
- purchase-requests: purchase requests
- reliability: reliability
- attention: attention
- critical-backlog: critical backlog
- stale-work: stale work
- parts-wait: parts wait
- crew-load: crew load
- site-review: site review
- cost-review: cost review
- history: history
- audit: audit
- activity: activity
- asset <code|name|id-prefix>: the complete asset record, work history, inspections and notes.
- compliance: four evidence checks; see compliance.md.
- weekly-review: attention, pm-due, stores and compliance together.
- help: every executable command.

## Writes, drafts and exchange

### add

~~~bash
node scripts/plant.mjs add work-order --asset=CV-01 --code=WO-1003 --title="Check belt alignment" --due=2026-10-20 --actor="Mia Patel"
~~~

### assign

~~~bash
node scripts/plant.mjs assign WO-1001 --person="Mia Patel" --actor="Planner"
~~~

### set-status

~~~bash
node scripts/plant.mjs set-status WO-1001 --status=waiting_parts --actor="Planner"
~~~

### complete

~~~bash
node scripts/plant.mjs complete WO-1001 --note="Bearing replaced and tested" --isolation=LOTO-123 --labour=90 --downtime=45 --actor="Mia Patel"
~~~

### generate-pm

~~~bash
node scripts/plant.mjs generate-pm --actor="Planner"
~~~

### meter

~~~bash
node scripts/plant.mjs meter AC-01 --reading=1600 --actor="Noah Chen"
~~~

### inspect

~~~bash
node scripts/plant.mjs inspect CV-01 --on=2026-10-07 --due=2026-11-07 --competency=Training-MP --evidence=inspection-123.pdf --result=pass --finding="Guards checked" --actor="Mia Patel"
~~~

### stock

~~~bash
node scripts/plant.mjs stock BR-6205 --quantity=4 --reason="Received delivery D123" --actor="Stores"
~~~

### issue

~~~bash
node scripts/plant.mjs issue BR-6205 --quantity=1 --work=WO-1001 --reason="Bearing replacement" --actor="Stores"
~~~

### request-parts

~~~bash
node scripts/plant.mjs request-parts BR-6205 --quantity=4 --reason="Reorder point reached" --actor="Stores"
~~~

### receive

~~~bash
node scripts/plant.mjs receive <purchase-request-id> --reason="Received delivery D124" --actor="Stores"
~~~

### log

~~~bash
node scripts/plant.mjs log CV-01 --note="Supplier confirmed Thursday delivery" --actor="Planner"
~~~

### draft-work-order

~~~bash
node scripts/plant.mjs draft-work-order WO-1001
~~~

### draft-reorder

~~~bash
node scripts/plant.mjs draft-reorder
~~~

### import

~~~bash
node scripts/plant.mjs import mex imports/assets.csv --dry-run --json
~~~

### export

~~~bash
node scripts/plant.mjs export --out=exports/plant-backup.json
~~~

Additional add forms:

~~~bash
node scripts/plant.mjs add asset --code=PU-02 --name="Cooling pump" --site=Hamilton --criticality=high --instruction=OEM-PU --actor=Planner
node scripts/plant.mjs add schedule --asset=PU-02 --name="Pump inspection" --days=30 --due=2026-11-01 --instruction=OEM-PU --actor=Planner
node scripts/plant.mjs add spare --code=SEAL-01 --name="Pump seal" --location=Hamilton --reorder=2 --cents=4500 --currency=NZD --actor=Stores
~~~

Assets optionally accept --registration-required and --registration=<reference>; set applicability from evidence, not guesswork. Work orders optionally accept --priority=urgent, --assignee and --isolation. Schedules optionally accept BOTH --meter-interval and --next-meter, in operating hours. Date input is strict YYYY-MM-DD. Quantities are positive; labour and downtime are nonnegative whole minutes. Currency is AUD or NZD and is never summed across currencies.

## Calculations and workflow

Preventive review shows plans due in the next seven days or at their meter threshold. generate-pm creates work only when due now by either trigger, and repeated runs cannot duplicate an open scheduled job. Completion advances the date from the completion day by the recorded interval. The meter threshold advances from the greater of the previous threshold or latest reading, plus the meter interval. This is a completion-based maintenance policy, not a statutory interval.

Readings are cumulative operating hours and cannot go backwards. Meter replacements need a reviewed migration and retained history. Stock additions and issues are recorded with cost and currency at the time of movement. Purchase requests are internal drafts, not orders. receive records the full quantity received once; partial receipts can instead be logged through stock with the actual docket while leaving the request for review. Do not then receive that request in full. No payments occur.

Complete work is locked. Changes need a separately reviewed correction with an audit note. Inspection defects set the asset to held; a later pass does not release it. Maintenance work may still be planned on held plant. Nothing authorises operation. Work completion does not by itself constitute an inspection.

Imports update asset-register fields only. Original extra columns are preserved. Read replace-mex.md for mapping and exclusions. Export uses a consistent transaction, includes all ten business record groups and refuses to overwrite a file. Export is a portable snapshot, not a tested full database restore procedure; retain native database backups too.

Historical downtime and labour are all-time recorded totals, not estimates of availability or a time-bounded failure rate. Cost review includes issued parts only; it excludes labour pricing, tax and unrecorded costs. Unknowns stay visible.
