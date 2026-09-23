# Guía de instalación — Formulario Angel F. Leal, Jr., P.A.

Este documento explica cómo conectar el formulario (`index.html`) con el
backend en Google Apps Script (`backend/Code.gs`), usando una Google Sheet
como base de datos y una carpeta de Google Drive para los documentos.

**Tiempo estimado:** 20–30 minutos la primera vez.

> ⚠️ **Antes de empezar:** asegúrate de tener acceso a la cuenta de Google
> **del despacho** (no la personal), porque ahí quedarán los datos de los
> clientes.

---

## Índice

1. [Estructura de archivos](#estructura-de-archivos)
2. [Configuración actual del proyecto](#configuración-actual-del-proyecto)
3. [Paso 1 — Crear la Google Sheet](#paso-1--crear-la-google-sheet)
4. [Paso 2 — Crear la carpeta de Drive](#paso-2--crear-la-carpeta-de-drive)
5. [Paso 3 — Crear el proyecto de Apps Script](#paso-3--crear-el-proyecto-de-apps-script)
6. [Paso 4 — Configurar los IDs](#paso-4--configurar-los-ids)
7. [Paso 5 — Publicar como aplicación web](#paso-5--publicar-como-aplicación-web)
8. [Paso 6 — Conectar el formulario](#paso-6--conectar-el-formulario)
9. [Paso 7 — Publicar el formulario](#paso-7--publicar-el-formulario)
10. [Verificación final](#verificación-final)
11. [Cómo se ve la información](#cómo-se-ve-la-información)
12. [Mantenimiento](#mantenimiento)
13. [Notas de seguridad](#notas-de-seguridad)

---

## Estructura de archivos

El repositorio tiene dos archivos que necesitas mover:

- **`index.html`** → el formulario que ven los usuarios (frontend).
  Vive en la **raíz** del repositorio.
- **`backend/Code.gs`** → el backend en Apps Script.
  Vive dentro de la **carpeta `backend/`**.

Asegúrate de copiar cada uno desde la ubicación correcta.

---

## Configuración actual del proyecto

Este proyecto **ya está configurado y funcionando**. Los valores reales son:

| Parámetro | Valor |
|---|---|
| **Cuenta de Google** | `edd.cast1313` |
| **SHEET_ID** | `1LmaRu9IJnMwRpVVz1XF_PegLU6-9jcPdOV1gjFdGwig` |
| **DRIVE_FOLDER_ID** | `1OTUUjr-aKOiDcrkNqkS6r3-pT0WZ5wl-` |
| **API_URL (Web App)** | `https://script.google.com/macros/s/AKfycbywNCWY6SDCz9voluIwuMC5y2BCeGWX0ZGsg9BxKo-u8bV_2wNBT_o_vV3oh1aKyXH8lA/exec` |

⚠️ **Estos valores son sensibles.** No los compartas fuera del personal
del despacho ni los subas a repositorios públicos.

> 🔹 Los pasos 1, 2 y 3 de esta guía **solo aplican si hay que reinstalar
> desde cero**. El proyecto actual ya está desplegado.

---

## Paso 1 — Crear la Google Sheet (solo si hay que reinstalar)

1. Ve a [sheets.google.com](https://sheets.google.com) y crea una hoja nueva.
2. Nómbrala, por ejemplo, **"Solicitudes Angel Leal"**.
3. Copia el **ID de la hoja**: es la parte de la URL entre `/d/` y `/edit`.

   Ejemplo: