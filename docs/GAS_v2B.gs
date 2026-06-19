/**
 * Google Apps Script — Capturadora Hauser v2B
 * Ranking compartido + sincronización de capturas
 *
 * INSTRUCCIONES DE DESPLIEGUE:
 * 1. Abre script.google.com → Nuevo proyecto → pega este código.
 * 2. Menú Implementar → Nueva implementación → Tipo: Aplicación web.
 * 3. Ejecutar como: Yo (tu cuenta Google).
 * 4. Quién tiene acceso: Cualquier persona.
 * 5. Copia la URL de implementación → pégala en Configuración de la app (campo Endpoint).
 * 6. Al redeployar siempre, elige "Nueva versión" (no editar la existente).
 *
 * HOJA REQUERIDA: "Capturas" (se crea sola la primera vez).
 * Columnas: id | fecha | asesorId | asesorNombre | estrellas | elapsed | tipo | oper | zona | estatus
 */

var SHEET_NAME = 'Capturas';
var HEADERS = ['id','fecha','asesorId','asesorNombre','estrellas','elapsed','tipo','oper','zona','estatus'];

function getSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(SHEET_NAME);
    sh.appendRow(HEADERS);
    sh.setFrozenRows(1);
  }
  return sh;
}

function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents);
    var action = body.action;
    var payload = body.payload;

    if (action === 'ping') {
      return jsonOut({ok:true, msg:'Hauser GAS v2B online'});
    }

    if (action === 'saveCapture') {
      return handleSaveCapture_(payload);
    }

    if (action === 'bulkSync') {
      var items = payload && payload.items ? payload.items : [];
      items.forEach(function(item){ handleSaveCapture_(item, true); });
      return jsonOut({ok:true, saved:items.length});
    }

    if (action === 'getRanking') {
      return handleGetRanking_();
    }

    return jsonOut({ok:false, error:'Acción desconocida: ' + action});
  } catch(err) {
    return jsonOut({ok:false, error:err.toString()});
  }
}

function doGet(e) {
  var action = e.parameter && e.parameter.action;
  if (action === 'getRanking') return handleGetRanking_();
  return jsonOut({ok:true, msg:'Hauser GAS v2B — usa POST para enviar capturas.'});
}

function handleSaveCapture_(rec, skipDupe) {
  if (!rec || !rec.id) return jsonOut({ok:false, error:'Registro sin id'});
  var sh = getSheet_();

  if (skipDupe) {
    var ids = sh.getRange(2, 1, Math.max(sh.getLastRow()-1,1), 1).getValues().map(function(r){return r[0];});
    if (ids.indexOf(rec.id) !== -1) return jsonOut({ok:true, skipped:true});
  }

  sh.appendRow([
    rec.id || '',
    rec.fecha || new Date().toISOString(),
    rec.asesorId || '',
    rec.asesorNombre || 'S/I',
    rec.estrellas || 0,
    rec.elapsed || 0,
    rec.tipo || '',
    rec.oper || '',
    rec.zona || '',
    rec.estatus || ''
  ]);
  return jsonOut({ok:true});
}

function handleGetRanking_() {
  var sh = getSheet_();
  var nRows = sh.getLastRow();
  if (nRows < 2) return jsonOut({ok:true, capturas:[]});

  var data = sh.getRange(2, 1, nRows-1, HEADERS.length).getValues();
  var capturas = data.map(function(row) {
    var obj = {};
    HEADERS.forEach(function(h,i){ obj[h] = row[i]; });
    return obj;
  });
  return jsonOut({ok:true, capturas:capturas});
}

function jsonOut(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
