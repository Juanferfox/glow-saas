# GlowOS — Plataforma SaaS para Spas y Centros de Bienestar

## La idea de negocio

**GlowOS** es un SaaS multi-tenant diseñado exclusivamente para spas, centros de estética y bienestar. No es una herramienta genérica de agendamiento: es una plataforma pensada desde el primer día para los flujos reales de este negocio — tratamientos de múltiples sesiones, equipos pequeños, clientes frecuentes y la necesidad de que la dueña tenga control total sin depender de un técnico.

---

## A quién va dirigido

### Dueña / Propietaria
- Quiere ver todo el negocio de un vistazo: qué pasa hoy, esta semana, quién está ocupada.
- Necesita crear y eliminar trabajadoras, asignarles servicios, ver sus calendarios.
- Quiere que sus clientes tengan una experiencia bonita y profesional, no un link de WhatsApp.
- No tiene tiempo para capacitar a nadie en software complicado.

### Trabajadoras / Especialistas
- Solo necesitan saber qué tienen hoy y mañana.
- No deben poder cambiar citas, mover horarios ni ver datos sensibles de otras.
- Acceso simple: entro, veo mi agenda, listo.

### Clientas
- Quieren agendar desde el celular en 2 minutos, a cualquier hora.
- Quieren recordatorios, no tener que llamar a preguntar si su cita está confirmada.
- Si tienen tratamiento de varias sesiones, quieren ver cuántas llevan y cuántas faltan.
- El programa de puntos las incentiva a regresar.

---

## Flujos clave que resuelve

| Problema real | Cómo lo resuelve GlowOS |
|---|---|
| "¿A qué hora tengo libre a Valentina el viernes?" | Vista de agenda por especialista con drag & drop |
| "Mi clienta lleva 4 de 6 sesiones de lifting" | Tratamientos multi-sesión con progreso visible |
| "Se me olvidó confirmar las citas de mañana" | Cron de recordatorios 24h automático por email + push |
| "Quiero que mis clientas agenden solas" | App PWA instalable, booking en 3 pasos |
| "Necesito agregar a mi nueva empleada" | Panel admin: crear usuario con rol y especialidad en <1 min |
| "Mi clienta quiere ver su calendario en iPhone" | Sincronización con Google Calendar y Apple Calendar (iCal) |
| "¿Cuántos puntos tiene esta clienta?" | Balance de puntos en tiempo real, canjeable desde la app |

---

## GlowOS vs AgendaPRO

| Característica | **GlowOS** | **AgendaPRO** |
|---|---|---|
| **Enfoque** | Spas y estética | Genérico (médicos, coaches, salones) |
| **Roles diferenciados** | Dueña / Trabajadora / Cliente | Solo admin y cliente |
| **Tratamientos multi-sesión** | ✅ Con progreso y alertas | ❌ Cada cita es independiente |
| **Calendario propio integrado** | ✅ Vista de equipo + personal | ⚠️ Solo lista de citas |
| **Sincronización Google/Apple** | ✅ iCal feed + OAuth | ⚠️ Google Calendar básico |
| **Programa de puntos** | ✅ Puntos por cita, compra y referido | ❌ No incluido |
| **Tienda de productos** | ✅ Catálogo con reserva | ❌ No incluido |
| **Bronceo solar (sesiones UV)** | ✅ Módulo dedicado con contador | ❌ No incluido |
| **Multi-tenant / multi-sucursal** | ✅ Por subdominio | ⚠️ Limitado |
| **PWA instalable** | ✅ App nativa sin App Store | ❌ Solo web |
| **Precio** | Desde $0 (free tier) | Desde $29/mes |
| **Setup** | <30 min self-service | Requiere onboarding pagado |
| **Personalización de marca** | ✅ Logo, colores, tipografía | ⚠️ Templates fijos |
| **Idiomas** | ✅ ES + EN nativo | ⚠️ Solo idioma base |
| **Open source / exportable** | ✅ Datos siempre tuyos | ❌ Vendor lock-in |

---

## Modelo de negocio

```
Free tier     → 1 tenant, hasta 50 citas/mes, sin tienda     → $0
Starter       → Tienda + puntos + 3 trabajadoras             → $19/mes
Pro           → Multi-sucursal + sincronización calendario   → $49/mes
White-label   → Dominio propio + branding completo           → $99/mes
```

---

## Roadmap de producto

### ✅ Sprint 1-2 — Base
- Multi-tenant con subdominio
- Branding por tenant (colores, fuentes, logo)
- Booking en 3 pasos
- Módulo de puntos
- Tienda básica

### ✅ Sprint 3 — Notificaciones
- Email de confirmación (Resend)
- Edge Function de recordatorios 24h
- Página `/citas` del cliente

### 🔄 Sprint 4 — Roles y Calendario
- Roles: dueña / trabajadora / cliente
- Panel de gestión de usuarias (dueña)
- Calendario interno con vista de equipo
- Vista solo-lectura para trabajadoras
- Sincronización Google Calendar / Apple Calendar (iCal)
- Tratamientos multi-sesión con progreso

### 🔜 Sprint 5 — Monetización
- Stripe para planes Starter/Pro
- Portal de facturación
- Límites por plan

### 🔜 Sprint 6 — Crecimiento
- Sistema de reseñas con aprobación
- Referidos con link único
- Analytics para la dueña (ingresos, ocupación, retención)
