-- ═══════════════════════════════════════════════════════════════════════════
-- spa-saas: Schema completo de base de datos
-- ═══════════════════════════════════════════════════════════════════════════
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- Prerequisitos: auth.users existe (nativo de Supabase)
-- ═══════════════════════════════════════════════════════════════════════════

-- ── Extensiones ──────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- para búsqueda full-text

-- ════════════════════════════════════════════════════════
-- TABLA: tenants
-- ════════════════════════════════════════════════════════
CREATE TABLE tenants (
  id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug  TEXT UNIQUE NOT NULL,
  name  TEXT NOT NULL,

  -- Localización
  default_locale  TEXT DEFAULT 'es',
  active_locales  TEXT[] DEFAULT '{es}',
  currency        TEXT DEFAULT 'COP',
  timezone        TEXT DEFAULT 'America/Bogota',

  -- Branding (Light mode)
  logo_url                TEXT,
  brand_color_primary     TEXT DEFAULT '#7F77DD',
  brand_color_bg          TEXT DEFAULT '#ffffff',
  brand_color_text        TEXT DEFAULT '#1a1a1a',
  brand_color_surface     TEXT DEFAULT '#f5f5f5',
  brand_color_border      TEXT DEFAULT '#e0e0e0',

  -- Branding (Dark mode)
  brand_color_dark_bg      TEXT DEFAULT '#0f0f0f',
  brand_color_dark_surface TEXT DEFAULT '#1c1c1c',
  brand_color_dark_text    TEXT DEFAULT '#f0f0f0',
  brand_color_dark_border  TEXT DEFAULT '#2e2e2e',

  -- Tipografía y formas
  brand_font_heading    TEXT DEFAULT 'Georgia, serif',
  brand_font_body       TEXT DEFAULT 'system-ui, sans-serif',
  brand_radius          TEXT DEFAULT '8px',

  -- Textos del home editables por el admin del SPA (JSONB por locale)
  hero_headline   JSONB DEFAULT '{"es":"Bienvenida"}',
  hero_subtext    JSONB DEFAULT '{"es":"Tu spa de confianza"}',
  hero_cta        JSONB DEFAULT '{"es":"Agendar cita"}',

  -- Feature flags
  feature_store         BOOLEAN DEFAULT true,
  feature_inventory     BOOLEAN DEFAULT true,
  feature_loyalty       BOOLEAN DEFAULT true,
  feature_referrals     BOOLEAN DEFAULT true,
  feature_reviews       BOOLEAN DEFAULT true,
  feature_solar         BOOLEAN DEFAULT false,
  feature_sales_history BOOLEAN DEFAULT true,
  feature_whatsapp_bot  BOOLEAN DEFAULT false,

  -- Configuración de fidelización
  points_per_service   INT DEFAULT 100,
  points_per_purchase  INT DEFAULT 1,
  referral_bonus_pts   INT DEFAULT 200,
  cancellation_penalty INT DEFAULT 50,

  -- Plan
  plan       TEXT DEFAULT 'starter' CHECK (plan IN ('starter','pro','premium')),
  active     BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ════════════════════════════════════════════════════════
-- TABLA: profiles
-- ════════════════════════════════════════════════════════
CREATE TABLE profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  full_name   TEXT,
  avatar_url  TEXT,
  role        TEXT DEFAULT 'cliente' CHECK (role IN ('cliente','recepcionista','admin')),
  referral_code   TEXT UNIQUE DEFAULT upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)),
  referred_by     UUID REFERENCES profiles(id),
  loyalty_points  INT DEFAULT 0,
  preferred_theme TEXT DEFAULT 'system' CHECK (preferred_theme IN ('light','dark','system')),
  preferred_locale TEXT DEFAULT 'es',
  notifications_promo BOOLEAN DEFAULT false,
  notifications_tips  BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ════════════════════════════════════════════════════════
