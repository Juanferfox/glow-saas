# GlowOS — Estado del Proyecto y Planificación

> Última actualización: 2026-05-06  
> Rama activa: `development`  
> Demo principal: `https://c02e-181-131-164-77.ngrok-free.app/es?tenant=fm-glow-studio`

---

## Arquitectura general

**Stack:**
- Next.js 16.2.3 App Router (breaking changes vs versiones anteriores — leer `node_modules/next/dist/docs/`)
- Tailwind CSS v4 (sin `@apply`, todo CSS custom properties)
- next-intl v4.9.1 (`getTranslations()` server, `useTranslations()` client)
- Supabase (solo producción — dev mode usa datos en memoria)
- TypeScript strict

**Patrones clave:**
- **Multi-tenant**: tenant detectado por `?tenant=slug` en dev, subdominio en producción
- **Dev mode**: `NEXT_PUBLIC_SUPABASE_URL.includes("xxxx")` → todo data es mock hardcodeado en `lib/data/`
- **Cookie de sesión dev**: `dev-session` contiene JSON en base64 del perfil completo `{ id, role, email, full_name, specialist_id, referral_code, points }`
- **Ediciones en memoria**: cambios admin (servicios, horarios, puntos, productos) viven en `Map`s a nivel de módulo Node.js — se pierden al reiniciar servidor (correcto para dev)
- **Protección de rutas**: cada página protegida lee la cookie server-side y verifica el rol antes de renderizar
- **proxy.ts**: es el middleware de Next.js 16 (renombrado desde `middleware.ts`, que fue eliminado). Inyecta `x-tenant-slug` header en cada request.

**Usuarios de prueba (FM Glow Studio):**

| Usuario | Contraseña | Rol | Email |
|---|---|---|---|
| `admin` | `123456789` | admin | admin@fmglow.test |
| `cliente` | `123456789` | cliente | cliente@fmglow.test |
| `empleada` | `123456789` | trabajadora | empleada@fmglow.test |

---

## Lo que está implementado ✅

### Auth y sesión
- [x] `proxy.ts` — detección de tenant por `?tenant=` query param en dev, subdominio en prod (Next.js 16 solo usa `proxy.ts`, `middleware.ts` fue removido)
- [x] `app/api/dev-auth/route.ts` — login con username/email + password, 3 usuarios con roles y perfiles completos
- [x] `hooks/useAuth.ts` — lee cookie `dev-session` en dev mode (no llama Supabase)
- [x] `components/auth/LoginForm.tsx` — selector de 3 roles con credenciales visibles + login email/password
- [x] `app/[locale]/auth/login/page.tsx` — redirige si ya hay sesión activa
- [x] `components/auth/SignOutButton.tsx` — cierra sesión dev y producción

### Datos mock FM Glow Studio
- [x] `lib/data/services.ts` — 32 servicios reales (facial, corporal, uñas, pestañas, depilación, masajes)
- [x] `lib/data/specialists.ts` — 3 especialistas con horarios lun–sáb, vinculados a usuarios de prueba
- [x] `lib/data/appointments.ts` — 7 citas mock con distintos estados (confirmed, pending, completed, cancelled). `getAllMyAppointments(tenantId, userId?)` y `getMyAppointments(tenantId, userId?)` filtran por `client_id` en dev mode.
- [x] `lib/data/products.ts` — 8 productos tienda FM Glow Studio en COP (sérum vitamina C, cremas, aceites, kits). IDs: `pfmg-1` a `pfmg-8`. Exporta `addDevProduct()` para insertar en memoria y `updateDevProduct()` para editar.
- [x] `lib/data/calendar.ts` — bloques de calendario por especialista
- [x] `lib/data/users.ts` — usuarios dev con roles y puntos. Funciones: `findUserByReferralCode(tenantId, code)` y `addLoyaltyPoints(tenantId, userId, points)`.
- [x] `lib/data/inventory.ts` — 7 ventas mock para dashboard de ganancias

### Admin panel (`/[locale]/admin/`)
- [x] **Layout admin** — lectura de rol desde cookie en dev, protección por rol (admin/trabajadora), nav con: Dashboard, Agenda, Servicios, Horarios, Inventario, Ventas, Fidelización, Usuarios, Configuración
- [x] **Dashboard** (`/admin`) — 5 tarjetas de stats (Ingresos, Citas hoy, Clientes nuevos, Stock crítico, Ocupación semanal), `GananciasOverview` con tabs Hoy/Semana/Mes + gráfica de barras SVG, tabla de próximas citas y últimas ventas
- [x] **CMS Servicios** (`/admin/servicios`) — tabla filtrable por categoría, modal de edición (nombre, descripción, categoría, duración, precio, activo), crear nuevo servicio; ediciones persisten en memoria del servidor
- [x] **Horarios** (`/admin/horarios`) — tabla por especialista con toggle día (activo/inactivo) + inputs de hora inicio/fin, botón guardar que persiste vía `PUT /api/admin/horarios`
- [x] **Fidelización** (`/admin/fidelizacion`) — `AdminPointsManager`: lista todos los usuarios con sus puntos, modal para sumar/restar con razón obligatoria
- [x] **Inventario** (`/admin/inventario`) — `AdminInventoryTable`: tabla con columnas descripción, stock, alerta, precio, estado (activo/inactivo), botones editar (✏️) y toggle activar/desactivar (⏻). `InventarioContent` (client component) maneja estado y abre `ProductForm` modal para crear/editar.
- [x] **CMS Productos** — `ProductForm` modal con campos: nombre ES, categoría, descripción, precio, stock inicial, alerta de stock, activo. Crea vía `POST /api/admin/productos`, edita vía `PATCH`.
- [x] **Ventas** (`/admin/ventas`) — `AdminSalesList` (datos mock)
- [x] **Agenda** (`/admin/agenda`) — `AdminAgendaView` (estructura base)
- [x] **Calendario** (`/admin/calendario`) — `TeamCalendarView` (estructura base)

### APIs admin
- [x] `GET/PATCH/POST /api/admin/servicios` — CRUD servicios con ediciones en memoria
- [x] `GET /api/admin/analytics?period=today|week|month` — ingresos mock por período
- [x] `GET/PUT /api/admin/horarios?specialist_id=` — horarios de especialistas
- [x] `GET/POST /api/admin/puntos` — lista usuarios + ajuste de puntos con razón
- [x] `GET/PATCH/POST /api/admin/productos` — CRUD productos con auth guard (lee `dev-session` cookie para verificar rol admin)
- [x] `GET/PATCH/DELETE /api/admin/usuarios/role|invite|deactivate` — gestión de usuarios (producción)
- [x] `GET /api/referral/validate?tenant=&code=` — valida código de referido
- [x] `GET /api/availability/dates?tenant=&service=&month=` — fechas del mes con disponibilidad para un servicio

### Booking (`/[locale]/agendar/`)
- [x] `BookingWizard` — flujo 4 pasos: Servicio → Fecha → Hora → Confirmar
- [x] `ServiceSelector` — grid de servicios con filtro por categoría
- [x] `CalendarPicker` — calendario mensual, bloquea días pasados, indicador verde (●) en días con slots disponibles, navegación mensual recarga disponibilidad
- [x] `TimeSlotGrid` — slots horarios por especialista con filtro por nombre
- [x] `BookingConfirmation` — resumen + campo referral code con validación en tiempo real (debounce fetch a `/api/referral/validate`) + campo notas
- [x] `POST /api/booking` — crea cita en dev (mock) y producción (Supabase), valida referral code y suma puntos al dueño del código
- [x] `GET /api/availability` — disponibilidad real desde horarios de especialistas
- [x] `GET /api/availability/dates` — fechas del mes con al menos un slot disponible

