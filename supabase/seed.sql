insert into assets(id,code,name,site,criticality,registration_required,registration_ref,instruction_ref) values
('10000000-0000-4000-8000-000000000001','CV-01','Packing conveyor','Brisbane','high',false,null,'OEM-CV-2026'),
('10000000-0000-4000-8000-000000000002','AC-01','Air compressor','Brisbane','high',true,null,'OEM-AC-2026'),
('10000000-0000-4000-8000-000000000003','PU-01','Wash pump','Hamilton','medium',false,null,null) on conflict do nothing;
insert into schedules(id,asset_id,name,interval_days,next_due,meter_interval,next_meter,instruction_ref) values
('20000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','Inspect belt and guards',30,current_date-3,null,null,'OEM-CV-2026'),
('20000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000002','Compressor service',90,current_date+20,500,1500,'OEM-AC-2026') on conflict do nothing;
insert into work_orders(id,code,asset_id,title,status,priority,due_date,assigned_to,created_at,updated_at) values
('30000000-0000-4000-8000-000000000001','WO-1001','10000000-0000-4000-8000-000000000001','Replace belt bearing','waiting_parts','urgent',current_date-5,'Mia Patel',now()-interval '18 days',now()-interval '18 days'),
('30000000-0000-4000-8000-000000000002','WO-1002','10000000-0000-4000-8000-000000000002','Investigate pressure drop','open','normal',current_date+2,null,now(),now()) on conflict do nothing;
insert into meters(id,asset_id,reading,recorded_by) values ('40000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000002',1525,'Noah Chen') on conflict do nothing;
insert into spares(id,code,name,location,quantity,reorder_level,unit_cost_cents,currency) values
('50000000-0000-4000-8000-000000000001','BR-6205','Conveyor bearing','Brisbane stores',1,4,3800,'AUD'),
('50000000-0000-4000-8000-000000000002','FLT-10','Air filter','Brisbane stores',8,3,2200,'AUD') on conflict do nothing;
insert into inspections(id,asset_id,inspected_on,next_due,inspector,competency_ref,evidence_ref,result,finding) values
('60000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001',current_date-35,current_date-5,'Mia Patel','Training register MP','demo/guard-check.pdf','pass','Guards intact at inspection') on conflict do nothing;
insert into notes(id,asset_id,actor,note,created_at) values ('70000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','Mia Patel','Bearing ordered; awaiting supplier confirmation.',now()-interval '18 days') on conflict do nothing;
