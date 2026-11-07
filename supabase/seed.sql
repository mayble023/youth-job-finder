-- =============================================================================
-- Youth Job Finder — seed.sql
-- 30 sample jobs. ALL EMPLOYERS ARE FICTIONAL.
-- Run after migrations/001_schema.sql. Safe to run more than once
-- (fixed ids + on conflict do nothing).
-- Closing dates are relative to the day you run it (within the next ~3 months).
-- Salaries are PGK per year; null = unpaid / volunteer.
-- =============================================================================

insert into public.jobs
  (id, title, company, category, job_type, town, latitude, longitude,
   salary_min, salary_max, description, requirements, tags, closing_date)
values
-- ---------------------------------------------------------------- Port Moresby
('00000000-0000-4000-8000-000000000001',
 'Graduate Accountant', 'Kumul Ledger Partners', 'Finance', 'Graduate',
 'Port Moresby', -9.4438, 147.1803, 42000, 50000,
 'Join our two-year graduate program working across audit, tax and advisory for small and medium businesses in the National Capital District.',
 'Bachelor of Commerce (Accounting). Working towards CPA PNG membership. Strong numeracy.',
 array['excel','accounting','myob','attention to detail'], current_date + 30),

('00000000-0000-4000-8000-000000000002',
 'IT Support Intern', 'Harbourline Digital', 'IT', 'Internship',
 'Port Moresby', -9.4502, 147.1871, 15000, 18000,
 'Six-month paid internship supporting staff laptops, printers and the office network. Mentoring from senior technicians provided.',
 'Currently studying or recently completed a Diploma/Degree in IT or Computer Science.',
 array['troubleshooting','windows','networking','customer service'], current_date + 21),

('00000000-0000-4000-8000-000000000003',
 'Junior Mobile Developer', 'Paradise Byte Studio', 'IT', 'Full-time',
 'Port Moresby', -9.4379, 147.1748, 55000, 70000,
 'Build and maintain cross-platform mobile apps for local clients in banking, retail and government using React Native.',
 'Portfolio or GitHub showing JavaScript/TypeScript projects. Familiar with Git.',
 array['react','javascript','git','mobile'], current_date + 45),

-- ------------------------------------------------------------------------- Lae
('00000000-0000-4000-8000-000000000004',
 'Apprentice Electrician', 'Markham Power Works', 'Construction', 'Full-time',
 'Lae', -6.7249, 147.0010, 22000, 28000,
 'Four-year apprenticeship on commercial and industrial electrical installations around Lae and the Morobe Province.',
 'Grade 12 certificate with Maths and Physics. Willing to complete trade studies at a technical college.',
 array['electrical','safety','hand tools','driving licence'], current_date + 35),

('00000000-0000-4000-8000-000000000005',
 'Graduate Mechanical Engineer', 'Huon Gulf Fabrication', 'Engineering', 'Graduate',
 'Lae', -6.7311, 147.0078, 60000, 72000,
 'Support maintenance planning and fabrication projects for port and manufacturing clients. Rotations through design and workshop teams.',
 'Bachelor of Engineering (Mechanical). AutoCAD or SolidWorks experience preferred.',
 array['autocad','maintenance','safety','problem solving'], current_date + 60),

('00000000-0000-4000-8000-000000000006',
 'Warehouse Assistant', 'Coastline Freight Logistics', 'Transport', 'Casual',
 'Lae', -6.7192, 146.9948, 16000, 19000,
 'Receive, pick and dispatch freight at our Lae depot. Shifts on a weekly roster.',
 'Physically fit, reliable and able to work early mornings. Forklift ticket an advantage.',
 array['forklift','inventory','teamwork'], current_date + 14),

-- ---------------------------------------------------------------- Mount Hagen
('00000000-0000-4000-8000-000000000007',
 'Agricultural Extension Officer', 'Highlands Green Growers', 'Agriculture', 'Full-time',
 'Mount Hagen', -5.8606, 144.2306, 38000, 46000,
 'Visit smallholder coffee and vegetable farmers across the Western Highlands to deliver training on crop care and post-harvest handling.',
 'Diploma or Degree in Agriculture. Valid driving licence and willingness to travel.',
 array['coffee','farming','training','driving licence'], current_date + 40),

('00000000-0000-4000-8000-000000000008',
 'Retail Sales Assistant', 'Wahgi Valley Mart', 'Retail', 'Part-time',
 'Mount Hagen', -5.8551, 144.2372, 12000, 15000,
 'Serve customers, operate the till and keep shelves stocked in a busy town-centre supermarket.',
 'Grade 10 or above. Friendly, honest and good with numbers.',
 array['customer service','cash handling','stocktake'], current_date + 18),

('00000000-0000-4000-8000-000000000009',
 'Graduate Nurse', 'Hagen Community Health Clinic', 'Health', 'Graduate',
 'Mount Hagen', -5.8663, 144.2251, 40000, 48000,
 'Twelve-month supported transition program for newly registered nurses in outpatient and maternal health.',
 'Bachelor of Nursing and registration with the Nursing Council of PNG.',
 array['first aid','patient care','record keeping'], current_date + 55),

-- --------------------------------------------------------------------- Madang
('00000000-0000-4000-8000-000000000010',
 'Front Desk Receptionist', 'Coral Bay Resort', 'Hospitality', 'Full-time',
 'Madang', -5.2246, 145.7966, 20000, 25000,
 'Welcome guests, manage check-ins and bookings, and coordinate tours for a waterfront resort.',
 'Excellent spoken English and Tok Pisin. Hospitality certificate an advantage.',
 array['customer service','booking systems','english','tok pisin'], current_date + 25),

('00000000-0000-4000-8000-000000000011',
 'Reef Monitoring Volunteer', 'Bismarck Reef Conservancy', 'Education', 'Volunteer',
 'Madang', -5.2189, 145.8031, null, null,
 'Help run reef health surveys and deliver marine awareness sessions in coastal schools. Meals and transport provided.',
 'Confident swimmer. Interest in marine science or environmental education.',
 array['snorkelling','data collection','teamwork'], current_date + 50),

('00000000-0000-4000-8000-000000000012',
 'Fisheries Data Intern', 'Madang Coastal Fisheries Co-op', 'Agriculture', 'Internship',
 'Madang', -5.2302, 145.7902, 14000, 16000,
 'Record catch data from member boats and help prepare monthly reports for the co-operative board.',
 'Studying Fisheries, Environmental Science or Statistics. Comfortable with spreadsheets.',
 array['excel','data entry','fieldwork'], current_date + 28),

-- --------------------------------------------------------------------- Goroka
('00000000-0000-4000-8000-000000000013',
 'Coffee Quality Trainee', 'Eastern Highlands Bean Co.', 'Agriculture', 'Internship',
 'Goroka', -6.0838, 145.3866, 15000, 18000,
 'Learn green-bean grading, roasting and cupping in our export quality lab.',
 'Grade 12 certificate. Good sense of taste and smell; keen attention to detail.',
 array['coffee','quality control','attention to detail'], current_date + 33),

('00000000-0000-4000-8000-000000000014',
 'Teacher Aide', 'Lufa Road Learning Centre', 'Education', 'Part-time',
 'Goroka', -6.0781, 145.3929, 14000, 17000,
 'Support elementary teachers with reading groups, classroom preparation and student supervision.',
 'Grade 12 certificate. Experience with children (church, sport or community) welcomed.',
 array['teaching','child safety','literacy'], current_date + 20),

('00000000-0000-4000-8000-000000000015',
 'Bookkeeper', 'Asaro Traders Ltd', 'Finance', 'Full-time',
 'Goroka', -6.0894, 145.3807, 32000, 38000,
 'Manage accounts payable/receivable, fortnightly payroll and bank reconciliations for a regional wholesaler.',
 'Diploma in Accounting and at least one year of bookkeeping experience.',
 array['excel','bookkeeping','payroll','xero'], current_date + 42),

-- --------------------------------------------------------------------- Kokopo
('00000000-0000-4000-8000-000000000016',
 'Kitchen Hand', 'Rabaul Sunrise Lodge', 'Hospitality', 'Casual',
 'Kokopo', -4.3520, 152.2633, 13000, 15000,
 'Assist chefs with food preparation, dishwashing and keeping the kitchen clean and safe.',
 'No experience needed. Must be punctual and able to work weekends.',
 array['food safety','teamwork','cleaning'], current_date + 15),

('00000000-0000-4000-8000-000000000017',
 'Graduate Civil Engineer', 'Gazelle Roadworks', 'Construction', 'Graduate',
 'Kokopo', -4.3461, 152.2701, 58000, 68000,
 'Work on road rehabilitation and drainage projects across the Gazelle Peninsula under a registered engineer.',
 'Bachelor of Engineering (Civil). Valid driving licence.',
 array['autocad','surveying','site safety','driving licence'], current_date + 65),

('00000000-0000-4000-8000-000000000018',
 'Administration Officer', 'East New Britain Community Trust', 'Administration', 'Full-time',
 'Kokopo', -4.3577, 152.2568, 26000, 32000,
 'Handle correspondence, filing, meeting minutes and petty cash for a community grants organisation.',
 'Certificate or Diploma in Office Administration. Strong Microsoft Office skills.',
 array['microsoft office','filing','customer service'], current_date + 38),

-- --------------------------------------------------------------------- Wewak
('00000000-0000-4000-8000-000000000019',
 'Truck Driver', 'Sepik Haulage Services', 'Transport', 'Full-time',
 'Wewak', -3.5535, 143.6366, 24000, 30000,
 'Deliver general cargo between Wewak, Maprik and surrounding districts. Some overnight trips.',
 'Current heavy-vehicle driving licence and a clean driving record.',
 array['driving licence','heavy vehicle','logbook'], current_date + 22),

