# GlowOS — Estado del Proyecto y Planificación

> Última actualización: 2026-05-04  
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
- **Cookie de sesión dev**: `dev-session` contiene JSON serializado del perfil completo `{ id, role, email, full_name, specialist_id, referral_code, points }`
- **Ediciones en memoria**: cambios admin (servicios, horarios, puntos) viven en `Map`s a nivel de módulo Node.js — se pierden al reiniciar servidor (correcto para dev)
- **Protección de rutas**: cada página protegida lee la cookie server-side y verifica el rol antes de renderizar

**Usuarios de prueba (FM Glow Studio):**

| Usuario | Contraseña | Rol | Email |
|---|---|---|---|
| `admin` | `123456789` | admin | admin@fmglow.test |
| `cliente` | `123456789` | cliente | cliente@fmglow.test |
| `empleada` | `123456789` | trabajadora | empleada@fmglow.test |

---

## Lo que está implementado ✅

### Auth y sesión
- [x] `middleware.ts` — wiring de `proxy.ts` como middleware Next.js (detección de tenant)
- [x] `app/api/dev-auth/route.ts` — login con username/email + password, 3 usuarios con roles y perfiles completos
- [x] `hooks/useAuth.ts` — lee cookie `dev-session` en dev mode (no llama Supabase)
- [x] `components/auth/LoginForm.tsx` — selector de 3 roles con credenciales visibles + login email/password
- [x] `app/[locale]/auth/login/page.tsx` — redirige si ya hay sesión activa
- [x] `components/auth/SignOutButton.tsx` — cierra sesión dev y producción

### Datos mock FM Glow Studio
- [x] `lib/data/services.ts` — 32 servicios reales (facial, corporal, uñas, pestañas, depilación, masajes)
- [x] `lib/data/specialists.ts` — 3 especialistas con horarios lun–sáb, vinculados a usuarios de prueba
- [x] `lib/data/appointments.ts` — 7 citas mock con distintos estados (confirmed, pending, completed, cancelled)
- [x] `lib/data/products.ts` — 8 productos tienda en COP (sérum vitamina C, cremas, aceites, kits)
- [x] `lib/data/calendar.ts` — bloques de calendario por especialista
- [x] `lib/data/users.ts` — usuarios dev con roles y puntos
- [x] `lib/data/inventory.ts` — 7 ventas mock para dashboard de ganancias

### Admin panel (`/[locale]/admin/`)
- [x] **Layout admin** — lectura de rol desde cookie en dev, protección por rol (admin/trabajadora), nav con: Dashboard, Agenda, Servicios, Inventario, Ventas, Clientes, Fidelización, Configuración
- [x] **Dashboard** (`/admin`) — `GananciasOverview` con tabs Hoy/Esta semana/Este mes, desglose servicios + tienda, tabla de transacciones recientes
- [x] **CMS Servicios** (`/admin/servicios`) — tabla filtrable por categoría, modal de edición (nombre, descripción, categoría, duración, precio, activo), crear nuevo servicio; ediciones persisten en memoria del servidor
- [x] **Fidelización** (`/admin/fidelizacion`) — `AdminPointsManager`: lista todos los usuarios con sus puntos, modal para sumar/restar con razón obligatoria
- [x] **Inventario** (`/admin/inventario`) — `AdminInventoryTable`: lista productos (parcialmente implementado)
- [x] **Ventas** (`/admin/ventas`) — `AdminSalesList` (datos mock)
- [x] **Agenda** (`/admin/agenda`) — `AdminAgendaView` (estructura base)
- [x] **Calendario** (`/admin/calendario`) — `TeamCalendarView` (estructura base)

### APIs admin
- [x] `GET/PATCH/POST /api/admin/servicios` — CRUD servicios con ediciones en memoria
- [x] `GET /api/admin/analytics?period=today|week|month` — ingresos mock por período
- [x] `GET/PUT /api/admin/horarios?specialist_id=` — horarios de especialistas
- [x] `GET/POST /api/admin/puntos` — lista usuarios + ajuste de puntos con razón
- [x] `GET/POST /api/admin/productos` — productos tienda (estructura lista)
- [x] `GET/PATCH/DELETE /api/admin/usuarios/role|invite|deactivate` — gestión de usuarios (producción)

### Booking (`/[locale]/agendar/`)
- [x] `BookingWizard` — flujo 4 pasos: Servicio → Fecha → Hora → Confirmar
- [x] `ServiceSelector` — grid de servicios con filtro por categoría
- [x] `CalendarPicker` — calendario mensual, bloquea días sin disponibilidad
- [x] `TimeSlotGrid` — slots horarios por especialista
- [x] `BookingConfirmation` — resumen + campo referral code + campo puntos a usar
- [x] `POST /api/booking` — crea cita en dev (mock) y producción (Supabase)
- [x] `GET /api/availability` — disponibilidad real desde horarios de especialistas

