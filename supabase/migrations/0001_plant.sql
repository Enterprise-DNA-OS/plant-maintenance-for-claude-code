create function touch_updated() returns trigger language plpgsql as $$ begin new.updated_at=now(); return new; end $$;
create table assets (id uuid primary key default gen_random_uuid(), code text not null unique, name text not null, site text not null, criticality text not null default 'medium' check(criticality in ('low','medium','high')), status text not null default 'active' check(status in ('active','held','retired')), registration_required boolean not null default false, registration_ref text, instruction_ref text, source_data jsonb not null default '{}' , created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create trigger touch_assets before update on assets for each row execute function touch_updated();
alter table assets enable row level security; revoke all on assets from public;
create table schedules (id uuid primary key default gen_random_uuid(), asset_id uuid not null references assets(id), name text not null, interval_days integer not null check(interval_days>0), next_due date not null, meter_interval numeric check(meter_interval>0), next_meter numeric check(next_meter>=0), instruction_ref text not null, unique(asset_id,name), check((meter_interval is null)=(next_meter is null)), created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create trigger touch_schedules before update on schedules for each row execute function touch_updated();
alter table schedules enable row level security; revoke all on schedules from public;
create table work_orders (id uuid primary key default gen_random_uuid(), code text not null unique, asset_id uuid not null references assets(id), schedule_id uuid references schedules(id), title text not null, kind text not null default 'corrective' check(kind in ('corrective','preventive')), status text not null default 'open' check(status in ('open','in_progress','waiting_parts','completed')), priority text not null default 'normal' check(priority in ('normal','urgent')), due_date date not null, assigned_to text, isolation_ref text, completion_note text, completed_by text, completed_at timestamptz, labour_minutes integer not null default 0 check(labour_minutes>=0), downtime_minutes integer not null default 0 check(downtime_minutes>=0), check((status='completed')=(completed_at is not null)), check(status<>'completed' or (length(trim(completion_note))>0 and length(trim(completed_by))>0)), created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create trigger touch_work_orders before update on work_orders for each row execute function touch_updated();
alter table work_orders enable row level security; revoke all on work_orders from public;
create table meters (id uuid primary key default gen_random_uuid(), asset_id uuid not null references assets(id), reading numeric not null check(reading>=0), unit text not null default 'hours' check(unit='hours'), observed_at timestamptz not null default now(), recorded_by text not null, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create trigger touch_meters before update on meters for each row execute function touch_updated();
alter table meters enable row level security; revoke all on meters from public;
create table spares (id uuid primary key default gen_random_uuid(), code text not null unique, name text not null, location text not null, quantity numeric not null default 0 check(quantity>=0), reorder_level numeric not null default 0 check(reorder_level>=0), unit_cost_cents integer not null default 0 check(unit_cost_cents>=0), currency text not null default 'AUD' check(currency in ('AUD','NZD')), created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create trigger touch_spares before update on spares for each row execute function touch_updated();
alter table spares enable row level security; revoke all on spares from public;
create table stock_moves (id uuid primary key default gen_random_uuid(), spare_id uuid not null references spares(id), work_order_id uuid references work_orders(id), quantity numeric not null check(quantity<>0), reason text not null, actor text not null, unit_cost_cents integer not null check(unit_cost_cents>=0), currency text not null check(currency in ('AUD','NZD')), created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create trigger touch_stock_moves before update on stock_moves for each row execute function touch_updated();
alter table stock_moves enable row level security; revoke all on stock_moves from public;
create table inspections (id uuid primary key default gen_random_uuid(), asset_id uuid not null references assets(id), inspected_on date not null, next_due date not null, inspector text not null, competency_ref text not null, evidence_ref text not null, result text not null check(result in ('pass','defect')), finding text not null, check(next_due>inspected_on), created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create trigger touch_inspections before update on inspections for each row execute function touch_updated();
alter table inspections enable row level security; revoke all on inspections from public;
create table purchase_requests (id uuid primary key default gen_random_uuid(), spare_id uuid not null references spares(id), quantity numeric not null check(quantity>0), requested_by text not null, reason text not null, status text not null default 'draft' check(status in ('draft','received')), received_at timestamptz, check((status='received')=(received_at is not null)), created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create trigger touch_purchase_requests before update on purchase_requests for each row execute function touch_updated();
alter table purchase_requests enable row level security; revoke all on purchase_requests from public;
create table notes (id uuid primary key default gen_random_uuid(), asset_id uuid not null references assets(id), actor text not null, note text not null, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create trigger touch_notes before update on notes for each row execute function touch_updated();
alter table notes enable row level security; revoke all on notes from public;
create table audit_log (id uuid primary key default gen_random_uuid(), entity text not null, record_id uuid not null, action text not null, actor text not null, detail jsonb not null default '{}' , created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create trigger touch_audit_log before update on audit_log for each row execute function touch_updated();
alter table audit_log enable row level security; revoke all on audit_log from public;
create unique index one_open_preventive on work_orders(schedule_id) where schedule_id is not null and status<>'completed';
create view pm_due as select s.id, a.code as asset, a.name as asset_name,s.name,s.next_due,s.next_meter,coalesce(m.reading,0) as reading,s.instruction_ref,
(s.next_due<=current_date) as date_due,(s.next_meter is not null and coalesce(m.reading,0)>=s.next_meter) as meter_due
from schedules s join assets a on a.id=s.asset_id left join lateral(select reading from meters where asset_id=a.id order by observed_at desc,created_at desc limit 1)m on true
where a.status<>'retired' and (s.next_due<=current_date+7 or s.next_meter<=coalesce(m.reading,0));
create view backlog as select w.id,w.code,a.code as asset,a.name as asset_name,a.site,a.criticality,w.title,w.status,w.priority,w.due_date,w.assigned_to,current_date-w.due_date as days_overdue
from work_orders w join assets a on a.id=w.asset_id where w.status<>'completed';
create view stock_attention as select id,code,name,location,quantity,reorder_level,greatest(reorder_level-quantity,0) as shortage,currency from spares where quantity<=reorder_level;
create view asset_reliability as select a.id,a.code,a.name,a.site,a.criticality,
count(w.id) filter(where w.kind='corrective') as corrective_jobs,
coalesce(sum(w.downtime_minutes),0) as downtime_minutes,coalesce(sum(w.labour_minutes),0) as labour_minutes,
count(w.id) filter(where w.status<>'completed') as open_jobs
from assets a left join work_orders w on w.asset_id=a.id group by a.id;
create view inspection_status as select a.id,a.code,a.name,a.site,a.registration_required,a.registration_ref,a.instruction_ref,i.inspected_on,i.next_due,i.result,i.competency_ref,i.evidence_ref
from assets a left join lateral(select * from inspections where asset_id=a.id order by inspected_on desc,created_at desc limit 1)i on true where a.status<>'retired';