### Perfil cliente (`/[locale]/perfil/`)
- [x] Protegido por sesión, lee dev-session server-side (incluye `id` del perfil)
- [x] `ReferralSection` — código de referido copiable (solo rol `cliente`)
- [x] `EmpleadaStats` / `WorkerActivity` — sesiones hoy + semana con reinicio lunes (solo rol `trabajadora`)
- [x] `UpcomingAppointments` — próximas citas filtradas por `client_id` del dev-session cookie
- [x] `NotificationCenter` — notificaciones del tenant

### Puntos / fidelidad (`/[locale]/puntos/`)
- [x] `PointsWallet` — saldo actual e historial de movimientos
- [x] `RedeemSection` — 4 opciones de canje, genera código único, botón copiar
- [x] `GET /api/empleada/stats` — sesiones hoy y semana en tiempo real

### Tienda (`/[locale]/tienda/`)
- [x] `ProductGrid` — catálogo con búsqueda y filtro por categoría
- [x] `ProductCard` — tarjeta de producto con precio y botón "agregar al carrito"
- [x] `CartContext` — React context con `addItem/removeItem/updateQuantity/clearCart/setPointsToUse`
- [x] `CartProvider` — envuelve la sección tienda desde `app/[locale]/tienda/layout.tsx`
- [x] `CartButton` — botón en el header de tienda con badge de contador, link a `/tienda/carrito`
- [x] `CartPage` — página `/tienda/carrito` con lista de items, controles ±/🗑, total, campo puntos de fidelidad, checkout y confirmación de compra
- [x] `POST /api/shop/checkout` — crea pedido en dev (mock) y producción (Supabase)

### Empleada (`/[locale]/calendario/`)
- [x] Página lee `dev-session` cookie para extraer `role` y `specialist_id`
- [x] `WorkerActivity` integrado — stats sesiones hoy/semana
- [x] Vista diaria de citas — sección "Mis citas de hoy" con hora, servicio y notas

### Infra / base
- [x] `proxy.ts` — resolución de tenant (reemplaza `middleware.ts` que fue eliminado)
- [x] `lib/tenant.ts` — DEV_TENANTS con FM Glow Studio completo (colores, fuentes, features)
- [x] `lib/supabase/server.ts` y `client.ts` — fallback dev sin credenciales reales
- [x] PWA manifest dinámico por tenant (`/api/manifest/[slug]`)
- [x] Tema dinámico por tenant (`/api/theme/[slug]`)
- [x] Sincronización de calendario iCal (`/api/calendar/[token]`)

---

## Sprints completados

- ✅ **Sprint 6** — Booking end-to-end, availability real, carrito tienda, referral code
- ✅ **Sprint 7** — Admin completo: CMS servicios, horarios, productos, dashboard con gráfica y ocupación
- ✅ **Sprint 8** — Empleada: calendario filtrado por especialista, WorkerActivity, citas del día

---

## Sprint 9 — Conectar Supabase real ❌

> **Objetivo**: Reemplazar todos los datos mock por datos reales de Supabase. El código ya tiene bifurcaciones `isDevMode ? mock : supabase` en todos los módulos, así que el cambio es principalmente configuración + seed.

### 9.1 Variables de entorno

**Archivo**: `.env.local`

Reemplazar los valores placeholder por los reales del proyecto Supabase:

```
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Una vez cambiadas, el sistema sale de dev mode automáticamente porque `NEXT_PUBLIC_SUPABASE_URL.includes("xxxx")` deja de ser `true`.

### 9.2 Migraciones de base de datos

Las migraciones están en `supabase/migrations/`. Ejecutar contra el proyecto real:

```bash
npx supabase link --project-ref <project-ref>
npx supabase db push
```

Si no hay CLI de Supabase, ejecutar el SQL directamente en el Dashboard → SQL Editor.

### 9.3 Seed FM Glow Studio

Crear un script `scripts/seed-fm-glow.ts` que inserte los datos de prueba en Supabase. Ejecutar con `npx tsx scripts/seed-fm-glow.ts`.

**Orden de inserción** (respetar foreign keys):

1. **Tenant** — tabla `tenants`:
   ```sql
   INSERT INTO tenants (id, slug, name, default_locale, currency, brand_color, ...)
   VALUES ('fm-glow-studio-uuid', 'fm-glow-studio', 'FM Glow Studio', 'es', 'COP', '#e8a4b8', ...)
   ```

2. **Usuarios** — usar Supabase Auth Admin API (no INSERT directo en `auth.users`):
   ```typescript
   const { data } = await supabase.auth.admin.createUser({
     email: 'admin@fmglow.com',
     password: '123456789',
     user_metadata: { full_name: 'Admin FM Glow' }
   })
   // Luego INSERT en profiles:
   await supabase.from('profiles').insert({
     id: data.user.id,
     tenant_id: 'fm-glow-studio-uuid',
     full_name: 'Admin FM Glow',
     role: 'admin',
     points: 0,
   })
   ```
   Repetir para cliente y empleada.

3. **Especialistas** — tabla `specialists` (con `user_id` del usuario empleada creado arriba):
   ```sql
   INSERT INTO specialists (id, tenant_id, user_id, full_name, bio, avatar_url)
   VALUES (...)
   ```

4. **Horarios de especialistas** — tabla `specialist_schedules`:
   - Lunes a sábado, 09:00–18:00, para cada especialista
   ```sql
   INSERT INTO specialist_schedules (specialist_id, day_of_week, start_time, end_time, is_working)
   VALUES (...) -- day_of_week: 1=lunes ... 6=sábado
   ```

5. **Servicios** — tabla `services` (tomar datos de `lib/data/services.ts`, los 32 servicios):
   ```typescript
   for (const svc of DEV_SERVICES['dev-fm-glow-studio']) {
     await supabase.from('services').insert({
       tenant_id: 'fm-glow-studio-uuid',
       name: svc.name,
       description: svc.description,
       duration_minutes: svc.duration_minutes,
       price: svc.price,
       category: svc.category,
       active: true,
     })
   }
   ```

6. **Productos** — tabla `products` (tomar datos de `lib/data/products.ts`, los 8 productos `pfmg-*`):
   - Misma lógica que servicios, iterar sobre `DEV_PRODUCTS['dev-fm-glow-studio']`

### 9.4 Políticas RLS

Verificar que existan las siguientes políticas en el Dashboard → Authentication → Policies (o en las migraciones SQL):

**Tabla `appointments`**:
```sql
-- Cliente ve solo sus citas
CREATE POLICY "cliente_own_appointments" ON appointments
  FOR SELECT USING (auth.uid() = client_id);

-- Trabajadora ve citas de su specialist_id
CREATE POLICY "worker_appointments" ON appointments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM specialists s
      JOIN profiles p ON p.id = auth.uid()
      WHERE s.id = appointments.specialist_id
      AND s.user_id = auth.uid()
    )
  );

-- Admin ve todo dentro de su tenant
CREATE POLICY "admin_all_appointments" ON appointments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND tenant_id = appointments.tenant_id
      AND role = 'admin'
    )
  );
```

**Tabla `profiles`**:
```sql
-- Usuario lee/edita su propio perfil
CREATE POLICY "own_profile" ON profiles
  FOR ALL USING (auth.uid() = id);

-- Admin lee todos los perfiles de su tenant
CREATE POLICY "admin_read_profiles" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles admin_p
      WHERE admin_p.id = auth.uid()
      AND admin_p.tenant_id = profiles.tenant_id
      AND admin_p.role = 'admin'
    )
  );
```

**Tabla `services`** y **`products`**:
```sql
-- Todos pueden leer activos
CREATE POLICY "read_active" ON services FOR SELECT USING (active = true);
-- Admin puede escribir
CREATE POLICY "admin_write" ON services FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
```

### 9.5 Auth en producción

En el Dashboard de Supabase → Authentication → Providers:

1. **Email/Password** — asegurarse que está habilitado
2. **Google OAuth**:
   - Crear credenciales en Google Cloud Console → APIs & Services → Credentials
   - Tipo: "Web application", Redirect URI: `https://<proyecto>.supabase.co/auth/v1/callback`
   - Copiar Client ID y Client Secret al dashboard de Supabase
3. **Site URL** en Supabase → Authentication → URL Configuration:
   - `https://tu-dominio.com` (en producción)
   - `http://localhost:3000` (para dev)
4. **Redirect URLs** permitidas: `https://tu-dominio.com/auth/callback`

El callback ya existe en `app/[locale]/auth/callback/route.ts`.

### 9.6 Email de confirmación de cita

**Archivo**: `app/api/send-confirmation/route.ts` (ya existe la estructura, falta el transporte).

Instalar Resend: `npm install resend`

```typescript
// app/api/send-confirmation/route.ts
import { Resend } from 'resend';
const resend = new Resend(process.env.RESEND_API_KEY);

// En el handler POST:
await resend.emails.send({
  from: 'FM Glow Studio <no-reply@fmglow.com>',
  to: clientEmail,
  subject: 'Confirmación de tu cita',
  html: `<h1>Tu cita está confirmada</h1>
         <p>Servicio: ${serviceName}</p>
         <p>Fecha: ${date} a las ${time}</p>
         <p>Especialista: ${specialistName}</p>`,
});
```

Variable de entorno a agregar: `RESEND_API_KEY=re_...`

Llamar este endpoint desde `POST /api/booking` justo después de crear la cita exitosamente.

### 9.7 Protección de rutas en producción

**Problema**: `proxy.ts` inyecta el tenant slug pero no verifica sesión Supabase. Las rutas protegidas dependen de que cada `page.tsx` verifique la sesión individualmente, lo cual es correcto pero incompleto.

**Archivo a editar**: `proxy.ts`

Agregar verificación de sesión para rutas protegidas:

```typescript
// En proxy.ts, después de resolver el tenant, antes del NextResponse.next():
const protectedPaths = ['/perfil', '/citas', '/puntos', '/agendar', '/tienda/carrito', '/admin'];
const isProtected = protectedPaths.some(p => pathname.includes(p));

if (isProtected && !isDevMode) {
  const supabase = createServerClient(/* ... */);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(new URL(`/${locale}/auth/login`, request.url));
  }
}
```

**Nota**: `updateSession` de Supabase también necesita llamarse en el middleware para refrescar tokens. Ver el patrón en `lib/supabase/server.ts`.

### 9.8 Push notifications (opcional, baja prioridad)

La UI ya existe en `components/install/EnhancedInstallPrompt.tsx`.

1. Generar VAPID keys:
   ```bash
   npx web-push generate-vapid-keys
   ```
2. Agregar a `.env.local`:
   ```
   VAPID_PUBLIC_KEY=BM...
   VAPID_PRIVATE_KEY=...
   NEXT_PUBLIC_VAPID_PUBLIC_KEY=BM...
   ```
3. Crear tabla en Supabase:
   ```sql
   CREATE TABLE push_subscriptions (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
     subscription JSONB NOT NULL,
     created_at TIMESTAMPTZ DEFAULT now()
   );
   ```
4. Crear `POST /api/push/subscribe` — guarda la suscripción en Supabase
5. Crear `POST /api/push/send` — envía notificación usando `web-push` npm package

---

## Sprint 10 — Multi-tenant real ❌

> **Objetivo**: Que cualquier nuevo salón pueda registrarse sin intervención manual.

### 10.1 Onboarding público

**Nueva página**: `app/[locale]/onboarding/page.tsx`

Formulario con campos:
- Nombre del salón
- Slug deseado (validar que no exista, solo alfanumérico y guiones)
- Email del propietario
- Plan (básico / pro / premium)

**Nueva API**: `POST /api/onboarding`
1. Verificar que el slug no exista en tabla `tenants`
2. Crear registro en `tenants`
3. Crear usuario admin con Supabase Auth Admin API
4. Insertar perfil con `role: 'admin'`
5. Enviar email de bienvenida con credenciales temporales
6. Redirigir a `/es/admin?tenant=<slug>` o al subdominio