-- TABLA: services
-- ════════════════════════════════════════════════════════
CREATE TABLE services (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name        JSONB NOT NULL DEFAULT '{"es":"Servicio"}',
  description JSONB,
  duration_min INT NOT NULL DEFAULT 60,
  price        NUMERIC(10,2) NOT NULL DEFAULT 0,
  category     TEXT,
  image_url    TEXT,
  active       BOOLEAN DEFAULT true,
  sort_order   INT DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT now()
);

-- ════════════════════════════════════════════════════════
-- TABLA: specialists
-- ════════════════════════════════════════════════════════
CREATE TABLE specialists (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id  UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES profiles(id),
  name       TEXT NOT NULL,
  bio        JSONB,
  avatar_url TEXT,
  services   UUID[] DEFAULT '{}', -- IDs de servicios que puede realizar
  active     BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ════════════════════════════════════════════════════════
-- TABLA: specialist_schedules
-- ════════════════════════════════════════════════════════
CREATE TABLE specialist_schedules (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  specialist_id UUID NOT NULL REFERENCES specialists(id) ON DELETE CASCADE,
  tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  day_of_week   INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=domingo
  start_time    TIME NOT NULL,
  end_time      TIME NOT NULL,
  is_working    BOOLEAN DEFAULT true
);

-- ════════════════════════════════════════════════════════
-- TABLA: appointments
-- ════════════════════════════════════════════════════════
CREATE TABLE appointments (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  client_id     UUID NOT NULL REFERENCES profiles(id),
  specialist_id UUID REFERENCES specialists(id),
  service_id    UUID NOT NULL REFERENCES services(id),
  scheduled_at  TIMESTAMPTZ NOT NULL,
  ends_at       TIMESTAMPTZ NOT NULL,
  status        TEXT DEFAULT 'confirmed' CHECK (status IN ('pending','confirmed','completed','cancelled')),
  notes         TEXT,
  points_earned INT DEFAULT 0,
  cancelled_at  TIMESTAMPTZ,
  cancel_reason TEXT,
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- ════════════════════════════════════════════════════════
-- TABLA: solar_spaces (solo tenants con feature_solar)
-- ════════════════════════════════════════════════════════
CREATE TABLE solar_spaces (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  description TEXT,
  capacity    INT DEFAULT 1,
  active      BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- ════════════════════════════════════════════════════════
-- TABLA: solar_bookings
-- ════════════════════════════════════════════════════════
CREATE TABLE solar_bookings (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  space_id     UUID NOT NULL REFERENCES solar_spaces(id),
  client_id    UUID NOT NULL REFERENCES profiles(id),
  scheduled_at TIMESTAMPTZ NOT NULL,
  ends_at      TIMESTAMPTZ NOT NULL,
  status       TEXT DEFAULT 'confirmed' CHECK (status IN ('pending','confirmed','completed','cancelled')),
  points_earned INT DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT now()
);

-- ════════════════════════════════════════════════════════
-- TABLA: products
-- ════════════════════════════════════════════════════════
CREATE TABLE products (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id            UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name                 JSONB NOT NULL DEFAULT '{"es":"Producto"}',
  description          JSONB,
  price                NUMERIC(10,2) NOT NULL DEFAULT 0,
  stock                INT DEFAULT 0,
  stock_alert_threshold INT DEFAULT 5,
  image_url            TEXT,
  category             TEXT,
  active               BOOLEAN DEFAULT true,
  created_at           TIMESTAMPTZ DEFAULT now()
);

-- ════════════════════════════════════════════════════════
-- TABLA: orders
-- ════════════════════════════════════════════════════════
CREATE TABLE orders (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  client_id   UUID NOT NULL REFERENCES profiles(id),
  status      TEXT DEFAULT 'pending' CHECK (status IN ('pending','confirmed','delivered','cancelled')),
  total       NUMERIC(10,2) NOT NULL DEFAULT 0,
  points_used INT DEFAULT 0,
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- ════════════════════════════════════════════════════════
-- TABLA: order_items
-- ════════════════════════════════════════════════════════
CREATE TABLE order_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id    UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id  UUID NOT NULL REFERENCES products(id),
  quantity    INT NOT NULL DEFAULT 1,
  unit_price  NUMERIC(10,2) NOT NULL
);

-- ════════════════════════════════════════════════════════
-- TABLA: inventory_movements
-- ════════════════════════════════════════════════════════
CREATE TABLE inventory_movements (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  product_id  UUID NOT NULL REFERENCES products(id),
  staff_id    UUID REFERENCES profiles(id),
  type        TEXT NOT NULL CHECK (type IN ('entrada','salida','ajuste')),
  quantity    INT NOT NULL, -- positivo=entrada, negativo=salida
  reason      TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- ════════════════════════════════════════════════════════
-- TABLA: loyalty_transactions
-- ════════════════════════════════════════════════════════
CREATE TABLE loyalty_transactions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  profile_id   UUID NOT NULL REFERENCES profiles(id),
  points       INT NOT NULL, -- positivo=ganados, negativo=canjeados
  type         TEXT NOT NULL CHECK (type IN ('service','purchase','referral','review','cancellation','redemption','manual')),
  reference_id UUID, -- ID del appointment, order, etc.
  description  TEXT,
  created_at   TIMESTAMPTZ DEFAULT now()
);

-- ════════════════════════════════════════════════════════
-- TABLA: redemption_rules
-- ════════════════════════════════════════════════════════
CREATE TABLE redemption_rules (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name        JSONB NOT NULL DEFAULT '{"es":"Regla de canje"}',
  points_cost INT NOT NULL,
  target_type TEXT NOT NULL CHECK (target_type IN ('service','product','discount_pct')),
  target_id   UUID, -- ID del servicio o producto (null si es descuento %)
  discount_pct NUMERIC(5,2), -- porcentaje de descuento (si aplica)
  active      BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- ════════════════════════════════════════════════════════
-- TABLA: referrals
-- ════════════════════════════════════════════════════════
CREATE TABLE referrals (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  referrer_id  UUID NOT NULL REFERENCES profiles(id),
  referred_id  UUID NOT NULL REFERENCES profiles(id),
  bonus_paid   BOOLEAN DEFAULT false,
  bonus_paid_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT now(),
  UNIQUE(referred_id) -- cada persona solo puede ser referida una vez
);

-- ════════════════════════════════════════════════════════
-- TABLA: reviews
-- ════════════════════════════════════════════════════════
CREATE TABLE reviews (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  client_id      UUID NOT NULL REFERENCES profiles(id),
  appointment_id UUID NOT NULL REFERENCES appointments(id),
  rating         INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment        TEXT,
  status         TEXT DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  spa_response   TEXT,
  points_paid    BOOLEAN DEFAULT false,
  created_at     TIMESTAMPTZ DEFAULT now(),
  UNIQUE(appointment_id) -- una reseña por cita
);

-- ════════════════════════════════════════════════════════
-- TABLA: push_subscriptions
-- ════════════════════════════════════════════════════════
CREATE TABLE push_subscriptions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id  UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  endpoint   TEXT NOT NULL,
  p256dh     TEXT NOT NULL,
  auth       TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(profile_id, endpoint)
);

-- ════════════════════════════════════════════════════════
-- TABLA: notifications_log
-- ════════════════════════════════════════════════════════
CREATE TABLE notifications_log (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  profile_id  UUID REFERENCES profiles(id),
  type        TEXT NOT NULL,
  title       TEXT NOT NULL,
  body        TEXT,
  sent_at     TIMESTAMPTZ DEFAULT now(),
  opened_at   TIMESTAMPTZ,
  error       TEXT
);

-- ════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY (RLS)
-- ════════════════════════════════════════════════════════
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE specialists ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Políticas básicas: cada usuario ve solo datos de su tenant
-- (Las políticas completas se definen en docs/rls-policies.sql)

-- tenants: lectura pública (anon puede leer para cargar el tema)
CREATE POLICY "Tenants son públicamente legibles" ON tenants
  FOR SELECT USING (active = true);

-- profiles: cada usuario ve/edita su propio perfil
CREATE POLICY "Usuarios ven su propio perfil" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Usuarios editan su propio perfil" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- ════════════════════════════════════════════════════════
-- TRIGGER: crear profile al registrarse
-- ════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_tenant_id UUID;
  v_tenant_slug TEXT;
BEGIN
  -- El tenant_slug viene en raw_user_meta_data al hacer signUp
  v_tenant_slug := NEW.raw_user_meta_data->>'tenant_slug';

  IF v_tenant_slug IS NOT NULL THEN
    SELECT id INTO v_tenant_id FROM tenants WHERE slug = v_tenant_slug AND active = true;
  END IF;

  INSERT INTO public.profiles (id, tenant_id, full_name, avatar_url)
  VALUES (
    NEW.id,
    v_tenant_id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );

  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ════════════════════════════════════════════════════════
-- DATOS INICIALES (development / seed)
-- ════════════════════════════════════════════════════════

INSERT INTO tenants (
  slug, name, default_locale, active_locales, currency, timezone,
  brand_color_primary, brand_color_bg, brand_color_text, brand_color_surface, brand_color_border,
  brand_color_dark_bg, brand_color_dark_surface, brand_color_dark_text, brand_color_dark_border,
  brand_font_heading, brand_font_body, brand_radius,
  hero_headline, hero_subtext, hero_cta,
  feature_solar, plan
) VALUES (
  'spa-luna',
  'Spa Luna',
  'es',
  '{es}',
  'COP',
  'America/Bogota',
  '#c9956a',
  '#1a1a2e',
  '#f0e8df',
  '#252540',
  '#3a3a5c',
  '#0d0d1a',
  '#1a1a2e',
  '#f0e8df',
  '#2e2e4a',
  'Georgia, serif',
  'system-ui, sans-serif',
  '4px',
  '{"es":"Tu espacio de bienestar y belleza"}',
  '{"es":"Reserva tu cita con los mejores especialistas"}',
  '{"es":"Agendar cita"}',
  true,
  'premium'
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO tenants (
  slug, name, default_locale, active_locales, currency, timezone,
  brand_color_primary, brand_color_bg, brand_color_text, brand_color_surface, brand_color_border,
  brand_color_dark_bg, brand_color_dark_surface, brand_color_dark_text, brand_color_dark_border,
  brand_font_heading, brand_font_body, brand_radius,
  hero_headline, hero_subtext, hero_cta,
  feature_solar, plan
) VALUES (
  'glam-studio',
  'Glam Studio',
  'en',
  '{en,es}',
  'USD',
  'America/New_York',
  '#d4af6a',
  '#0a0a0a',
  '#f5f5f5',
  '#1a1a1a',
  '#2e2e2e',
  '#000000',
  '#111111',
  '#f5f5f5',
  '#222222',
  '''Playfair Display'', serif',
  '''DM Sans'', sans-serif',
  '2px',
  '{"en":"Where beauty meets precision","es":"Donde la belleza se encuentra con la precisión"}',
  '{"en":"Book your appointment with our expert stylists","es":"Reserva tu cita con nuestros estilistas expertos"}',
  '{"en":"Book now","es":"Reservar"}',
  false,
  'pro'
) ON CONFLICT (slug) DO NOTHING;

-- ════════════════════════════════════════════════════════
-- SEED: servicios de prueba — spa-luna
-- ════════════════════════════════════════════════════════
INSERT INTO services (tenant_id, name, description, duration_min, price, category, sort_order)
SELECT
  t.id,
  v.name::jsonb,
  v.description::jsonb,
  v.duration_min,
  v.price,
  v.category,
  v.sort_order
FROM tenants t, (VALUES
  ('{"es":"Facial hidratante"}',         '{"es":"Limpieza profunda e hidratación con productos premium"}', 60,  85000, 'facial',    1),
  ('{"es":"Masaje relajante"}',          '{"es":"Masaje de cuerpo completo con aceites esenciales"}',      75,  120000,'masaje',    2),
  ('{"es":"Manicure spa"}',              '{"es":"Manicure completo con exfoliación y masaje de manos"}',   45,  45000, 'uñas',      3),
  ('{"es":"Pedicure spa"}',              '{"es":"Pedicure completo con baño de pies y masaje"}',           60,  55000, 'uñas',      4),
  ('{"es":"Lifting de pestañas"}',       '{"es":"Rizado semipermanente con efecto lifting natural"}',      75,  95000, 'ojos',      5),
  ('{"es":"Depilación facial"}',         '{"es":"Depilación con hilo o cera para cejas y labio"}',         30,  35000, 'depilacion',6)
) AS v(name, description, duration_min, price, category, sort_order)
WHERE t.slug = 'spa-luna'
ON CONFLICT DO NOTHING;

-- ════════════════════════════════════════════════════════
-- SEED: servicios de prueba — glam-studio
-- ════════════════════════════════════════════════════════
INSERT INTO services (tenant_id, name, description, duration_min, price, category, sort_order)
SELECT
  t.id,
  v.name::jsonb,
  v.description::jsonb,
  v.duration_min,
  v.price,
  v.category,
  v.sort_order
FROM tenants t, (VALUES
  ('{"en":"Precision Haircut","es":"Corte de precisión"}',   '{"en":"Expert cut tailored to your face shape","es":"Corte experto según tu forma de cara"}',       45,  65,  'hair',  1),
  ('{"en":"Full Color","es":"Color completo"}',              '{"en":"Single-process permanent color with gloss","es":"Color permanente de proceso único con gloss"}', 90, 120,  'color', 2),
  ('{"en":"Highlights","es":"Mechas"}',                      '{"en":"Balayage or foil highlights for dimension","es":"Balayage o mechas con papel para volumen"}',   120, 160, 'color', 3),
  ('{"en":"Blowout & Style","es":"Secado y peinado"}',       '{"en":"Shampoo, blow-dry and finish styling","es":"Champú, secado y peinado final"}',                  45,  55,  'hair',  4),
  ('{"en":"Gel Manicure","es":"Manicure en gel"}',           '{"en":"Long-lasting gel polish with base coat","es":"Esmalte en gel de larga duración con base"}',    50,  45,  'nails', 5)
) AS v(name, description, duration_min, price, category, sort_order)
WHERE t.slug = 'glam-studio'
ON CONFLICT DO NOTHING;

-- ════════════════════════════════════════════════════════
-- SEED: especialistas de prueba — spa-luna
-- ════════════════════════════════════════════════════════
INSERT INTO specialists (tenant_id, name, bio, active)
SELECT
  t.id, v.name, v.bio::jsonb, true
FROM tenants t, (VALUES
  ('Valentina Ríos',   '{"es":"Especialista en faciales y tratamientos de piel con 8 años de experiencia"}'),
  ('Camila Torres',    '{"es":"Masajista certificada, experta en técnicas relajantes y terapéuticas"}'),
  ('Sofía Mendoza',    '{"es":"Especialista en uñas y nail art, formada en Bogotá y Ciudad de México"}')
) AS v(name, bio)
WHERE t.slug = 'spa-luna'
ON CONFLICT DO NOTHING;

-- ════════════════════════════════════════════════════════
-- SEED: especialistas de prueba — glam-studio
-- ════════════════════════════════════════════════════════
INSERT INTO specialists (tenant_id, name, bio, active)
SELECT
  t.id, v.name, v.bio::jsonb, true
FROM tenants t, (VALUES
  ('Marcus Chen',   '{"en":"Master colorist with 12 years at top NYC salons","es":"Colorista maestro con 12 años en los mejores salones de NYC"}'),
  ('Ava Rodriguez', '{"en":"Precision cutting specialist and styling expert","es":"Especialista en cortes de precisión y estilismo"}')
) AS v(name, bio)
WHERE t.slug = 'glam-studio'
ON CONFLICT DO NOTHING;

-- ════════════════════════════════════════════════════════
-- RLS adicionales para Sprint 2
-- ════════════════════════════════════════════════════════

-- services: lectura pública por tenant
CREATE POLICY "Servicios son públicamente legibles" ON services
  FOR SELECT USING (active = true);

-- specialists: lectura pública por tenant
CREATE POLICY "Especialistas son públicamente legibles" ON specialists
  FOR SELECT USING (active = true);


-- ════════════════════════════════════════════════════════
-- SEED: horarios de especialistas — Sprint 3
-- ════════════════════════════════════════════════════════
-- spa-luna: lunes–sábado 09:00–18:00
INSERT INTO specialist_schedules (specialist_id, tenant_id, day_of_week, start_time, end_time, is_working)
SELECT
  sp.id,
  sp.tenant_id,
  d.day,
  '09:00:00'::TIME,
  '18:00:00'::TIME,
  CASE WHEN d.day = 0 THEN false ELSE true END
FROM specialists sp
CROSS JOIN (SELECT generate_series(0,6) AS day) d
JOIN tenants t ON t.id = sp.tenant_id
WHERE t.slug = 'spa-luna'
ON CONFLICT DO NOTHING;

-- glam-studio: lunes–viernes 10:00–19:00, sábado 10:00–16:00, domingo cerrado
INSERT INTO specialist_schedules (specialist_id, tenant_id, day_of_week, start_time, end_time, is_working)
SELECT
  sp.id,
  sp.tenant_id,
  d.day,
  CASE WHEN d.day BETWEEN 1 AND 5 THEN '10:00:00'::TIME
       WHEN d.day = 6             THEN '10:00:00'::TIME
       ELSE                            '10:00:00'::TIME END,
  CASE WHEN d.day BETWEEN 1 AND 5 THEN '19:00:00'::TIME
       WHEN d.day = 6             THEN '16:00:00'::TIME
       ELSE                            '10:00:00'::TIME END,
  CASE WHEN d.day = 0 THEN false ELSE true END
FROM specialists sp
CROSS JOIN (SELECT generate_series(0,6) AS day) d
JOIN tenants t ON t.id = sp.tenant_id
WHERE t.slug = 'glam-studio'
ON CONFLICT DO NOTHING;

-- ════════════════════════════════════════════════════════
-- RLS para appointments y specialist_schedules — Sprint 3
-- ════════════════════════════════════════════════════════

ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE specialist_schedules ENABLE ROW LEVEL SECURITY;

-- specialist_schedules: lectura pública (para calcular disponibilidad)
CREATE POLICY "Horarios son públicamente legibles" ON specialist_schedules
  FOR SELECT USING (is_working = true);

-- appointments: el cliente ve sus propias citas
CREATE POLICY "Clientes ven sus citas" ON appointments
  FOR SELECT USING (auth.uid() = client_id);

-- appointments: clientes pueden insertar (crear cita)
CREATE POLICY "Clientes pueden crear citas" ON appointments
  FOR INSERT WITH CHECK (auth.uid() = client_id);

-- appointments: clientes pueden cancelar sus citas
CREATE POLICY "Clientes pueden cancelar sus citas" ON appointments
  FOR UPDATE USING (auth.uid() = client_id)
  WITH CHECK (status = 'cancelled');

-- appointments: admin/recepcionista ven todas las citas del tenant
CREATE POLICY "Staff ve todas las citas del tenant" ON appointments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.tenant_id = appointments.tenant_id
        AND p.role IN ('admin', 'recepcionista')
    )
  );
