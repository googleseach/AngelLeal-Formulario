/**
 * BACKEND — Formulario de solicitud de casos (Angel F. Leal, Jr., P.A.)
 * ------------------------------------------------------------------
 * Este script se despliega como "Aplicación web" y sirve como backend
 * para el formulario index.html. Guarda usuarios, sesiones y
 * solicitudes en una Google Sheet, y los archivos subidos en una
 * carpeta de Google Drive.
 *
 * VER INSTRUCCIONES.md PARA LOS PASOS DE INSTALACIÓN.
 */

const SHEET_ID = "PEGA_AQUI_EL_ID_DE_TU_GOOGLE_SHEET";
const DRIVE_FOLDER_ID = "PEGA_AQUI_EL_ID_DE_TU_CARPETA_DE_DRIVE";

const SHEET_USUARIOS = "Usuarios";
const SHEET_SESIONES = "Sesiones";
const SHEET_SOLICITUDES = "Solicitudes";

const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 14; // 14 días

/* ================= ENTRADA PRINCIPAL ================= */

function doPost(e) {
  let out;
  try {
    const req = JSON.parse(e.postData.contents);
    switch (req.action) {
      case "registrar":
        out = registrar(req);
        break;
      case "login":
        out = login(req);
        break;
      case "guardarProgreso":
        out = guardarProgreso(req);
        break;
      case "obtenerProgreso":
        out = obtenerProgreso(req);
        break;
      case "enviarSolicitud":
        out = enviarSolicitud(req);
        break;
      default:
        out = { error: "Acción no reconocida." };
    }
  } catch (err) {
    out = { error: "Error del servidor: " + err.message };
  }
  return ContentService.createTextOutput(JSON.stringify(out))
    .setMimeType(ContentService.MimeType.JSON);
}

/* ================= AUTENTICACIÓN ================= */

function registrar(req) {
  const email = (req.email || "").trim().toLowerCase();
  const password = req.password || "";
  const name = req.name || "";

  if (!email || !password) return { error: "Correo y contraseña son obligatorios." };
  if (password.length < 8) return { error: "La contraseña debe tener al menos 8 caracteres." };

  const sheet = getSheet(SHEET_USUARIOS);
  const rows = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if ((rows[i][0] || "").toLowerCase() === email) {
      return { error: "Ya existe una cuenta con este correo." };
    }
  }

  const hash = hashPassword(password);
  sheet.appendRow([email, name, hash, new Date()]);

  const token = createSession(email);
  return { sessionToken: token };
}

function login(req) {
  const email = (req.email || "").trim().toLowerCase();
  const password = req.password || "";

  const sheet = getSheet(SHEET_USUARIOS);
  const rows = sheet.getDataRange().getValues();
  let found = false;
  for (let i = 1; i < rows.length; i++) {
    if ((rows[i][0] || "").toLowerCase() === email) {
      found = true;
      if (rows[i][2] !== hashPassword(password)) {
        return { error: "Contraseña incorrecta." };
      }
      break;
    }
  }
  if (!found) return { error: "No existe una cuenta con este correo." };

  const token = createSession(email);
  const progreso = leerProgreso(email);
  return { sessionToken: token, progreso: progreso };
}

function hashPassword(password) {
  const digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, password, Utilities.Charset.UTF_8);
  return digest.map(b => (b < 0 ? b + 256 : b).toString(16).padStart(2, "0")).join("");
}

function createSession(email) {
  const token = Utilities.getUuid();
  const sheet = getSheet(SHEET_SESIONES);
  const expira = new Date(Date.now() + SESSION_DURATION_MS);
  sheet.appendRow([token, email, expira]);
  return token;
}

function emailFromToken(token) {
  if (!token) return null;
  const sheet = getSheet(SHEET_SESIONES);
  const rows = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === token) {
      const expira = new Date(rows[i][2]);
      if (expira.getTime() < Date.now()) return null;
      return rows[i][1];
    }
  }
  return null;
}

/* ================= PROGRESO / SOLICITUDES ================= */