('00000000-0000-4000-8000-000000000020',
 'Community Health Worker', 'Wewak Family Health Outreach', 'Health', 'Full-time',
 'Wewak', -3.5479, 143.6427, 28000, 34000,
 'Run village health patrols covering immunisation, nutrition and family planning education.',
 'Certificate in Community Health. Fluent Tok Pisin; local language an advantage.',
 array['first aid','community engagement','tok pisin'], current_date + 48),

('00000000-0000-4000-8000-000000000021',
 'Office Administration Intern', 'Sepik Heritage Tours', 'Administration', 'Internship',
 'Wewak', -3.5592, 143.6301, 12000, 14000,
 'Three-month internship assisting with tour bookings, invoicing and social media updates.',
 'Studying Business or Office Administration. Good written English.',
 array['microsoft office','data entry','communication'], current_date + 26),

-- ---------------------------------------------------------------------- Kimbe
('00000000-0000-4000-8000-000000000022',
 'Plantation Supervisor', 'Talasea Palm Estates', 'Agriculture', 'Full-time',
 'Kimbe', -5.5544, 150.1378, 45000, 55000,
 'Supervise harvesting gangs, track daily yields and ensure safe work practices on an oil palm estate.',
 'Diploma in Tropical Agriculture and 2+ years supervisory experience. Driving licence required.',
 array['supervision','oil palm','reporting','driving licence'], current_date + 52),

('00000000-0000-4000-8000-000000000023',
 'Graduate Environmental Officer', 'Kimbe Bay Environmental Services', 'Agriculture', 'Graduate',
 'Kimbe', -5.5488, 150.1442, 44000, 52000,
 'Carry out water quality sampling and help prepare environmental compliance reports for agricultural clients.',
 'Degree in Environmental Science or similar. GIS experience is a bonus.',
 array['environmental monitoring','report writing','gis'], current_date + 70),

('00000000-0000-4000-8000-000000000024',
 'Diesel Mechanic Apprentice', 'WNB Machinery Services', 'Engineering', 'Internship',
 'Kimbe', -5.5601, 150.1315, 16000, 20000,
 'Learn to service tractors, trucks and generators in a fully equipped workshop.',
 'Grade 10 or 12 certificate. Mechanically minded and keen to learn.',
 array['mechanics','diesel engines','safety'], current_date + 30),

-- --------------------------------------------------------------------- Alotau
('00000000-0000-4000-8000-000000000025',
 'Tour Guide', 'Milne Bay Island Adventures', 'Hospitality', 'Casual',
 'Alotau', -10.3148, 150.4574, 15000, 20000,
 'Guide visitors on island, diving and WWII history tours around Milne Bay.',
 'Confident communicator, good swimmer and current first aid certificate.',
 array['customer service','english','first aid','boating'], current_date + 24),

('00000000-0000-4000-8000-000000000026',
 'Mining Field Assistant', 'Suau Minerals Exploration', 'Mining', 'Full-time',
 'Alotau', -10.3092, 150.4638, 35000, 42000,
 'Support geologists with soil sampling, core handling and camp logistics on a fly-in fly-out roster.',
 'Grade 12 certificate. Physically fit and able to pass a medical. Driving licence preferred.',
 array['fieldwork','safety','sampling','driving licence'], current_date + 44),

('00000000-0000-4000-8000-000000000027',
 'Graduate Mathematics Teacher', 'Wagawaga Secondary Academy', 'Education', 'Graduate',
 'Alotau', -10.3205, 150.4511, 36000, 42000,
 'Teach Grade 9–12 mathematics with mentoring from experienced staff in your first year.',
 'Bachelor of Education (Mathematics) or equivalent and teacher registration.',
 array['mathematics','lesson planning','classroom management'], current_date + 75),

-- -------------------------------------------------------------------- Kavieng
('00000000-0000-4000-8000-000000000028',
 'Store Supervisor', 'New Ireland General Stores', 'Retail', 'Full-time',
 'Kavieng', -2.5744, 150.7967, 26000, 31000,
 'Lead a small team, manage cash-up and stock orders, and keep the store presentable.',
 'At least one year of retail experience. Previous supervisory role an advantage.',
 array['supervision','cash handling','stock control'], current_date + 36),

('00000000-0000-4000-8000-000000000029',
 'Eco Lodge Volunteer', 'Nusa Point Eco Lodge', 'Hospitality', 'Volunteer',
 'Kavieng', -2.5688, 150.8031, null, null,
 'Four-week volunteer placement helping with guest services, garden upkeep and beach clean-ups. Accommodation provided.',
 'Aged 18–30, friendly and comfortable working outdoors.',
 array['hospitality','cleaning','customer service'], current_date + 58),

('00000000-0000-4000-8000-000000000030',
 'Graduate Geologist', 'Lelet Plateau Resources', 'Mining', 'Graduate',
 'Kavieng', -2.5801, 150.7904, 65000, 80000,
 'Two-year graduate rotation in exploration and mine geology across New Ireland projects.',
 'Bachelor of Science (Geology). Must be willing to work a FIFO roster.',
 array['geology','core logging','gis','safety'], current_date + 85)

on conflict (id) do nothing;