### Perfil cliente (`/[locale]/perfil/`)
- [x] Protegido por sesión, lee dev-session server-side
- [x] `ReferralSection` — código de referido copiable (solo rol `cliente`)
- [x] `EmpleadaStats` — sesiones hoy + semana con reinicio lunes (solo rol `trabajadora`)
- [x] `UpcomingAppointments` — próximas citas del usuario
- [x] `NotificationCenter` — notificaciones del tenant
- [x] `ThemeToggle`, `LocaleSelector`, `SignOutButton`

### Puntos / fidelidad (`/[locale]/puntos/`)
- [x] `PointsWallet` — saldo actual e historial de movimientos
- [x] `RedeemSection` — 4 opciones de canje, genera código único, botón copiar
- [x] `GET /api/empleada/stats` — sesiones hoy y semana en tiempo real

### Tienda (`/[locale]/tienda/`)
- [x] `ProductGrid` — catálogo con búsqueda y filtro por categoría
- [x] `ProductCard` — tarjeta de producto con precio y botón
- [x] `POST /api/shop/checkout` — crea pedido en dev (mock) y producción (Supabase)

### Infra / base
- [x] `proxy.ts` — resolución de tenant por `?tenant=` query param en dev, subdominio en prod
- [x] `lib/tenant.ts` — DEV_TENANTS con FM Glow Studio completo (colores, fuentes, features)
- [x] `lib/supabase/server.ts` y `client.ts` — fallback dev sin credenciales reales
- [x] PWA manifest dinámico por tenant (`/api/manifest/[slug]`)
- [x] Tema dinámico por tenant (`/api/theme/[slug]`)
- [x] Sincronización de calendario iCal (`/api/calendar/[token]`)

---

## Lo que falta implementar ❌

### Sprint 6 — Completar flujos core

#### Booking end-to-end en dev mode
- [ ] **Availability real en dev** — `CalendarPicker` necesita conectar con horarios de especialistas para mostrar días disponibles reales. El API `/api/availability` existe pero `lib/data/calendar.ts` debe exponer `getAvailableSlots(tenantId, date, serviceId)` filtrando por horarios de `lib/data/specialists.ts`
- [ ] **Selección de especialista explícita** — el paso "Hora" muestra slots pero no permite elegir especialista; agregar paso intermedio o selector en el mismo paso de TimeSlotGrid
- [ ] **Confirmación con feedback** — después de POST /api/booking exitoso, redirigir a `/perfil` con toast/mensaje de éxito
- [ ] **`/citas` page** — `app/[locale]/citas/page.tsx` existe pero está sin conectar; mostrar lista de citas del usuario logueado con `CancelButton`

#### Tienda con carrito funcional
- [ ] **`CartContext`** — React context con `add/remove/clear`; `ProductCard` actualmente no tiene lógica de carrito
- [ ] **Vista del carrito** — modal o página `/tienda/carrito` con items, subtotal, campo puntos a usar, botón checkout
- [ ] **Checkout en dev mode conectado** — `POST /api/shop/checkout` ya retorna mock en dev; conectar con la UI del carrito
- [ ] **Confirmación de compra** — página o toast después de checkout exitoso

#### Código de referido en booking
- [ ] **Validar referral code en `/api/booking`** — verificar que el código existe en `DEV_USERS`, registrar el referido, sumar puntos al dueño del código
- [ ] **Feedback en `BookingConfirmation`** — mostrar "Código válido ✓ / Código no encontrado" en tiempo real (debounce fetch)

---

### Sprint 7 — Admin completo

#### CMS Horarios de especialistas
- [ ] **Página `/admin/horarios`** — no existe aún; tabla de especialistas + editor de bloques horarios por día de la semana (hora inicio, hora fin, activo/inactivo). El API `GET/PUT /api/admin/horarios` ya está listo

#### CMS Productos tienda
- [ ] **Tab "Productos" en `/admin/inventario`** — `AdminInventoryTable` muestra solo stock físico; agregar tab con tabla de catálogo conectada a `/api/admin/productos`
- [ ] **Formulario crear/editar producto** — nombre (multilingual), precio, categoría, descripción, imagen URL, activo

#### Dashboard enriquecido
- [ ] **Gráfica de ingresos** — `GananciasOverview` muestra solo números; agregar gráfica de barras con recharts o similar
- [ ] **Ocupación de especialistas** — % de slots utilizados vs disponibles por semana
- [ ] **`/admin/usuarios` conectado a datos dev** — `UserManagement` component existe pero lee de Supabase; agregar path dev con `DEV_USERS`

---

### Sprint 8 — Empleada completa

- [ ] **`/[locale]/calendario` filtrado por empleada** — actualmente muestra calendario global; filtrar por `specialist_id` del `dev-session` cookie
- [ ] **`WorkerActivity` integrado** — creado en `components/profile/WorkerActivity.tsx` pero no está en ninguna página; integrarlo en `/calendario` o `/perfil` de empleada
- [ ] **Vista diaria de citas** — para la empleada: lista de sus citas del día con detalle (cliente, servicio, hora, notas)

---

### Sprint 9 — Producción

- [ ] **Supabase real** — reemplazar `xxxx` en `.env.local` con URL y keys del proyecto Supabase
- [ ] **Migraciones** — ejecutar `supabase/migrations/` contra el proyecto real
- [ ] **Seed FM Glow Studio** — script para insertar tenant, especialistas, servicios y productos en Supabase
- [ ] **RLS policies** — verificar: cliente solo ve sus citas; trabajadora ve las de su `specialist_id`; admin ve todo
- [ ] **OAuth en producción** — configurar Google/Apple en Supabase dashboard
- [ ] **Email templates** — confirmación de cita vía Resend o SendGrid (`/api/send-confirmation` ya existe, falta transporte real)
- [ ] **Push notifications backend** — VAPID keys + suscripciones en Supabase (la UI ya existe en `EnhancedInstallPrompt`)
- [ ] **Protección de rutas en middleware** — `proxy.ts` no verifica sesión Supabase para rutas protegidas en producción

---

### Sprint 10 — Multi-tenant real

- [ ] **Onboarding de nuevos clientes** — formulario público para crear tenant nuevo (datos del salón, plan, pago)
- [ ] **Logo upload** — UI para subir logo (actualmente hardcodeado en `components/ui/logo-registry.tsx`)
- [ ] **Editor de tema** — sliders/color pickers para `--brand-primary`, `--brand-secondary`, etc.
- [ ] **Panel super-admin** — vista de todos los tenants: plan, estado, métricas

---

## Orden de prioridad sugerido

1. **Carrito de tienda** — flujo más corto de completar, alto impacto visual en la demo
2. **Availability real en dev** — conectar `CalendarPicker` con horarios de especialistas
3. **`/citas` page** — mostrar citas del usuario con cancelación
4. **Validar referral code en booking** — el campo ya está, solo falta la lógica
5. **`/admin/horarios` UI** — el API ya existe, solo falta la página
6. **Conectar Supabase real** — cuando los flujos dev estén 100%, migrar a producción

---

## Estructura de archivos clave

```
app/
  [locale]/
    admin/
      page.tsx          → dashboard con GananciasOverview ✅
      servicios/        → CMS servicios ✅
      fidelizacion/     → gestión puntos ✅
      inventario/       → stock (parcial), productos ❌
      horarios/         → ❌ página pendiente crear
      usuarios/         → placeholder ❌
    agendar/            → BookingWizard 4 pasos ✅
    tienda/             → catálogo ✅, carrito ❌
    puntos/             → wallet + canje ✅
    perfil/             → perfil usuario completo ✅
    citas/              → ❌ pendiente conectar
    calendario/         → parcial (no filtra por empleada)
  api/
    dev-auth/           → login dev ✅
    booking/            → crear cita ✅
    availability/       → slots disponibles ✅
    shop/checkout/      → checkout tienda ✅ (dev mock)
    admin/
      analytics/        → ingresos por período ✅
      horarios/         → CRUD horarios ✅
      puntos/           → ajuste puntos ✅
      servicios/        → CRUD servicios ✅
      productos/        → CRUD productos ✅

lib/data/              → capa de datos mock completa ✅
components/
  admin/               → GananciasOverview, AdminPointsManager, ServiceEditor ✅
  booking/             → BookingWizard, CalendarPicker, TimeSlotGrid ✅
  loyalty/             → PointsWallet, RedeemSection, ReferralCodeCard ✅
  profile/             → ReferralSection, EmpleadaStats, WorkerActivity ✅
  shop/                → ProductGrid, ProductCard ✅ — carrito ❌
```

---

## Notas técnicas importantes

### Next.js 16 — diferencias críticas
- `cookies()` y `headers()` son **async** → siempre `await`
- `params` en page components es `Promise<{...}>` → siempre `await params`
- Casting necesario: `(await cookies() as any).get?.("dev-session")?.value`

### Tailwind v4
- No existe `@apply` — todo inline o CSS custom properties
- Variables: `var(--brand-primary)`, `var(--brand-surface)`, `var(--brand-border)`, `var(--brand-text)`

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
const devProfile = raw && raw !== "1" ? JSON.parse(decodeURIComponent(raw)) : null;
```
