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
const LOCK_TIMEOUT_MS = 10000; // 10 segundos

/* ================= ENTRADA PRINCIPAL ================= */

function doPost(e) {
  let out;
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return jsonOut({ error: "Solicitud vacía o malformada." });
    }
    const req = JSON.parse(e.postData.contents);
    switch (req.action) {
      case "registrar":        out = registrar(req); break;
      case "login":            out = login(req); break;
      case "guardarProgreso":  out = guardarProgreso(req); break;
      case "obtenerProgreso":  out = obtenerProgreso(req); break;
      case "enviarSolicitud":  out = enviarSolicitud(req); break;
      default:
        out = { error: "Acción no reconocida." };
    }
  } catch (err) {
    out = { error: "Error del servidor: " + err.message };
  }
  return jsonOut(out);
}

function jsonOut(obj){
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Verifica que la configuración obligatoria esté completa.
 * Si no, devuelve un error claro para que el frontend lo muestre.
 */
function assertConfig_(){
  if (!SHEET_ID || SHEET_ID.indexOf("PEGA_AQUI") === 0) {
    throw new Error("Falta configurar SHEET_ID en Code.gs.");
  }
  if (!DRIVE_FOLDER_ID || DRIVE_FOLDER_ID.indexOf("PEGA_AQUI") === 0) {
    throw new Error("Falta configurar DRIVE_FOLDER_ID en Code.gs.");
  }
}

/* ================= AUTENTICACIÓN ================= */

function registrar(req) {
  assertConfig_();
  const email = (req.email || "").trim().toLowerCase();
  const password = req.password || "";
  const name = req.name || "";

  if (!email || !password) return { error: "Correo y contraseña son obligatorios." };
  if (password.length < 8) return { error: "La contraseña debe tener al menos 8 caracteres." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "Correo inválido." };

  const lock = LockService.getScriptLock();
  try { lock.waitLock(LOCK_TIMEOUT_MS); }
  catch(e){ return { error: "El servidor está ocupado. Intente de nuevo en unos segundos." }; }

  try {
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
  } finally {
    lock.releaseLock();
  }
}

function login(req) {
  assertConfig_();
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
  // Limpieza oportunista: eliminar sesiones expiradas para no acumular basura
  limpiarSesionesExpiradas_(sheet);
  return token;
}

function limpiarSesionesExpiradas_(sheet){
  try {
    const rows = sheet.getDataRange().getValues();
    const now = Date.now();
    // Recorrer de abajo hacia arriba para poder borrar filas sin desajustar índices
    for (let i = rows.length - 1; i >= 1; i--) {
      const expira = new Date(rows[i][2]);
      if (expira.getTime() < now) sheet.deleteRow(i + 1);
    }
  } catch(e){
    // Si falla la limpieza, no romper el login
    console.warn("No se pudieron limpiar sesiones expiradas:", e.message);
  }
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
  assertConfig_();
  const email = emailFromToken(req.sessionToken);
  if (!email) return { error: "Sesión inválida. Vuelva a iniciar sesión." };

  const progreso = req.progreso || {};
  const archivosGuardados = guardarArchivos(email, progreso.files || {});
  progreso.files = archivosGuardados; // reemplaza base64 por URLs ya subidas

  const lock = LockService.getScriptLock();
  try { lock.waitLock(LOCK_TIMEOUT_MS); }
  catch(e){ return { error: "El servidor está ocupado. Intente de nuevo en unos segundos." }; }

  try {
    const sheet = getSheet(SHEET_SOLICITUDES);
    const rowIndex = findDraftRow_(sheet, email);
    const datosJSON = JSON.stringify(progreso);

    if (rowIndex === -1) {
      sheet.appendRow([email, progreso.caseType || "", datosJSON, "borrador", new Date(), new Date()]);
    } else {
      sheet.getRange(rowIndex, 2).setValue(progreso.caseType || "");
      sheet.getRange(rowIndex, 3).setValue(datosJSON);
      sheet.getRange(rowIndex, 6).setValue(new Date());
    }
    return { ok: true, progreso: progreso };
  } finally {
    lock.releaseLock();
  }
}

function obtenerProgreso(req) {
  assertConfig_();
  const email = emailFromToken(req.sessionToken);
  if (!email) return { error: "Sesión inválida." };
  return { progreso: leerProgreso(email) };
}

function leerProgreso(email) {
  const sheet = getSheet(SHEET_SOLICITUDES);
  const rowIndex = findDraftRow_(sheet, email);
  if (rowIndex === -1) return null;
  try {
    const raw = sheet.getRange(rowIndex, 3).getValue();
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    return null; // JSON corrupto: mejor devolver null que explotar
  }
}

function enviarSolicitud(req) {
  assertConfig_();
  const email = emailFromToken(req.sessionToken);
  if (!email) return { error: "Sesión inválida. Vuelva a iniciar sesión." };

  const progreso = req.progreso || {};
  const archivosGuardados = guardarArchivos(email, progreso.files || {});
  progreso.files = archivosGuardados;

  const lock = LockService.getScriptLock();
  try { lock.waitLock(LOCK_TIMEOUT_MS); }
  catch(e){ return { error: "El servidor está ocupado. Intente de nuevo en unos segundos." }; }

  try {
    const sheet = getSheet(SHEET_SOLICITUDES);
    const rowIndex = findDraftRow_(sheet, email);
    const datosJSON = JSON.stringify(progreso);

    if (rowIndex === -1) {
      sheet.appendRow([email, progreso.caseType || "", datosJSON, "enviado", new Date(), new Date()]);
    } else {
      sheet.getRange(rowIndex, 2).setValue(progreso.caseType || "");
      sheet.getRange(rowIndex, 3).setValue(datosJSON);
      sheet.getRange(rowIndex, 4).setValue("enviado");
      sheet.getRange(rowIndex, 6).setValue(new Date());
    }
    return { ok: true };
  } finally {
    lock.releaseLock();
  }
}

/**
 * Encuentra la fila (1-indexada) del borrador del usuario.
 * Devuelve -1 si no existe.
 */
function findDraftRow_(sheet, email){
  const rows = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if ((rows[i][0] || "").toLowerCase() === email && rows[i][3] === "borrador") {
      return i + 1;
    }
  }
  return -1;
}

/* ================= ARCHIVOS ================= */

/**
 * Recibe { key: [{name,size,type,base64|url,deleted?}] } y:
 *  - sube los que traen base64 (los nuevos)
 *  - omite los que ya tienen url (ya subidos)
 *  - borra de Drive los que tengan deleted:true
 * Devuelve el mismo mapa sin los archivos borrados.
 */
function guardarArchivos(email, filesByKey) {
  const folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
  const userFolder = getOrCreateSubfolder(folder, email);
  const result = {};

  Object.keys(filesByKey).forEach(key => {
    const list = filesByKey[key] || [];
    const out = [];
    list.forEach(f => {
      // Archivo marcado como eliminado: intentar borrar de Drive
      if (f && f.deleted) {
        if (f.url) borrarArchivoPorUrl_(f.url);
        return; // no se incluye en el resultado
      }
      // Ya estaba subido: conservar como está
      if (f && f.url) { out.push(f); return; }
      // Nunca subido: subir base64 a Drive
      if (!f || !f.base64) { out.push(f); return; }
      try {
        const bytes = Utilities.base64Decode(f.base64);
        const blob = Utilities.newBlob(bytes, f.type || "application/octet-stream", f.name);
        const file = userFolder.createFile(blob);
        out.push({ name: f.name, size: f.size, type: f.type, url: file.getUrl() });
      } catch (err) {
        out.push({ name: f.name, size: f.size, error: "No se pudo subir: " + err.message });
      }
    });
    result[key] = out;
  });
  return result;
}

/**
 * Borra un archivo de Drive a partir de su URL pública
 * (ej. https://drive.google.com/file/d/FILE_ID/view?...).
 * Silencioso: si falla, no interrumpe el guardado.
 */
function borrarArchivoPorUrl_(url){
  try {
    const m = String(url).match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (!m) return;
    DriveApp.getFileById(m[1]).setTrashed(true);
  } catch(e){
    console.warn("No se pudo borrar archivo:", url, e.message);
  }
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