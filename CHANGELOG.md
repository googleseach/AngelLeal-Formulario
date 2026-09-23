# Changelog

Todos los cambios notables de este proyecto se documentan aquí.

El formato sigue [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/).

## [No publicado]

### Añadido
- Estructura inicial del repositorio.
- `README.md`, `CHANGELOG.md`, `.gitignore`.
- Frontend (`index.html`) y backend (`backend/Code.gs`) importados del paquete original.

### Por corregir (roadmap)
- [ ] P0 — Sanitizar `innerHTML` para prevenir XSS.
- [ ] P0 — Eliminar listeners duplicados en pasos re-renderizados.
- [ ] P0 — Validar campos obligatorios del paso 2 (detalles del caso).
- [ ] P1 — Etiquetas legibles en la pantalla de revisión.
- [ ] P1 — `LockService` en `guardarProgreso` para evitar race conditions.
- [ ] P1 — Manejo de archivos huérfanos al eliminar documentos.
- [ ] P2 — Deduplicación de archivos subidos.
- [ ] P2 — Validación de URL `/exec` y errores de red visibles.
- [ ] P3 — Aviso de privacidad visible.
- [ ] P3 — Migrar autenticación a Firebase Auth.