function guardarProgreso(req) {
  const email = emailFromToken(req.sessionToken);
  if (!email) return { error: "Sesión inválida. Vuelva a iniciar sesión." };

  const progreso = req.progreso || {};
  const archivosGuardados = guardarArchivos(email, progreso.files || {});
  progreso.files = archivosGuardados; // reemplaza base64 por URLs ya subidas

  const sheet = getSheet(SHEET_SOLICITUDES);
  const rows = sheet.getDataRange().getValues();
  let rowIndex = -1;
  for (let i = 1; i < rows.length; i++) {
    if ((rows[i][0] || "").toLowerCase() === email && rows[i][3] === "borrador") {
      rowIndex = i + 1;
      break;
    }
  }

  const datosJSON = JSON.stringify(progreso);
  if (rowIndex === -1) {
    sheet.appendRow([email, progreso.caseType || "", datosJSON, "borrador", new Date(), new Date()]);
  } else {
    sheet.getRange(rowIndex, 3).setValue(datosJSON);
    sheet.getRange(rowIndex, 2).setValue(progreso.caseType || "");
    sheet.getRange(rowIndex, 6).setValue(new Date());
  }
  return { ok: true, progreso: progreso };
}

function obtenerProgreso(req) {
  const email = emailFromToken(req.sessionToken);
  if (!email) return { error: "Sesión inválida." };
  return { progreso: leerProgreso(email) };
}

function leerProgreso(email) {
  const sheet = getSheet(SHEET_SOLICITUDES);
  const rows = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if ((rows[i][0] || "").toLowerCase() === email && rows[i][3] === "borrador") {
      try { return JSON.parse(rows[i][2]); } catch (e) { return null; }
    }
  }
  return null;
}

function enviarSolicitud(req) {
  const email = emailFromToken(req.sessionToken);
  if (!email) return { error: "Sesión inválida. Vuelva a iniciar sesión." };

  const progreso = req.progreso || {};
  const archivosGuardados = guardarArchivos(email, progreso.files || {});
  progreso.files = archivosGuardados;

  const sheet = getSheet(SHEET_SOLICITUDES);
  const rows = sheet.getDataRange().getValues();
  let rowIndex = -1;
  for (let i = 1; i < rows.length; i++) {
    if ((rows[i][0] || "").toLowerCase() === email && rows[i][3] === "borrador") {
      rowIndex = i + 1;
      break;
    }
  }

  const datosJSON = JSON.stringify(progreso);
  if (rowIndex === -1) {
    sheet.appendRow([email, progreso.caseType || "", datosJSON, "enviado", new Date(), new Date()]);
  } else {
    sheet.getRange(rowIndex, 3).setValue(datosJSON);
    sheet.getRange(rowIndex, 4).setValue("enviado");
    sheet.getRange(rowIndex, 6).setValue(new Date());
  }
  return { ok: true };
}

/* ================= ARCHIVOS ================= */

// Recibe { key: [{name,size,type,base64 | url}] } y sube solo los que
// todavía traen base64 (los que ya tienen url fueron subidos antes).
function guardarArchivos(email, filesByKey) {
  const folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
  const userFolder = getOrCreateSubfolder(folder, email);
  const result = {};

  Object.keys(filesByKey).forEach(key => {
    result[key] = filesByKey[key].map(f => {
      if (f.url) return f; // ya estaba subido
      if (!f.base64) return f;
      try {
        const bytes = Utilities.base64Decode(f.base64);
        const blob = Utilities.newBlob(bytes, f.type || "application/octet-stream", f.name);
        const file = userFolder.createFile(blob);
        return { name: f.name, size: f.size, type: f.type, url: file.getUrl() };
      } catch (err) {
        return { name: f.name, size: f.size, error: "No se pudo subir: " + err.message };
      }
    });
  });
  return result;
}

function getOrCreateSubfolder(parent, name) {
  const it = parent.getFoldersByName(name);
  if (it.hasNext()) return it.next();
  return parent.createFolder(name);
}

/* ================= UTILIDADES DE HOJA ================= */

function getSheet(name) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    if (name === SHEET_USUARIOS) sheet.appendRow(["Email", "Nombre", "PasswordHash", "FechaRegistro"]);
    if (name === SHEET_SESIONES) sheet.appendRow(["Token", "Email", "Expira"]);
    if (name === SHEET_SOLICITUDES) sheet.appendRow(["Email", "TipoCaso", "DatosJSON", "Estado", "FechaCreacion", "FechaActualizacion"]);
  }
  return sheet;
}
