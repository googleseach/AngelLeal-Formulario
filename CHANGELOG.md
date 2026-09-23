# Changelog

Todos los cambios notables de este proyecto se documentan aquí.

El formato sigue [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/)
y este proyecto se adhiere a [Versionado Semántico](https://semver.org/lang/es/).

## [No publicado]

### Añadido
- Estructura inicial del repositorio (`backend/`, `docs/`, `.github/workflows/`).
- Workflow de GitHub Actions para desplegar `index.html` a GitHub Pages.
- Aviso de privacidad visible en el paso 5 (revisión y envío).
- Validación de configuración al cargar: advierte si `API_URL` no termina en `/exec`.
- Banner de error visible cuando falla la conexión con el backend.
- Manejo de sesiones expiradas en el backend (limpieza automática en cada login).
- Manejo de archivos huérfanos: al eliminar un documento ya subido, se borra de Drive.
- `LockService` en las operaciones de escritura (registro, guardado, envío).

### Corregido
- **Seguridad (XSS):** se sanitiza todo contenido dinámico inyectado vía `innerHTML`
  con la función `esc()`. Afecta a: nombres, dirección, teléfono, detalles de caso,
  nombres de archivos y viajes.
- **Rendimiento:** `renderPersonalStep()` enganchaba listeners duplicados en cada
  re-render, saturando `scheduleSave()` y agotando la cuota de Apps Script.
  Ahora se enganchan una sola vez con `dataset.bound`.
- **Validación:** los campos obligatorios del paso 2 (detalles del caso) no se
  validaban. Ahora se valida por tipo de caso usando `CASE_REQUIRED_FIELDS`.
- **UX:** los campos del paso 5 (revisión) mostraban las claves internas
  (`pais-origen`, `motivo`) en vez de etiquetas legibles. Ahora se usa
  `CASE_FIELD_LABELS` y `PERSONAL_FIELD_LABELS`, y se muestran todos los
  campos del paso 1 con valor.
- **UX:** al fallar una validación, la página hace scroll al primer campo
  inválido y le da foco.
- **Robustez:** `leerProgreso()` devuelve `null` limpio si el JSON guardado
  está corrupto, en lugar de lanzar excepción.
- **Robustez:** errores de red con mensajes claros en español.

### Seguridad
- Contraseñas con hash SHA-256 (nunca en texto plano).
- Tokens de sesión UUID con expiración a 14 días.
- Validación de formato de email en el backend.
- Verificación de `SHEET_ID` y `DRIVE_FOLDER_ID` configurados antes de operar.

### Pendiente (roadmap)
- [ ] Migrar autenticación a un servicio dedicado (Firebase Auth, Auth0)
      antes de un despliegue a producción con volumen alto.
- [ ] Añadir registro de auditoría (quién accede a qué caso, cuándo).
- [ ] Tests automatizados del backend con `clasp` + `jest` (opcional).
- [ ] Revisar cumplimiento de privacidad con un asesor legal del despacho.

---

## [0.1.0] — 2026-09-23

### Añadido
- Importación inicial del paquete original:
  - `index.html`: formulario de solicitud (frontend).
  - `backend/Code.gs`: Apps Script (backend).
  - `INSTRUCCIONES.md`, `README.md`, `.gitignore`.