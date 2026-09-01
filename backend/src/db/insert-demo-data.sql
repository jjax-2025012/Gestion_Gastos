-- =============================================
-- DATOS DE PRUEBA PARA EL DASHBOARD (OSCORP)
-- =============================================

-- 1. Reemplaza 'TU_USER_ID' con el ID que te dio el comando anterior
--    (Si no lo tienes, puedes usar la consulta: SELECT id FROM users WHERE email = 'jjax-2025012@gmail.com';)

-- 2. Insertar GASTOS (Expenses) para que salgan en la gráfica de líneas y dona
INSERT INTO expenses (user_id, category_id, description, amount, expense_date, notes) VALUES
-- Alimentación (Busca el ID de la categoría automáticamente)
('TU_USER_ID', (SELECT id FROM categories WHERE name = 'Alimentación'), 'Supermercado La Torre', 350.00, '2026-08-03', 'Compra semanal'),
('TU_USER_ID', (SELECT id FROM categories WHERE name = 'Alimentación'), 'Mercado Central', 210.00, '2026-08-10', 'Víveres'),
('TU_USER_ID', (SELECT id FROM categories WHERE name = 'Alimentación'), 'Café Starbucks', 45.00, '2026-08-15', 'Reunión'),

-- Transporte
('TU_USER_ID', (SELECT id FROM categories WHERE name = 'Transporte'), 'Uber', 25.50, '2026-08-05', 'Viaje al centro'),
('TU_USER_ID', (SELECT id FROM categories WHERE name = 'Transporte'), 'Gasolina', 300.00, '2026-08-12', 'Tanque lleno'),

-- Entretenimiento
('TU_USER_ID', (SELECT id FROM categories WHERE name = 'Entretenimiento'), 'Cine (2 boletos)', 80.00, '2026-08-07', 'Estreno'),
('TU_USER_ID', (SELECT id FROM categories WHERE name = 'Entretenimiento'), 'PlayStation Store', 120.00, '2026-08-18', 'Juego digital'),

-- Salud
('TU_USER_ID', (SELECT id FROM categories WHERE name = 'Salud'), 'Farmacia Cruz Verde', 45.00, '2026-08-08', 'Vitaminas'),

-- Educación
('TU_USER_ID', (SELECT id FROM categories WHERE name = 'Educación'), 'Curso de inglés', 200.00, '2026-08-14', 'Pago mensual'),

-- Servicios
('TU_USER_ID', (SELECT id FROM categories WHERE name = 'Servicios'), 'Luz', 150.00, '2026-08-20', 'Recibo'),
('TU_USER_ID', (SELECT id FROM categories WHERE name = 'Servicios'), 'Internet', 250.00, '2026-08-21', 'Fibra óptica'),

-- Otros
('TU_USER_ID', (SELECT id FROM categories WHERE name = 'Otros'), 'Regalo cumpleaños', 100.00, '2026-08-25', 'Para mi hermano');


-- 3. Insertar INGRESOS (Incomes) para que la gráfica de "Gastos vs Ingresos" se vea balanceada
INSERT INTO incomes (user_id, category_id, description, amount, income_date, notes) VALUES
-- Salario
('TU_USER_ID', (SELECT id FROM categories WHERE name = 'Salario'), 'Pago quincenal', 4500.00, '2026-08-01', 'Salario quincena 1'),
('TU_USER_ID', (SELECT id FROM categories WHERE name = 'Salario'), 'Pago quincenal', 4500.00, '2026-08-15', 'Salario quincena 2'),

-- Freelance
('TU_USER_ID', (SELECT id FROM categories WHERE name = 'Freelance'), 'Diseño web', 1500.00, '2026-08-10', 'Proyecto cliente X'),
('TU_USER_ID', (SELECT id FROM categories WHERE name = 'Freelance'), 'App móvil', 2000.00, '2026-08-20', 'Proyecto cliente Y');