### 10.2 Logo upload

**Página**: `/admin/configuracion` (ya existe la ruta, agregar la sección de logo)

**Componente**: `components/admin/LogoUpload.tsx`
- `<input type="file" accept="image/*">` que sube a Supabase Storage bucket `logos`
- Bucket policy: solo el admin del tenant puede escribir, todos pueden leer
- Preview del logo actual

**API**: `POST /api/admin/logo` (multipart/form-data)
```typescript
const file = formData.get('file') as File;
const { data } = await supabase.storage
  .from('logos')
  .upload(`${tenantId}/${Date.now()}.png`, file);
const publicUrl = supabase.storage.from('logos').getPublicUrl(data.path).data.publicUrl;
await supabase.from('tenants').update({ logo_url: publicUrl }).eq('id', tenantId);
```

**Modificar** `components/ui/logo-registry.tsx`: si el tenant tiene `logo_url`, renderizar `<img>` en lugar del componente SVG hardcodeado.

### 10.3 Editor de tema visual

**Página**: `/admin/configuracion` — agregar sección "Personalización"

**Componente**: `components/admin/ThemeEditor.tsx`
- Color pickers (HTML `<input type="color">`) para:
  - `brand_color` → CSS var `--brand-primary`
  - Color secundario → `--brand-secondary`
  - Color de fondo → `--brand-bg`
- Preview en tiempo real: `document.documentElement.style.setProperty('--brand-primary', color)`

**API**: `PATCH /api/admin/configuracion`
```typescript
await supabase.from('tenants')
  .update({ brand_color: body.brand_color })
  .eq('id', tenantId);
```

### 10.4 Panel super-admin

**Nueva ruta**: `app/[locale]/super-admin/page.tsx`

- Protegida por rol `super_admin` (nuevo rol a agregar en `profiles.role` enum)
- Tabla con todos los tenants: nombre, slug, plan, estado (activo/inactivo), métricas básicas
- Acciones: activar/desactivar tenant (`PATCH /api/super-admin/tenants/[id]`)
- Stats globales: total tenants activos, citas del mes, ingresos del mes

---

## Orden de prioridad sugerido

1. ~~**Carrito de tienda**~~ ✅
2. ~~**Availability real en dev**~~ ✅
3. ~~**`/citas` page**~~ ✅
4. ~~**Validar referral code en booking**~~ ✅
5. ~~**`/admin/horarios` UI**~~ ✅
6. ~~**CMS Productos tienda**~~ ✅ — formulario crear/editar + tabla con acciones
7. ~~**Dashboard enriquecido**~~ ✅ — gráfica de barras + ocupación semanal
8. ~~**Sprint 8 empleada**~~ ✅ — calendario filtrado + WorkerActivity + vista diaria
9. **Sprint 9.1–9.3** — Variables de entorno + migraciones + seed (pre-requisito para todo lo demás)
10. **Sprint 9.4–9.7** — RLS + Auth + Email + Protección de rutas
11. **Sprint 10** — Multi-tenant real

---

## Estructura de archivos clave

