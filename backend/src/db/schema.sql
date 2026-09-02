-- ============================================================================



-- RESET Y RECREACIÓN COMPLETA DE LA BASE DE DATOS "OSCORP"



-- ============================================================================

 

 

-- 1) LIMPIEZA: Eliminar datos existentes para evitar conflictos



--    (Esto NO borra la tabla users, solo los datos de prueba)

TRUNCATE TABLE reports, expenses, incomes RESTART IDENTITY CASCADE;



DELETE FROM categories WHERE user_id IS NOT NULL;

 

-- 2) GARANTIZAR EXTENSIÓN PARA UUIDs



CREATE EXTENSION IF NOT EXISTS pgcrypto;

 

-- ----------------------------------------------------------------------------



-- 3) TABLA USERS (ya existe, solo se asegura)



-- ----------------------------------------------------------------------------



CREATE TABLE IF NOT EXISTS users (



    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),



    username      VARCHAR(100) NOT NULL,



    email         VARCHAR(150) NOT NULL UNIQUE,



    password_hash VARCHAR(255) NOT NULL,



    gender        VARCHAR(20) NOT NULL CHECK (gender IN ('male', 'female', 'other')),

    avatar_url    TEXT,



    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()



);

ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;

 

-- ----------------------------------------------------------------------------



-- 4) TABLA CATEGORIES



-- ----------------------------------------------------------------------------



CREATE TABLE IF NOT EXISTS categories (



    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),



    user_id     UUID REFERENCES users(id) ON DELETE CASCADE, -- NULL = categoría global



    name        VARCHAR(80) NOT NULL,



    type        VARCHAR(20) NOT NULL CHECK (type IN ('expense', 'income', 'both')),



    color       VARCHAR(20),



    icon        VARCHAR(80),



    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),



    UNIQUE (user_id, name, type)



);

 

-- ----------------------------------------------------------------------------



-- 5) TABLA EXPENSES



-- ----------------------------------------------------------------------------



CREATE TABLE IF NOT EXISTS expenses (



    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),



    user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,



    category_id   UUID REFERENCES categories(id) ON DELETE SET NULL,



    description   VARCHAR(255) NOT NULL,



    amount        NUMERIC(12, 2) NOT NULL CHECK (amount > 0),



    expense_date  DATE NOT NULL DEFAULT CURRENT_DATE,



    is_recurring  BOOLEAN NOT NULL DEFAULT FALSE,



    notes         TEXT,



    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),



    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()



);

 

-- ----------------------------------------------------------------------------



-- 6) TABLA INCOMES



-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS incomes (



    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),



    user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,



    category_id   UUID REFERENCES categories(id) ON DELETE SET NULL,



    description   VARCHAR(255) NOT NULL,



    amount        NUMERIC(12, 2) NOT NULL CHECK (amount > 0),



    income_date   DATE NOT NULL DEFAULT CURRENT_DATE,



    is_recurring  BOOLEAN NOT NULL DEFAULT FALSE,



    notes         TEXT,



    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),



    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()



);

 

-- ----------------------------------------------------------------------------



-- 7) TABLA REPORTS

CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message VARCHAR(255) NOT NULL,
    type VARCHAR(20) NOT NULL DEFAULT 'info' CHECK (type IN ('success', 'info', 'warning')),
    icon VARCHAR(40) NOT NULL DEFAULT 'info',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DELETE FROM notifications;



-- ----------------------------------------------------------------------------



CREATE TABLE IF NOT EXISTS reports (



    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),



    user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,



    title         VARCHAR(150) NOT NULL,



    report_type   VARCHAR(30) NOT NULL CHECK (



                      report_type IN ('monthly', 'annual', 'by_category', 'custom')



                  ),



    period_start  DATE NOT NULL,



    period_end    DATE NOT NULL,



    total_income  NUMERIC(12, 2) NOT NULL DEFAULT 0,



    total_expense NUMERIC(12, 2) NOT NULL DEFAULT 0,



    balance       NUMERIC(12, 2) GENERATED ALWAYS AS (total_income - total_expense) STORED,



    details       JSONB,



    file_url      VARCHAR(500),



    generated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()



);

 

-- ----------------------------------------------------------------------------



-- 8) ÍNDICES



-- ----------------------------------------------------------------------------



CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);



CREATE INDEX IF NOT EXISTS idx_categories_user ON categories (user_id);



CREATE INDEX IF NOT EXISTS idx_expenses_user ON expenses (user_id);



CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses (category_id);



CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses (expense_date);



CREATE INDEX IF NOT EXISTS idx_incomes_user ON incomes (user_id);



CREATE INDEX IF NOT EXISTS idx_incomes_category ON incomes (category_id);



