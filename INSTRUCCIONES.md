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
2. [Paso 1 — Crear la Google Sheet](#paso-1--crear-la-google-sheet)
3. [Paso 2 — Crear la carpeta de Drive](#paso-2--crear-la-carpeta-de-drive)
4. [Paso 3 — Crear el proyecto de Apps Script](#paso-3--crear-el-proyecto-de-apps-script)
5. [Paso 4 — Configurar los IDs](#paso-4--configurar-los-ids)
6. [Paso 5 — Publicar como aplicación web](#paso-5--publicar-como-aplicación-web)
7. [Paso 6 — Conectar el formulario](#paso-6--conectar-el-formulario)
8. [Paso 7 — Publicar el formulario](#paso-7--publicar-el-formulario)
9. [Verificación final](#verificación-final)
10. [Cómo se ve la información](#cómo-se-ve-la-información)
11. [Mantenimiento](#mantenimiento)
12. [Notas de seguridad](#notas-de-seguridad)

---

## Estructura de archivos

El repositorio tiene dos archivos que necesitas mover:

- **`index.html`** → el formulario que ven los usuarios (frontend).
  Vive en la **raíz** del repositorio.
- **`backend/Code.gs`** → el backend en Apps Script.
  Vive dentro de la **carpeta `backend/`**.

Asegúrate de copiar cada uno desde la ubicación correcta.

---

## Paso 1 — Crear la Google Sheet

1. Ve a [sheets.google.com](https://sheets.google.com) y crea una hoja nueva.
2. Nómbrala, por ejemplo, **"Solicitudes Angel Leal"**.
3. Copia el **ID de la hoja**: es la parte de la URL entre `/d/` y `/edit`.

   Ejemplo: