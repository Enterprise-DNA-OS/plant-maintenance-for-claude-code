# Bring the MEX asset register across

Checked 7 October 2026. MEX's [advanced training syllabus](https://www.mex.com.au/content/files/MEX_Training_Calendar_2020.pdf) documents import, export and asset administration. Its current [asset management page](https://mex.com.au/capabilities/asset-management) describes the records. Neither source publishes a universal CSV header contract or an export click path for every version. Ask the MEX administrator for an asset-register CSV or save an exported asset spreadsheet as UTF-8 CSV. Preserve the original file and confirm the selected sites and inactive assets.

Run one import command after the database is migrated:

```bash
node scripts/plant.mjs import mex imports/assets.csv --dry-run --json
node scripts/plant.mjs import mex imports/assets.csv --actor="Maintenance planner"
```

Use a fresh DATA_DIR for live data, run npm run migrate, and do not seed it. On PowerShell use `$env:DATA_DIR="./.data/live"`; on bash use `export DATA_DIR=./.data/live`. Agent and hosting charges remain separate from the free software.

| Destination | Recognised export column labels |
|---|---|
| code | Asset Number, Asset No, Asset Code, Asset ID |
| name | Asset Description, Asset Name, Description |
| site | Location, Site |
| criticality | Criticality, with low, medium or high values |

These are supported aliases, not a claim of a fixed MEX export format. For other labels supply `--mapping=imports/map.json` with canonical keys, for example `{"code":"Equipment No","name":"Equipment Description","site":"Region"}`. If multiple recognised columns could mean the same field, an explicit mapping is required. Code and name are mandatory; missing site becomes Unassigned and missing criticality becomes medium for later review. Numeric risk scales need reviewed conversion before import.

Quoted commas, UTF-8 BOMs and multiline cells are supported. Duplicate identifiers, duplicate headers, ragged rows, blank names, conflicting case and invalid criticalities fail before changes are committed. Dry-run writes nothing. Re-import upserts by stable asset code and preserves all original columns in source_data. Only asset names, sites, criticalities and original import columns are refreshed. Registration, inspection, work history and instructions already entered here remain intact.

## What needs separate mapping

This one-command path imports the asset register only. Work history, PM schedules, equipment readings, stores, supplier records, attachments and permissions require separate exports and reviewed mappings. Enterprise DNA does this as part of an agreed migration. Do not promise a full-history transfer from the asset CSV. Keep MEX available until counts, examples, open work, safety evidence and operational needs are reconciled. A day is a possible asset-register trial, not a promised complete migration.

Newly imported records have no claimed inspection or registration evidence. Review compliance findings and record the actual applicability, instructions and inspection records. Save a JSON export and test backups before changing the operating system of record. The fixtures in fixtures/ are synthetic examples; no customer records are included.