CREATE INDEX IF NOT EXISTS idx_incomes_date ON incomes (income_date);



CREATE INDEX IF NOT EXISTS idx_reports_user ON reports (user_id);



CREATE INDEX IF NOT EXISTS idx_reports_period ON reports (period_start, period_end);

 

-- ----------------------------------------------------------------------------



-- 9) TRIGGERS PARA updated_at



-- ----------------------------------------------------------------------------



CREATE OR REPLACE FUNCTION set_updated_at()



RETURNS TRIGGER AS $$



BEGIN



    NEW.updated_at = NOW();



    RETURN NEW;



END;



$$ LANGUAGE plpgsql;

 

DROP TRIGGER IF EXISTS trg_expenses_updated_at ON expenses;



CREATE TRIGGER trg_expenses_updated_at



    BEFORE UPDATE ON expenses



    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

 

DROP TRIGGER IF EXISTS trg_incomes_updated_at ON incomes;



CREATE TRIGGER trg_incomes_updated_at



    BEFORE UPDATE ON incomes



    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

 

-- ----------------------------------------------------------------------------



-- 10) SEED DE CATEGORÍAS GLOBALES (mismas del mock)



-- ----------------------------------------------------------------------------



INSERT INTO categories (user_id, name, type, color) VALUES



    (NULL, 'Alimentación',    'expense', '#2563eb'),



    (NULL, 'Transporte',      'expense', '#10b981'),



    (NULL, 'Entretenimiento', 'expense', '#8b5cf6'),



    (NULL, 'Salud',           'expense', '#ec4899'),



    (NULL, 'Educación',       'expense', '#f59e0b'),



    (NULL, 'Servicios',       'expense', '#06b6d4'),



    (NULL, 'Otros',           'expense', '#9ca3af'),



    (NULL, 'Salario',         'income',  '#22c55e'),



    (NULL, 'Freelance',       'income',  '#0ea5e9'),



    (NULL, 'Otros ingresos',  'income',  '#a3a3a3')



ON CONFLICT (user_id, name, type) DO NOTHING;

 

-- ----------------------------------------------------------------------------



-- 11) INSERTAR DATOS DE PRUEBA (GASTOS E INGRESOS)



--     IMPORTANTE: Reemplaza 'TU_EMAIL' por tu email real (el que usaste para registrarte)



-- ----------------------------------------------------------------------------

 

-- Obtener el ID del usuario automáticamente



DO $$



DECLARE



    v_user_id UUID;



BEGIN



    SELECT id INTO v_user_id FROM users WHERE email = 'jjax-2025012@gmail.com';





    IF v_user_id IS NULL THEN



        RAISE NOTICE 'Usuario no encontrado con ese email. Registra primero el usuario.';



    ELSE



        -- Insertar GASTOS



        INSERT INTO expenses (user_id, category_id, description, amount, expense_date) VALUES



        (v_user_id, (SELECT id FROM categories WHERE name = 'Alimentación'), 'Supermercado La Torre', 350.00, '2026-08-03'),



        (v_user_id, (SELECT id FROM categories WHERE name = 'Alimentación'), 'Mercado Central', 210.00, '2026-08-10'),



        (v_user_id, (SELECT id FROM categories WHERE name = 'Transporte'), 'Uber', 25.50, '2026-08-05'),



        (v_user_id, (SELECT id FROM categories WHERE name = 'Transporte'), 'Gasolina', 300.00, '2026-08-12'),



        (v_user_id, (SELECT id FROM categories WHERE name = 'Entretenimiento'), 'Cine (2 boletos)', 80.00, '2026-08-07'),



        (v_user_id, (SELECT id FROM categories WHERE name = 'Entretenimiento'), 'PlayStation Store', 120.00, '2026-08-18'),



        (v_user_id, (SELECT id FROM categories WHERE name = 'Salud'), 'Farmacia Cruz Verde', 45.00, '2026-08-08'),



        (v_user_id, (SELECT id FROM categories WHERE name = 'Educación'), 'Curso de inglés', 200.00, '2026-08-14'),



        (v_user_id, (SELECT id FROM categories WHERE name = 'Servicios'), 'Luz', 150.00, '2026-08-20'),



        (v_user_id, (SELECT id FROM categories WHERE name = 'Servicios'), 'Internet', 250.00, '2026-08-21'),



        (v_user_id, (SELECT id FROM categories WHERE name = 'Otros'), 'Regalo cumpleaños', 100.00, '2026-08-25');

 

        -- Insertar INGRESOS



        INSERT INTO incomes (user_id, category_id, description, amount, income_date) VALUES



        (v_user_id, (SELECT id FROM categories WHERE name = 'Salario'), 'Pago quincenal', 4500.00, '2026-08-01'),



        (v_user_id, (SELECT id FROM categories WHERE name = 'Salario'), 'Pago quincenal', 4500.00, '2026-08-15'),



        (v_user_id, (SELECT id FROM categories WHERE name = 'Freelance'), 'Diseño web', 1500.00, '2026-08-10'),



        (v_user_id, (SELECT id FROM categories WHERE name = 'Freelance'), 'App móvil', 2000.00, '2026-08-20');



    END IF;



END $$;

 

-- ============================================================================



-- FIN DEL SCRIPT. 



-- Ahora ejecuta: SELECT * FROM expenses; para ver los datos insertados.



-- ============================================================================

 

 

-- Eliminar categorías globales duplicadas, dejando solo la más antigua (menor created_at)



DELETE FROM categories a



USING categories b



WHERE a.user_id IS NULL 



  AND b.user_id IS NULL



  AND a.name = b.name



  AND a.created_at > b.created_at;

 

-- Verifica que ya no hay duplicados



SELECT name, COUNT(*) FROM categories WHERE user_id IS NULL GROUP BY name HAVING COUNT(*) > 1;



-- (Si no devuelve nada, ya no hay duplicados)

 

DO $$



DECLARE



    v_user_id UUID;



BEGIN



    SELECT id INTO v_user_id FROM users WHERE email = 'jax@gmail.com';





    IF v_user_id IS NULL THEN



        RAISE NOTICE '❌ Usuario no encontrado. Verifica el email.';



    ELSE



        -- Insertar GASTOS



        INSERT INTO expenses (user_id, category_id, description, amount, expense_date) VALUES



        (v_user_id, (SELECT id FROM categories WHERE name = 'Alimentación' AND user_id IS NULL LIMIT 1), 'Supermercado La Torre', 350.00, '2026-08-03'),



        (v_user_id, (SELECT id FROM categories WHERE name = 'Alimentación' AND user_id IS NULL LIMIT 1), 'Mercado Central', 210.00, '2026-08-10'),



        (v_user_id, (SELECT id FROM categories WHERE name = 'Transporte' AND user_id IS NULL LIMIT 1), 'Uber', 25.50, '2026-08-05'),



        (v_user_id, (SELECT id FROM categories WHERE name = 'Transporte' AND user_id IS NULL LIMIT 1), 'Gasolina', 300.00, '2026-08-12'),



        (v_user_id, (SELECT id FROM categories WHERE name = 'Entretenimiento' AND user_id IS NULL LIMIT 1), 'Cine (2 boletos)', 80.00, '2026-08-07'),



        (v_user_id, (SELECT id FROM categories WHERE name = 'Entretenimiento' AND user_id IS NULL LIMIT 1), 'PlayStation Store', 120.00, '2026-08-18'),



        (v_user_id, (SELECT id FROM categories WHERE name = 'Salud' AND user_id IS NULL LIMIT 1), 'Farmacia Cruz Verde', 45.00, '2026-08-08'),



        (v_user_id, (SELECT id FROM categories WHERE name = 'Educación' AND user_id IS NULL LIMIT 1), 'Curso de inglés', 200.00, '2026-08-14'),



        (v_user_id, (SELECT id FROM categories WHERE name = 'Servicios' AND user_id IS NULL LIMIT 1), 'Luz', 150.00, '2026-08-20'),



        (v_user_id, (SELECT id FROM categories WHERE name = 'Servicios' AND user_id IS NULL LIMIT 1), 'Internet', 250.00, '2026-08-21'),



        (v_user_id, (SELECT id FROM categories WHERE name = 'Otros' AND user_id IS NULL LIMIT 1), 'Regalo cumpleaños', 100.00, '2026-08-25');

 

        -- Insertar INGRESOS



        INSERT INTO incomes (user_id, category_id, description, amount, income_date) VALUES



        (v_user_id, (SELECT id FROM categories WHERE name = 'Salario' AND user_id IS NULL LIMIT 1), 'Pago quincenal', 4500.00, '2026-08-01'),



        (v_user_id, (SELECT id FROM categories WHERE name = 'Salario' AND user_id IS NULL LIMIT 1), 'Pago quincenal', 4500.00, '2026-08-15'),



        (v_user_id, (SELECT id FROM categories WHERE name = 'Freelance' AND user_id IS NULL LIMIT 1), 'Diseño web', 1500.00, '2026-08-10'),



        (v_user_id, (SELECT id FROM categories WHERE name = 'Freelance' AND user_id IS NULL LIMIT 1), 'App móvil', 2000.00, '2026-08-20');





        RAISE NOTICE '✅ Datos insertados correctamente para Jax (ID: %)', v_user_id;



    END IF;



END $$;