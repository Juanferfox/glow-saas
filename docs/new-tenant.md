# Onboarding de un Nuevo Tenant (SPA)

Este documento detalla los pasos necesarios para dar de alta a un nuevo cliente en la plataforma `spa-saas`.

## 1. Configuración en la Base de Datos (Supabase)

Cada tenant debe tener una entrada en la tabla `tenants`. Ejecuta el siguiente SQL o usa el Dashboard de Supabase:

```sql
INSERT INTO tenants (
  slug,
  name,
  plan,
  default_locale,
  active_locales,
  timezone,
  currency,
  primary_color,
  secondary_color
) VALUES (
  'mi-spa-nuevo',
  'Nombre del Spa',
  'pro', -- o 'premium'
  'es',
  ['es', 'en'],
  'America/Bogota',
  'COP',
  '#BC9C7F',
  '#F5F5F5'
);
```

## 2. Assets y Branding

1. **Logo**: Sube el logo en formato PNG o SVG al bucket `logos` en Supabase Storage.
2. **Path**: `/logos/mi-spa-nuevo/logo.png`.
3. **PWA Icons**: Genera los iconos (192x192 y 512x512) y súbelos a `/storage/v1/object/public/logos/mi-spa-nuevo/icon-512.png`.

## 3. Configuración de Dominio (Vercel)

1. Ve al Dashboard de Vercel.
2. En **Settings > Domains**, añade el subdominio: `mi-spa-nuevo.tuplatforma.com`.
3. Asegúrate de que las variables de entorno de Supabase estén correctamente configuradas.

## 4. Estilos Personalizados

Los colores se inyectan automáticamente vía variables CSS `-—brand-primary`. Si el cliente requiere fuentes específicas de Google Fonts:

1. Añade la fuente en `lib/fonts.ts`.
2. Actualiza el campo `fonts` en la tabla `tenants`.

## 5. Módulos y Features

Activa o desactiva módulos usando la tabla `tenant_features`:

```sql
INSERT INTO tenant_features (tenant_id, feature_key, enabled)
VALUES ('ID_DEL_TENANT', 'bronceo_solar', true);
```

---

## Checklist de Verificación
- [ ] Login con Google/Email funcionando.
- [ ] Notificaciones push configuradas.
- [ ] Servicios y especialistas cargados.
- [ ] Horarios de atención configurados.
- [ ] PWA instalable con el logo correcto.