```
app/
  [locale]/
    admin/
      page.tsx          → dashboard con GananciasOverview + bar chart + ocupación ✅
      servicios/        → CMS servicios ✅
      horarios/         → editor de horarios por especialista ✅
      fidelizacion/     → gestión puntos ✅
      inventario/       → stock + catálogo con editar/toggle + ProductForm modal ✅
      usuarios/         → UserManagement conectado a dev ✅
    agendar/            → BookingWizard 4 pasos ✅
    tienda/             → catálogo ✅, carrito ✅
      carrito/          → CartPage con checkout ✅
    puntos/             → wallet + canje ✅
    perfil/             → perfil con WorkerActivity ✅
    citas/              → lista de citas con CancelButton ✅
    calendario/         → calendario + WorkerActivity + vista diaria para empleada ✅
  api/
    dev-auth/           → login dev ✅
    booking/            → crear cita ✅ (valida referral + suma puntos)
    availability/       → slots disponibles ✅
      dates/            → fechas con disponibilidad por servicio ✅
    referral/
      validate/         → validar código de referido ✅
    shop/checkout/      → checkout tienda ✅ (dev mock)
    admin/
      analytics/        → ingresos por período ✅
      horarios/         → CRUD horarios ✅
      puntos/           → ajuste puntos ✅
      servicios/        → CRUD servicios ✅
      productos/        → CRUD productos con auth guard ✅
    send-confirmation/  → email post-booking (estructura ✅, transporte real ❌)

lib/data/              → capa de datos mock completa ✅
components/
  admin/               → GananciasOverview (bar chart), AdminInventoryTable (editable), ProductForm ✅
  booking/             → BookingWizard, CalendarPicker (dots), TimeSlotGrid ✅
  loyalty/             → PointsWallet, RedeemSection, ReferralCodeCard ✅
  profile/             → ReferralSection, EmpleadaStats, WorkerActivity ✅
  shop/                → ProductGrid, ProductCard, CartPage, CartButton ✅
contexts/
  CartContext.tsx      → CartProvider + useCart hook ✅
proxy.ts               → middleware Next.js 16, inyecta x-tenant-slug ✅
```

---

## Notas técnicas importantes

### Next.js 16 — diferencias críticas
- `cookies()` y `headers()` son **async** → siempre `await`
- `params` en page components es `Promise<{...}>` → siempre `await params`
- Casting necesario: `(await cookies() as any).get?.("dev-session")?.value`
- El archivo de middleware se llama `proxy.ts` en este proyecto (no `middleware.ts`)

### Tailwind v4
- No existe `@apply` — todo inline o CSS custom properties
- Variables: `var(--brand-primary)`, `var(--brand-surface)`, `var(--brand-border)`, `var(--brand-text)`, `var(--brand-bg)`

### TypeScript + Supabase
- Queries dinámicas → `(supabase as any).from(...)` (patrón pre-existente en el codebase)

### Dev mode — patrón estándar
```typescript
const isDevMode = !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL.includes("xxxx");

if (isDevMode) {
  return NextResponse.json({ /* mock data */ });
}

// Producción:
const { createServiceClient } = await import("@/lib/supabase/server");
```

### Leer sesión dev en server components
```typescript
import { cookies } from "next/headers";

const raw = (await cookies() as any).get?.("dev-session")?.value as string | undefined;
// La cookie está en base64 (no URL-encoded):
const devProfile = raw && raw !== "1"
  ? JSON.parse(Buffer.from(raw, "base64").toString("utf-8"))
  : null;
```

### CartContext — patrón de uso
```typescript
// Envolver la sección que necesita acceso al carrito:
// app/[locale]/tienda/layout.tsx
export default function TiendaLayout({ children }) {
  return <CartProvider>{children}</CartProvider>;
}

// En cualquier componente hijo:
import { useCart } from "@/contexts/CartContext";
const { items, addItem, removeItem, itemCount, subtotal } = useCart();
```

### Validación de referral code — flujo completo
1. `BookingConfirmation` hace fetch debounced (400ms) a `GET /api/referral/validate?tenant=&code=`
2. La API llama `findUserByReferralCode(tenantId, code)` → busca en `DEV_USERS` por `referral_code` (solo rol `cliente`)
3. Al confirmar, `POST /api/booking` recibe `referralCode`, re-valida y llama `addLoyaltyPoints()` para sumar `referral_bonus_pts` al dueño del código

### Auth guard en API routes (patrón)
```typescript
// Leer rol desde cookie dev-session en rutas admin:
function getDevProfile(cookieHeader: string | null): { role: string } | null {
  if (!cookieHeader) return null;
  try {
    const match = cookieHeader.match(/dev-session=([^;]+)/);
    if (!match?.[1]) return null;
    return JSON.parse(Buffer.from(match[1], "base64").toString("utf-8"));
  } catch { return null; }
}
```
