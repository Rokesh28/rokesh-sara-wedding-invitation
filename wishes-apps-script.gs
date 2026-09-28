const SPREADSHEET_ID = '1eTme-13t-JilixKxIlgXKGdK6IZzqbk5pTin-F3xoJ4';

/**
 * Public guestbook endpoint for the static wedding invitation.
 * Bind this script to a new Google Sheet, then deploy as a web app:
 * Execute as: Me | Who has access: Anyone
 */
function doGet(e) {
  const callback = String((e && e.parameter && e.parameter.callback) || '');
  if (!/^[A-Za-z_$][\w$]{0,100}$/.test(callback)) {
    return ContentService.createTextOutput('Invalid callback').setMimeType(ContentService.MimeType.TEXT);
  }

  let result;
  try {
    const params = (e && e.parameter) || {};
    if (params.action === 'add') {
      result = addWish_(params);
    } else {
      result = { ok: true, wishes: listWishes_() };
    }
  } catch (error) {
    result = { ok: false, error: 'We could not save or load wishes right now. Please try again.' };
  }

  const json = JSON.stringify(result).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
  return ContentService.createTextOutput(callback + '(' + json + ');').setMimeType(ContentService.MimeType.JAVASCRIPT);
}

function getWishesSheet_() {
  if (SPREADSHEET_ID === 'PASTE_YOUR_GOOGLE_SHEET_ID_HERE') throw new Error('Add your Google Sheet ID first.');
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = spreadsheet.getSheetByName('Wishes');
  if (!sheet) sheet = spreadsheet.insertSheet('Wishes');
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['Guest name', 'Wish', 'Received at']);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function addWish_(params) {
  // Quiet honeypot field helps screen out simple automated form spam.
  if (String(params.website || '').trim()) return { ok: true };
  const name = cleanText_(params.name, 60);
  const message = cleanText_(params.message, 500);
  if (!name || !message) return { ok: false, error: 'Please add your name and a short wish.' };

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    getWishesSheet_().appendRow([safeCell_(name), safeCell_(message), new Date()]);
  } finally {
    lock.releaseLock();
  }
  return { ok: true };
}

function listWishes_() {
  const sheet = getWishesSheet_();
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  const start = Math.max(2, lastRow - 79);
  return sheet.getRange(start, 1, lastRow - start + 1, 3).getDisplayValues().reverse()
    .filter((row) => row[0] && row[1])
    .map((row) => ({ name: row[0], message: row[1], date: row[2] }));
}

function cleanText_(value, maxLength) {
  return String(value || '').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, maxLength);
}

function safeCell_(value) {
  return /^[=+@-]/.test(value) ? "'" + value : value;
}
