# README de Seguridad

## Objetivo

Establecer prácticas y controles para evitar exposición de información sensible en este repositorio y en el despliegue.

## Qué se considera sensible

- Secretos: API keys, passwords, tokens, cookies secrets, llaves privadas, credenciales de terceros.
- Conexión a datos: URLs/strings de DB, service accounts, credenciales de cloud.
- PII: correos, nombres, IDs externos, títulos de eventos/tareas cuando identifiquen a una persona.

## Reglas del repositorio

- No commitear `.env*`, llaves (`*.pem`, `*.key`, `*.p12`, `*.pfx`) ni credenciales locales.
- No loguear request bodies ni datos de usuario en endpoints server-side.
- Mantener `NEXTAUTH_SECRET` configurado siempre en producción.

## Configuración segura de variables de entorno

Ejemplo (local):

```env
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=...
```

En producción, configurar estas variables en el proveedor de hosting y no en archivos dentro del repo.

## Controles automáticos

### Pre-commit

Este repo incluye un hook de pre-commit que bloquea:
- Archivos sensibles por nombre/patrón (por ejemplo, `.env`, llaves privadas).
- Patrones comunes de secretos dentro de archivos staged.

Comandos útiles:

```bash
npm run security:scan
```

### Escaneo profundo recomendado (fuera de Node)

Para escanear historial y branches completas, se recomienda ejecutar (según disponibilidad):
- TruffleHog (repositorio Git)
- Gitleaks (repositorio Git)

Ejecutar estos escaneos antes de publicar releases o abrir el repo a terceros.

## Limpieza si se expuso un secreto

- Rota el secreto en el proveedor (Google/GitHub/etc.) de inmediato.
- Elimina el secreto del árbol actual.
- Reescribe historial si el secreto estuvo en commits anteriores.
- Valida que no existan tags/releases con el secreto.

## Referencias

- Política de reporte: ver `SECURITY.md`.

