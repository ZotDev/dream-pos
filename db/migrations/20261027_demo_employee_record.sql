-- Ensure the demo employee login has an employee record for self-service attendance and leave.
INSERT INTO employees(employee_code,full_name,email,department,job_title,salary,joined_on,store_id)
SELECT 'EMP-DEMO-001',u.full_name,u.email,'Operations','Store Associate',25000,CURRENT_DATE,COALESCE(u.store_id,(SELECT id FROM stores WHERE is_active=true ORDER BY id LIMIT 1))
FROM app_users u
WHERE lower(u.email)='employee@dreampos.demo'
AND NOT EXISTS (SELECT 1 FROM employees e WHERE lower(e.email)=lower(u.email))
AND NOT EXISTS (SELECT 1 FROM employees e WHERE e.employee_code='EMP-DEMO-001');
