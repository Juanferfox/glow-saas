# GlowOS — SaaS para Spas y Centros de Bienestar

Plataforma multi-tenant white-label para SPAs y salones de belleza. Un solo codebase, múltiples clientes, cada uno con su propia identidad visual, idioma, módulos y precios según su plan.

---

## Índice

1. [Clientes activos](#1-clientes-activos)
2. [Stack tecnológico](#2-stack-tecnológico)
3. [Arquitectura general](#3-arquitectura-general)
4. [Modelo de datos](#4-modelo-de-datos)
5. [Sistema de theming white-label](#5-sistema-de-theming-white-label)
6. [Roles y permisos](#6-roles-y-permisos)
7. [Calendario y sincronización](#7-calendario-y-sincronización)
8. [PWA y mobile-first](#8-pwa-y-mobile-first)
9. [Internacionalización (i18n)](#9-internacionalización-i18n)
10. [Dark mode](#10-dark-mode)
11. [Módulos del sistema](#11-módulos-del-sistema)
12. [Estructura de archivos](#12-estructura-de-archivos)
13. [Roadmap de desarrollo (sprints)](#13-roadmap-de-desarrollo-sprints)
14. [Onboarding de un nuevo tenant](#14-onboarding-de-un-nuevo-tenant)
15. [Planes y precios](#15-planes-y-precios)
16. [Variables de entorno](#16-variables-de-entorno)
17. [Comandos útiles](#17-comandos-útiles)
18. [Notas técnicas](#18-notas-técnicas)

---

## 1. Clientes activos

| Tenant | Nombre | País | Moneda | Plan | Estado |
|---|---|---|---|---|---|
| `channel-spa` | Channel Spa | 🇨🇴 Colombia | COP | Premium | **Activo** — servicios en carga |
| `gio-spa` | Gio Spa | 🇺🇸 USA | USD | Starter | **Activo** — servicios en carga |
| `glow-studio` | Glow Studio by Fabiana Madrigal | 🇨🇴 Colombia | COP | Premium Plus | POC completo · solar activo |
| `spa-luna` | Spa Luna | 🇨🇴 Colombia | COP | Premium | Dev — tenant de prueba |
| `glam-studio` | Glam Studio | 🇺🇸 USA | USD | Premium | Dev — tenant de prueba |

> **Logos pendientes**: se instalarán cuando cada cliente los envíe. Basta con actualizar `logo_url` en la tabla `tenants`.  
> **Servicios de Channel Spa y Gio Spa**: son placeholder hasta recibir la lista oficial.

### URLs de prueba en dev

```
http://localhost:3000?tenant=channel-spa   → Channel Spa (CO)
http://localhost:3000?tenant=gio-spa       → Gio Spa (USA)
http://localhost:3000?tenant=glow-studio   → Glow Studio POC completo (CO, ES+EN)
http://localhost:3000?tenant=spa-luna      → Spa Luna (CO)
http://localhost:3000?tenant=glam-studio   → Glam Studio (USA, EN+ES)
```

---

## 2. Stack tecnológico

| Capa | Tecnología | Versión | Razón |
|---|---|---|---|
| Frontend | Next.js | **16.2.3** | SSR, App Router, API routes, i18n nativo |
| Base de datos | Supabase | JS v2 + SSR | Auth OAuth, PostgreSQL + RLS, Storage, Edge Functions |
| Estilos | Tailwind CSS | **4** | Utility-first, mobile-first, sin configuración extra |
| Componentes | shadcn/ui | **4.2.0** | Accesibles, customizables, compatible con Tailwind 4 |
| i18n | next-intl | **4.9.1** | App Router nativo, Server Components, pluralización |
| PWA | @ducanh2912/next-pwa | **10.x** | Service worker automático, manifest dinámico por tenant |
| Fuentes | next/font (Google Fonts) | — | Playfair, DM Sans, Cormorant, Lato — por tenant |
| Email | Resend | SDK v6.12.0 | 3.000 emails/mes gratis, SDK simple, HTML templates |
| Deploy | Vercel | — | Wildcard subdomains, Edge Network, CI/CD gratis |

### Decisión: ¿por qué NO?

- **App nativa (React Native)**: la PWA cubre el 95% de los casos móviles sin mantener dos codebases.
- **Pagos en línea**: los pagos son presenciales. El sistema solo registra transacciones.
- **WhatsApp Bot (Twilio)**: disponible como add-on futuro. El webhook está listo en la arquitectura.

---

## 3. Arquitectura general

```
┌──────────────────────────────────────────────────────────┐
│                   CLIENTES (navegador)                    │
│  channel-spa.glowos.co  ·  gio-spa.glowos.co             │
│  (o dominio propio)         (o dominio propio)           │
└──────────────────┬───────────────────────────────────────┘
                   │ HTTPS
┌──────────────────▼───────────────────────────────────────┐
│              VERCEL (Edge Network)                        │
│  Next.js 16.2.3 — App Router                             │
│  proxy.ts: detecta subdominio → carga tenant config      │
│  next-intl: detecta locale → carga messages/[locale].json│
│  next-pwa: service worker + manifest dinámico por tenant  │
└──────────────────┬───────────────────────────────────────┘
                   │
┌──────────────────▼───────────────────────────────────────┐
│                  SUPABASE                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────────┐   │
│  │   Auth   │  │PostgreSQL│  │    Edge Functions    │   │
│  │  OAuth   │  │  + RLS   │  │  appointment-reminders│   │
│  └──────────┘  └──────────┘  └──────────────────────┘   │
│  ┌──────────┐                                            │
│  │ Storage  │  logos, imágenes de productos              │
│  └──────────┘                                            │
└──────────────────┬───────────────────────────────────────┘
                   │
┌──────────────────▼───────────────────────────────────────┐
│             SERVICIOS EXTERNOS                            │
│  Resend (email)  ·  Web Push API  ·  (WhatsApp futuro)   │
└──────────────────────────────────────────────────────────┘
```

### Flujo de una request

1. Usuario entra a `channel-spa.glowos.co/es/calendario`
2. `proxy.ts` extrae el subdominio `channel-spa`
3. Se consulta `tenants` en Supabase → config completa del tenant
4. `TenantProvider` inyecta los CSS custom properties (`--brand-primary`, `--brand-radius`, etc.)
5. `next-intl` detecta el locale `es` y carga `messages/es.json`
6. El componente verifica rol del usuario → muestra vista correcta del calendario
7. El `<html>` lleva `data-theme="dark|light"` según preferencia guardada

---

## 4. Modelo de datos

### Tabla `tenants`

```sql
CREATE TABLE tenants (
  id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug  TEXT UNIQUE NOT NULL,   -- 'channel-spa', 'gio-spa'
  name  TEXT NOT NULL,

  -- Localización
  default_locale  TEXT DEFAULT 'es',
  active_locales  TEXT[] DEFAULT '{es}',
  currency        TEXT DEFAULT 'COP',
  timezone        TEXT DEFAULT 'America/Bogota',

  -- Branding (logo pendiente hasta que cliente lo envíe)
  logo_url              TEXT,
  brand_color_primary   TEXT DEFAULT '#7F77DD',
  brand_color_bg        TEXT DEFAULT '#ffffff',
  brand_color_text      TEXT DEFAULT '#1a1a1a',
  brand_color_surface   TEXT DEFAULT '#f5f5f5',
  brand_color_border    TEXT DEFAULT '#e0e0e0',
  brand_color_dark_bg      TEXT DEFAULT '#0f0f0f',
  brand_color_dark_surface TEXT DEFAULT '#1c1c1c',
  brand_color_dark_text    TEXT DEFAULT '#f0f0f0',
  brand_color_dark_border  TEXT DEFAULT '#2e2e2e',
  brand_font_heading    TEXT DEFAULT 'Georgia, serif',
  brand_font_body       TEXT DEFAULT 'system-ui, sans-serif',
  brand_radius          TEXT DEFAULT '8px',

  -- Textos del home (editables por la dueña del spa)
  hero_headline   JSONB DEFAULT '{"es":"Bienvenida"}',
  hero_subtext    JSONB DEFAULT '{"es":"Tu spa de confianza"}',
  hero_cta        JSONB DEFAULT '{"es":"Agendar cita"}',

  -- Feature flags
  feature_store         BOOLEAN DEFAULT true,
  feature_inventory     BOOLEAN DEFAULT true,
  feature_loyalty       BOOLEAN DEFAULT true,
  feature_referrals     BOOLEAN DEFAULT true,
  feature_reviews       BOOLEAN DEFAULT true,
  feature_solar         BOOLEAN DEFAULT false,  -- add-on independiente del plan
  feature_sales_history BOOLEAN DEFAULT true,
  feature_whatsapp_bot  BOOLEAN DEFAULT false,  -- add-on futuro

  -- Fidelización
  points_per_service   INT DEFAULT 100,
  points_per_purchase  INT DEFAULT 1,
  referral_bonus_pts   INT DEFAULT 200,
  cancellation_penalty INT DEFAULT 50,

  -- Plan: free | starter | pro | white_label
  -- "premium" mantenido por compatibilidad legacy
  plan   TEXT DEFAULT 'starter'
         CHECK (plan IN ('free','starter','pro','white_label','premium')),
  active     BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Tabla `profiles`

```sql
CREATE TABLE profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id),
  tenant_id   UUID NOT NULL REFERENCES tenants(id),
  full_name   TEXT,
  avatar_url  TEXT,

  -- Roles del sistema:
  -- admin        → Dueña / propietaria: control total
  -- trabajadora  → Especialista: solo lectura de su propia agenda
  -- recepcionista→ Puede gestionar citas, no configuración
  -- cliente      → Agenda, puntos, perfil
  role        TEXT DEFAULT 'cliente'
              CHECK (role IN ('admin','trabajadora','recepcionista','cliente')),

  referral_code  TEXT UNIQUE,
  referred_by    UUID REFERENCES profiles(id),
  loyalty_points INT DEFAULT 0,

  preferred_theme  TEXT DEFAULT 'system',
  preferred_locale TEXT DEFAULT 'es',

  notifications_promo BOOLEAN DEFAULT true,
  notifications_tips  BOOLEAN DEFAULT true,
  push_subscription   JSONB,

  -- Token único para feed iCal privado (/api/calendar/[token])
  calendar_sync_token TEXT UNIQUE,

  created_at  TIMESTAMPTZ DEFAULT now()
);
```

### Otras tablas

| Tabla | Descripción |
|---|---|
| `services` | Servicios del spa (nombre/descripción JSONB multi-locale) |
| `specialists` | Especialistas del tenant, vinculadas a un `profile` |
| `specialist_schedules` | Horarios semanales por especialista |
| `appointments` | Citas agendadas con estado y puntos |
| `treatment_plans` | Plan de N sesiones para un cliente (ej: "Lifting 6 sesiones") |
| `treatment_sessions` | Sesiones individuales de un plan (scheduled/completed/skipped) |
| `products` | Catálogo de tienda con stock |
| `orders` / `order_items` | Pedidos apartados para pago presencial |
| `inventory_movements` | Entradas, salidas y ajustes de stock |
| `loyalty_transactions` | Historial de puntos ganados/canjeados |
| `reviews` | Reseñas con moderación por admin |
| `notifications` | Notificaciones del sistema por usuario |
| `solar_spaces` | Espacios físicos de bronceo (solo si `feature_solar`) |
| `solar_bookings` | Reservas de bronceo UV |

> Todas las tablas tienen `tenant_id` y Row Level Security activado.  
> Ver esquema completo en [`docs/database-schema.sql`](./docs/database-schema.sql).

---

## 5. Sistema de theming white-label

Cada tenant se diferencia visualmente mediante **CSS custom properties** inyectadas en runtime desde su configuración.

### Tokens de diseño

```css
/* Generados en runtime desde tenants.brand_color_* */
:root {
  --brand-primary: #c87e9a;    /* botones, CTAs, highlights */
  --brand-bg:      #140f11;    /* fondo de página */
  --brand-surface: #231519;    /* tarjetas, paneles */
  --brand-text:    #f9ece8;    /* texto principal */
  --brand-border:  #3a2228;    /* bordes */
  --brand-radius:  10px;       /* radio global de bordes */
  --font-heading:  Georgia, serif;
  --font-body:     system-ui, sans-serif;
}
```

### Identidades visuales de los tenants activos

| Tenant | Primario | Estilo | Tipografía |
|---|---|---|---|
| Channel Spa | `#c87e9a` rosa ciruela | Oscuro cálido, femenino | Georgia serif |
| Gio Spa | `#6b9e6f` sage green | Verde bosque, sereno | Cormorant + DM Sans |
| Spa Luna | `#c9956a` arena dorada | Oscuro elegante | Georgia serif |
| Glam Studio | `#d4af6a` dorado | Negro minimalista | Playfair + DM Sans |

### Lo que es configurable por tenant

| Token | Impacto |
|---|---|
| `brand_color_primary` | Botones, iconos, highlights, focus rings |
| `brand_font_heading` | H1–H3, nombres de servicios |
| `brand_radius` | `2px` sharp (lujo) → `20px` suave (amigable) |
| `logo_url` | Navbar y splash de la PWA |
| `hero_headline` | Texto principal del home, por locale |
| `feature_*` | Qué módulos son visibles para ese tenant |

---

## 6. Roles y permisos

### Roles disponibles

| Rol | Quién es | Acceso |
|---|---|---|
| `admin` | Dueña / propietaria | Todo: calendario del equipo, gestión de usuarios, configuración, ventas |
| `trabajadora` | Especialista del spa | Solo su propia agenda (read-only), su perfil |
| `recepcionista` | Recepcionista | Agenda, citas, inventario (sin configuración ni usuarios) |
| `cliente` | Clienta final | Booking, su calendario personal, puntos, tienda, perfil |

### Matriz de acceso por sección

| Sección | admin | recepcionista | trabajadora | cliente |
|---|---|---|---|---|
| Home público | ✓ | ✓ | ✓ | ✓ |
| Agendar cita | ✓ | ✓ | ✓ | ✓ |
| Mi calendario | → admin/calendario | ✓ | ✓ solo lectura | ✓ |
| Calendario del equipo | ✓ editable | ✓ editable | ✗ | ✗ |
| Mis citas | ✓ | ✓ | ✓ | ✓ |
| Puntos / fidelización | ✓ | ✓ | ✗ | ✓ |
| Tienda | ✓ | ✓ | ✗ | ✓ |
| Admin → Agenda | ✓ | ✓ | ✗ | ✗ |
| Admin → Calendario | ✓ | ✓ | ✓ solo lectura | ✗ |
| Admin → Usuarios | ✓ | ✗ | ✗ | ✗ |
| Admin → Inventario | ✓ | ✓ | ✗ | ✗ |
| Admin → Configuración | ✓ | ✗ | ✗ | ✗ |

### Gestión de usuarios (admin)

La dueña puede desde `/admin/usuarios`:
- Invitar usuarias por email (Supabase Auth enviará el link de acceso)
- Cambiar el rol con un menú de 3 opciones
- Desactivar una trabajadora (downgrade a cliente, desvincular de specialists)
- Ver puntos, email, especialista vinculada

---

## 7. Calendario y sincronización

### Vistas según rol

**Cliente** — `/[locale]/calendario`
- Vista semanal con sus citas (confirmadas + pendientes)
- Planes de tratamiento activos con barra de progreso
- Botón para sincronizar con Google/Apple Calendar

**Trabajadora** — `/[locale]/calendario`
- Vista semanal de solo lectura de su propia agenda
- Badge "Solo lectura" visible — no puede hacer click en eventos
- Sin detalles de otras especialistas

**Admin / Recepcionista** — `/[locale]/admin/calendario`
- Vista de equipo con todas las especialistas en colores distintos
- Filtro por especialista (chips con nombre y color)
- Leyenda de colores al pie
- Click en evento abre panel de detalle

### Sincronización Google Calendar / Apple Calendar

Cada usuario tiene un **feed iCal privado** en:
```
GET /api/calendar/[token]
```

El token se genera automáticamente y se almacena en `profiles.calendar_sync_token`.

**Cómo suscribirse:**
- **Google Calendar**: Otros calendarios → Desde URL → pegar la URL completa
- **Apple Calendar**: Archivo → Nueva suscripción de calendario → pegar URL
- **Outlook**: Agregar calendario → Suscribirse desde web

La suscripción se actualiza automáticamente. El token es privado — regenerarlo invalida todas las suscripciones activas.

### Tratamientos multi-sesión

Algunos servicios (lifting de pestañas, depilación láser, etc.) se venden como paquetes de N sesiones:

```
TreatmentPlan (plan maestro)
  ├── name: { es: "Lifting de pestañas — 6 sesiones" }
  ├── total_sessions: 6
  ├── completed_sessions: 2
  └── expires_at: 2026-09-15

  └── TreatmentSession × 6
        ├── session_number: 1 → completed ✓
        ├── session_number: 2 → completed ✓
        ├── session_number: 3 → scheduled (próxima cita)
        └── session_number: 4-6 → pending
```

En el calendario, los eventos de sesión muestran `3/6` para indicar el progreso.

---

## 8. PWA y mobile-first

### Principios de diseño

- Layout base diseñado para `390px` (iPhone 14)
- Breakpoints hacia arriba: `sm:640px` `md:768px` `lg:1024px`
- Navegación: **bottom nav** en móvil, **sidebar** en `lg+`
- Touch targets mínimo `44px` (WCAG 2.5.5)
- `safe-area-inset` para notch y home indicator en iOS

### Manifest dinámico por tenant

```
/api/manifest/[slug]  →  JSON con nombre, colores e íconos del tenant
```

### Caché offline

| Recurso | Estrategia | TTL |
|---|---|---|
| Assets estáticos (`/_next/static`) | CacheFirst | indefinido |
| API de citas próximas | NetworkFirst | 24h |
| API de productos | StaleWhileRevalidate | 1h |
| Imágenes | CacheFirst | 7 días |
| Páginas HTML | NetworkFirst | — |

---

## 9. Internacionalización (i18n)

### Idiomas disponibles

| Código | Idioma | Tenants activos |
|---|---|---|
| `es` | Español | Channel Spa, Gio Spa (secundario), Spa Luna |
| `en` | English | Gio Spa, Glam Studio |

### Estructura de URLs

```
/es/calendario    → calendario en español
/en/calendar      → calendario en inglés
/es/agendar       → booking en español
/en/book          → booking en inglés
```

### Dos capas de textos

**Capa 1 — Textos fijos de la UI** (`messages/[locale].json`)
Botones, labels, mensajes de error — iguales para todos los tenants.
Namespaces: `nav`, `auth`, `home`, `booking`, `points`, `store`, `profile`, `calendar`, `admin`, `common`.

**Capa 2 — Textos del tenant** (JSONB en `tenants`)
Hero headline, subtítulo, CTAs — los edita la dueña del spa. Se guardan como `{ "es": "...", "en": "..." }`.

---

## 10. Dark mode

### 3 modos

| Modo | Comportamiento | Persistencia |
|---|---|---|
| `system` | Sigue el OS | Por defecto |
| `light` | Siempre claro | localStorage + Supabase |
| `dark` | Siempre oscuro | localStorage + Supabase |

### Paletas dark por tenant

Cada tenant define 4 tokens dark independientes:
```
brand_color_dark_bg       → fondo principal
brand_color_dark_surface  → tarjetas y paneles
brand_color_dark_text     → texto principal
brand_color_dark_border   → bordes
```

El color primario (`--brand-primary`) se mantiene igual en dark para consistencia de marca.

### Prevención de FOUC

Script inline en `<head>` antes de cualquier CSS:
```html
<script>
  const t = localStorage.getItem("theme") || "system";
  const dark = t === "dark" ||
    (t === "system" && matchMedia("(prefers-color-scheme:dark)").matches);
  document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
</script>
```

---

## 11. Módulos del sistema

### Matriz de módulos por plan

| Módulo | Starter | Premium | Premium Plus |
|---|---|---|---|
| Agendamiento de citas | ✓ | ✓ | ✓ |
| Calendario personal (cliente/trabajadora) | ✓ | ✓ | ✓ |
| iCal sync (Google / Apple Calendar) | ✓ | ✓ | ✓ |
| Login OAuth (Google, Apple) | ✓ | ✓ | ✓ |
| PWA instalable | ✓ | ✓ | ✓ |
| Multi-idioma | ✓ | ✓ | ✓ |
| Dark mode | ✓ | ✓ | ✓ |
| Recordatorios automáticos (email + push) | ✓ | ✓ | ✓ |
| Hasta 3 trabajadoras | ✓ | — | — |
| Hasta 10 trabajadoras | — | ✓ | ✓ |
| Tienda de productos | ✓ | ✓ | ✓ |
| Programa de puntos y fidelización | ✓ | ✓ | ✓ |
| Sistema de referidos | ✓ | ✓ | ✓ |
| Tratamientos multi-sesión | ✓ | ✓ | ✓ |
| Calendario del equipo (admin) | — | ✓ | ✓ |
| Gestión de usuarios (invite + roles) | — | ✓ | ✓ |
| Inventario con alertas | — | ✓ | ✓ |
| Historial de ventas | — | ✓ | ✓ |
| Reseñas y calificaciones | — | ✓ | ✓ |
| Multi-sucursal | — | — | ✓ |
| Dominio propio | — | — | ✓ |
| Soporte prioritario | — | — | ✓ |
| ☀️ Bronceo solar | Add-on | Add-on | Add-on |
| 🤖 Chatbot IA (WPP/Telegram) | Add-on ⚠️ | Add-on ⚠️ | Add-on ⚠️ |
| 📋 Arma tu plan | — ⚠️ | — ⚠️ | — ⚠️ |

> **Add-ons** se contratan por separado, independientemente del plan. Ver [sección 15](#15-planes-y-precios).  
> ⚠️ **PENDIENTE DE DESARROLLO**: Chatbot IA y Arma tu plan no están implementados aún.

### Detalle de módulos clave

#### Agendamiento de citas

- Wizard de 4 pasos: servicio → especialista (opcional) → fecha → hora
- Algoritmo de disponibilidad en `lib/booking/slots.ts` (grilla de 30 min, excluye solapamientos)
- Confirmación por email (Resend) + push notification
- Cancelación sin penalidad hasta 2h antes; tardía descuenta `cancellation_penalty` puntos
- La dueña ve la agenda del día con vista por especialista

#### Calendario y iCal sync

Ver [sección 7](#7-calendario-y-sincronización).

#### Tratamientos multi-sesión

Ver [sección 7](#7-calendario-y-sincronización).

#### Gestión de usuarios

- Solo accesible para `admin`
- Invitación por email (Supabase Auth envía el link)
- Cambio de rol en tiempo real (admin / trabajadora / recepcionista / cliente)
- Desactivación soft (no borra datos ni el auth user)
- Vinculación de `profile` a `specialist`

#### Fidelización y puntos

| Acción | Puntos |
|---|---|
| Completar servicio | `points_per_service` (default 100) |
| Sesión de bronceo | `points_per_service / 2` (default 50) |
| Compra en tienda | `points_per_purchase` por unidad de moneda |
| Referido que completa 1er cita | `referral_bonus_pts` (default 200) |
| Reseña aprobada | 30 pts (fijo) |
| Cancelación tardía | `-cancellation_penalty` (default -50) |

#### ☀️ Bronceo solar (add-on)

Módulo separado para spas con camas UV. Se activa con `feature_solar = true` en el tenant. Incluye:
- Gestión de espacios físicos (nombre, capacidad)
- Slots de 45 min entre 10:00–15:00
- Contador de sesiones por clienta
- Puntos y recordatorios al confirmar

#### Recordatorios automáticos (Edge Function)

`supabase/functions/appointment-reminders/` corre como cron y:
1. Encuentra citas en la ventana 24–25h
2. Envía email de recordatorio via Resend
3. Envía Web Push (scaffold listo, requiere VAPID)

---

## 12. Estructura de archivos

```
spa-saas/
│
├── app/
│   ├── [locale]/
│   │   ├── layout.tsx                ← TenantProvider + ThemeProvider + i18n
│   │   ├── page.tsx                  ← Home público del spa
│   │   ├── agendar/page.tsx          ← Wizard de agendamiento
│   │   ├── citas/page.tsx            ← Mis citas + historial + cancelación
│   │   ├── calendario/page.tsx       ← Calendario personal (cliente/trabajadora)
│   │   ├── tienda/page.tsx           ← Tienda de productos
│   │   ├── puntos/page.tsx           ← Dashboard de fidelización
│   │   ├── perfil/page.tsx           ← Perfil, tema, idioma, notificaciones
│   │   ├── auth/
│   │   │   ├── login/page.tsx
│   │   │   └── callback/route.ts     ← OAuth callback
│   │   └── admin/                    ← Panel de la dueña (role guard)
│   │       ├── layout.tsx            ← Navegación admin + verificación de rol
│   │       ├── page.tsx              ← Redirect a /admin/agenda
│   │       ├── agenda/page.tsx       ← Vista de agenda del día
│   │       ├── calendario/page.tsx   ← Calendario del equipo
│   │       ├── usuarios/page.tsx     ← Gestión de usuarios (solo admin)
│   │       ├── inventario/page.tsx
│   │       ├── ventas/page.tsx
│   │       ├── fidelizacion/page.tsx
│   │       ├── notificaciones/page.tsx
│   │       └── configuracion/page.tsx
│   │
│   └── api/
│       ├── manifest/[slug]/route.ts  ← PWA manifest dinámico
│       ├── theme/[slug]/route.ts     ← CSS vars del tenant
│       ├── booking/route.ts          ← POST crear cita
│       ├── booking/[id]/cancel/route.ts
│       ├── availability/route.ts     ← GET slots disponibles
│       ├── send-confirmation/route.ts← Email de confirmación (Resend)
│       ├── shop/route.ts             ← POST apartar producto
│       ├── calendar/[token]/route.ts ← Feed iCal privado por usuario
│       └── admin/usuarios/
│           ├── invite/route.ts       ← POST invitar usuario
│           ├── role/route.ts         ← POST cambiar rol
│           └── deactivate/route.ts   ← POST desactivar usuario
│
├── components/
│   ├── ui/                           ← shadcn/ui base
│   ├── layout/
│   │   ├── BottomNav.tsx             ← Nav inferior móvil
│   │   ├── TopBar.tsx                ← Barra superior
│   │   └── Sidebar.tsx               ← Sidebar desktop
│   ├── tenant/
│   │   ├── TenantProvider.tsx
│   │   └── FeatureGuard.tsx
│   ├── home/
│   │   ├── HeroSection.tsx
│   │   ├── ServicesGrid.tsx
│   │   └── LoyaltyBanner.tsx
│   ├── booking/
│   │   ├── BookingWizard.tsx
│   │   ├── ServiceSelector.tsx
│   │   ├── CalendarPicker.tsx
│   │   ├── TimeSlotGrid.tsx
│   │   ├── BookingConfirmation.tsx
│   │   └── CancelButton.tsx
│   ├── calendar/
│   │   ├── WeekCalendar.tsx          ← Vista semanal (cliente/trabajadora)
│   │   ├── TeamCalendarView.tsx      ← Vista de equipo con filtros (admin)
│   │   ├── SyncCalendarCard.tsx      ← Tarjeta iCal + botones Google/Apple
│   │   └── TreatmentPlanCard.tsx     ← Barra de progreso de sesiones
│   ├── admin/
│   │   ├── AdminAgendaView.tsx       ← Agenda del día por especialista
│   │   ├── UserManagement.tsx        ← Lista + invite + cambio de rol
│   │   └── UserRoleBadge.tsx         ← Badge visual por rol
│   └── pwa/
│       └── InstallPrompt.tsx
│
├── hooks/
│   ├── useTenant.ts
│   ├── useTheme.ts
│   ├── useLocale.ts
│   ├── useAuth.ts
│   ├── useFeature.ts
│   └── usePWA.ts
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts                 ← Browser client
│   │   ├── server.ts                 ← Server client (RSC)
│   │   ├── middleware.ts             ← Session refresh
│   │   └── types.ts                 ← Tipos: Tenant, Profile, UserRole, TreatmentPlan…
│   ├── booking/
│   │   └── slots.ts                  ← Algoritmo de disponibilidad
│   ├── data/
│   │   ├── appointments.ts           ← getMyAppointments, getAppointmentsForDay
│   │   ├── calendar.ts               ← getCalendarEvents, getTreatmentPlans, iCal token
│   │   ├── specialists.ts            ← getSpecialists, getSchedules
│   │   ├── services.ts               ← getServices (con dev data por tenant)
│   │   ├── products.ts               ← getProducts, updateStock
│   │   ├── inventory.ts              ← getInventoryMovements
│   │   └── users.ts                  ← getTenantUsers, inviteUser, updateUserRole
│   ├── tenant.ts                     ← getTenant(slug) + DEV_TENANTS
│   ├── theme.ts                      ← generateCSSVars(tenant)
│   └── utils.ts                      ← cn(), formatCurrency(), getTenantText()
│
├── messages/
│   ├── es.json                       ← nav, auth, home, booking, points, store,
│   └── en.json                       ←   profile, calendar, admin, common
│
├── supabase/
│   └── functions/
│       └── appointment-reminders/    ← Edge Function cron (Deno)
│
├── docs/
│   ├── database-schema.sql
│   └── new-tenant.md
│
├── proxy.ts                          ← Middleware: subdominio + locale + sesión
├── BUSINESS.md                       ← Idea de negocio, clientes, precios vs AgendaPRO
├── next.config.ts
└── README.md
```

---

## 13. Roadmap de desarrollo (sprints)

### Sprint 0 — Setup base ✅

- Next.js 16.2.3 + React 19 + Tailwind CSS 4 + shadcn/ui 4
- next-intl v4 + @ducanh2912/next-pwa
- `proxy.ts` (detección subdominio + locale + sesión Supabase)
- Variables de entorno configuradas

### Sprint 1 — Tenant system + Theming ✅

- Tabla `tenants`, `getTenant(slug)` con cache por request
- CSS custom properties por tenant (sin flash de tema)
- Dark mode con 3 modos + persistencia localStorage/Supabase
- PWA manifest dinámico por tenant
- `BottomNav` + `TopBar` + `Sidebar` responsive
- `LanguageSwitcher`, `FeatureGuard`, 6 hooks base

### Sprint 2 — Home público + Auth ✅

- `HeroSection`, `ServicesGrid`, `LoyaltyBanner` (async, i18n completo)
- Login OAuth → `/auth/callback` → creación de `profile`
- Página de perfil con idioma, tema, notificaciones
- Protección de rutas en `proxy.ts`

### Sprint 3 — Agendamiento de citas ✅

- Wizard de 4 pasos (`BookingWizard`)
- Algoritmo de disponibilidad (`lib/booking/slots.ts`)
- API `/api/booking`, `/api/availability`, `/api/booking/[id]/cancel`
- Página `/citas` con historial y `CancelButton`
- Panel admin `/admin/agenda` (vista del día)
- Email de confirmación con Resend
- Edge Function cron de recordatorios 24h

### Sprint 4 — Roles, Calendario y Multi-sesión ✅

- `UserRole`: admin / trabajadora / recepcionista / cliente
- Tipos: `TreatmentPlan`, `TreatmentSession`, `calendar_sync_token` en Profile
- `/[locale]/calendario` — vista semanal con roles (read-only para trabajadoras)
- `/admin/calendario` — calendario del equipo con filtros y colores por especialista
- `/api/calendar/[token]` — feed iCal compatible con Google Calendar y Apple Calendar
- `/admin/usuarios` — gestión completa: invite, cambio de rol, desactivación
- `TreatmentPlanCard` con barra de progreso y sesiones individuales
- Admin layout con navegación interna filtrada por rol

### Sprint 5 — Primeros clientes reales 🔜

- Cargar servicios reales de Channel Spa y Gio Spa
- Subir logos cuando los clientes los envíen
- Migración de datos en Supabase (producción)
- Tests end-to-end con usuarias reales

### Sprint 6 — Monetización 🔜

- Stripe: planes Starter/Premium/Premium Plus
- Add-on Bronceo Solar via Stripe ($9/mes)
- Portal de facturación self-service
- Límites por plan (cuota de citas, trabajadoras)

### Sprint 7 — Crecimiento 🔜

- Reseñas con moderación y respuesta del spa
- Analytics para la dueña (ingresos, ocupación, retención)
- Referidos con link único y tracking

### Sprint 8 — Chatbot IA + Arma tu plan 🔜 ⚠️ PENDIENTE

- **Chatbot IA via n8n** — WPP o Telegram a elección del cliente
  - Aprende de conversaciones pasadas
  - Escala al dueño ante situaciones desconocidas
  - Log de fallos para aprendizaje continuo
  - WhatsApp requiere número verificado + costo API mayor
- **Arma tu plan** — constructor de plan personalizado (módulos à la carte, precio dinámico)

---

## 14. Onboarding de un nuevo tenant

Ver detalle en [`docs/new-tenant.md`](./docs/new-tenant.md).

### Checklist rápido

1. **Reunión inicial** — logo, colores, servicios, especialistas, horarios
2. **Insertar tenant** — registro en `tenants` con config completa de branding
3. **Cargar datos** — servicios, especialistas con horarios, productos si aplica
4. **Subir assets** — `logo_url` en Supabase Storage, íconos PWA en `public/tenants/[slug]/`
5. **Crear usuarios** — la dueña invita a sus trabajadoras desde `/admin/usuarios`
6. **Configurar DNS** — subdominio apuntando a Vercel (o dominio propio en plan White-label)
7. **Pruebas** — booking, calendario, roles, email, push
8. **Entrega** — capacitación a la dueña (~1h)

---

## 15. Planes y precios

Los spas pagan desde el primer mes. No hay plan gratuito.

### Suscripción mensual al cliente

```
Starter       → $19/mes
              3 trabajadoras, tienda, puntos
              Tratamientos multi-sesión, recordatorios
              Calendario personal + iCal sync

Premium       → $39/mes
              10 trabajadoras, calendario del equipo
              Gestión de usuarios, inventario, ventas
              Reseñas y calificaciones

Premium Plus  → $79/mes
              Todo Premium + dominio propio
              Branding 100% personalizado
              Multi-sucursal + soporte prioritario
```

### Add-ons (cualquier plan)

```
☀️ Módulo Bronceo Solar         → $9/mes
   Sesiones UV, alertas, historial por cabina

🤖 Chatbot IA (WPP o Telegram)  → $25/mes  ⚠️ PENDIENTE
   IA que aprende de conversaciones pasadas,
   escala al dueño ante situaciones nuevas,
   logea todo para no fallar dos veces.
   Canal a elección del cliente.
   Integración via n8n.

📋 Arma tu plan                 → precio dinámico  ⚠️ PENDIENTE
   Constructor de plan personalizado: módulos à la carte
```

> El bronceo solar es un add-on porque no todos los spas tienen camas UV. No tiene sentido incluirlo en el plan base.  
> El chatbot y "arma tu plan" están pendientes de desarrollo — no construir aún.

### Costo de infraestructura (tuyo)

| Servicio | Costo |
|---|---|
| Supabase Pro (hasta ~15 tenants) | $25/mes |
| Vercel Pro | $20/mes |
| Dominio `.co` o `.com` | ~$1/mes |
| Resend (3K emails/mes) | $0 |
| Web Push (nativo del browser) | $0 |
| **Total** | **~$46/mes** |

### Proyección con clientes actuales

| Clientes | Ingresos brutos | Costo infra | Neto |
|---|---|---|---|
| 2 activos (Channel + Gio) | ~$58/mes | $46 | ~$12/mes |
| 5 clientes | ~$175/mes | $46 | ~$130/mes |
| 10 clientes | ~$390/mes | $50 | ~$340/mes |

---

## 16. Variables de entorno

```env
# ─── Supabase ───────────────────────────────────────────
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...     # Solo server — nunca exponer al cliente

# ─── OAuth ──────────────────────────────────────────────
# Configurar en Supabase Dashboard → Auth → Providers
# Las keys OAuth NO van en .env — van en el Dashboard de Supabase

# ─── Web Push (VAPID) ───────────────────────────────────
NEXT_PUBLIC_VAPID_PUBLIC_KEY=BNt...
VAPID_PRIVATE_KEY=xxx...
VAPID_SUBJECT=mailto:tu@email.com

# ─── Email ──────────────────────────────────────────────
RESEND_API_KEY=re_...

# ─── App ────────────────────────────────────────────────
NEXT_PUBLIC_APP_URL=https://glowos.co
NEXT_PUBLIC_APP_DOMAIN=glowos.co       # para parsear subdominios

# ─── Futuro ─────────────────────────────────────────────
# TWILIO_ACCOUNT_SID=
# TWILIO_AUTH_TOKEN=
# TWILIO_WHATSAPP_NUMBER=
# STRIPE_SECRET_KEY=
# STRIPE_WEBHOOK_SECRET=
```

> Crear `.env.local` para desarrollo. **Nunca commitear este archivo.**

---

## 17. Comandos útiles

```bash
# Desarrollo local
npm run dev

# Build de producción
npm run build

# Verificar TypeScript (debe dar 0 errores)
npx tsc --noEmit

# Linting
npm run lint

# Generar VAPID keys (una sola vez)
npx web-push generate-vapid-keys

# Supabase: aplicar migraciones
npx supabase db push

# Supabase: generar tipos TypeScript desde el schema
npx supabase gen types typescript --local > lib/supabase/types.ts

# Probar un tenant en dev
open "http://localhost:3000?tenant=channel-spa"
open "http://localhost:3000?tenant=gio-spa"
```

---

## 18. Notas técnicas

### Stack real vs. documentación oficial

| Componente | Versión real | Diferencia clave |
|---|---|---|
| Next.js | **16.2.3** | `middleware.ts` → `proxy.ts`; root layout requiere `<html>/<body>` |
| React | **19** | `<style>` se hoistea automáticamente desde Server Components |
| Tailwind CSS | **4** | `@import "tailwindcss"` en lugar de `@tailwind base/components/utilities` |
| shadcn/ui | **4.2.0** | Compatible con Tailwind 4 de forma nativa |
| next-intl | **4.9.1** | Server Components usan `getTranslations()`, no el hook de cliente |

### Decisiones de arquitectura

- **`proxy.ts`** en lugar de `middleware.ts`: Next.js 16 cambió el nombre del middleware principal.
- **CSS vars vía React 19 style-hoisting**: el `<style id="tenant-theme">` en el locale layout React 19 lo mueve al `<head>` automáticamente. Sin flash de tema.
- **Dev mode bypass**: cuando `NEXT_PUBLIC_SUPABASE_URL` no está configurado (o es `xxxx`), todos los datos vienen de `DEV_TENANTS` y datos hardcodeados. Permite desarrollar sin Supabase real.
- **`UserRole` como array-box en Server Components**: TypeScript estrecha el tipo a literal en control flow post-`redirect()`. Se usa `const roleArr = ["cliente"]` para evitar el error TS2367.
- **`feature_solar` como add-on**: el flag ya era un booleano independiente del plan. El cambio fue solo de nomenclatura en pricing — no requirió cambios de código.

### Cómo agregar un nuevo tenant

1. Agregar entrada en `DEV_TENANTS` en `lib/tenant.ts`
2. Agregar servicios en `lib/data/services.ts` bajo `"dev-[slug]"`
3. Agregar especialistas en `lib/data/specialists.ts`
4. En producción: INSERT en Supabase `tenants` + datos reales

---

_Última actualización: **Sprints 0–4 completados · 2 clientes activos (Channel Spa + Gio Spa) · `npx tsc --noEmit` = 0 errores** — 2026-04-21_
