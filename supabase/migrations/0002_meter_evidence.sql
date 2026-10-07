-- A missing meter reading is unknown, not zero.
create or replace view pm_due as select s.id, a.code as asset, a.name as asset_name,s.name,s.next_due,s.next_meter,m.reading,s.instruction_ref,
(s.next_due<=current_date) as date_due,(s.next_meter is not null and m.reading>=s.next_meter) as meter_due
from schedules s join assets a on a.id=s.asset_id left join lateral(select reading from meters where asset_id=a.id order by observed_at desc,created_at desc limit 1)m on true
where a.status<>'retired' and (s.next_due<=current_date+7 or s.next_meter<=m.reading);
