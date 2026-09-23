# Formulario de solicitud — Angel F. Leal, Jr., P.A.

Portal web para que clientes del despacho Angel F. Leal, Jr., P.A. presenten
solicitudes de casos de inmigración (asilo, residencia, ciudadanía, perdón/waiver)
y suban sus documentos de respaldo.

## Arquitectura

- **Frontend:** `index.html` — formulario de una sola página (HTML/CSS/JS vanilla).
- **Backend:** `backend/Code.gs` — Google Apps Script desplegado como Web App.
- **Almacenamiento:**
  - Google Sheets → usuarios, sesiones y solicitudes.
  - Google Drive → documentos subidos, organizados por carpeta de usuario.

## Estructura del repositorio
