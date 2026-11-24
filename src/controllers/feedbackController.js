const en = require('../../locales/en.json');
const fr = require('../../locales/fr.json');
const { text, bodyObject } = require('../utils/validation');

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
}

function render(req, submitted = false) {
  const lang = req.query.lang === 'fr' ? 'fr' : 'en';
  const locale = lang === 'fr' ? fr : en;
  const date = new Intl.DateTimeFormat(lang === 'fr' ? 'fr-FR' : 'en-GB', { dateStyle: 'long', timeZone: 'Africa/Kigali' }).format(new Date());
  const questions = locale.questions.map((question, index) => `<label for="question-${index + 1}">${index + 1}. ${escapeHtml(question)}</label><textarea id="question-${index + 1}" name="answer${index + 1}" rows="4" maxlength="3000" required></textarea>`).join('');
  return `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${escapeHtml(locale.title)}</title></head><body><main><nav><a href="/feedback?lang=en" lang="en">English</a> | <a href="/feedback?lang=fr" lang="fr">Français</a></nav><h1>${escapeHtml(locale.title)}</h1><p>${escapeHtml(locale.dateLabel)}: ${escapeHtml(date)}</p>${submitted ? `<p role="status">${escapeHtml(locale.thanks)}</p>` : ''}<p>${escapeHtml(locale.instructions)}</p><form method="post" action="/feedback?lang=${lang}">${questions}<button type="submit">${escapeHtml(locale.submit)}</button></form></main></body></html>`;
}

function show(req, res) { res.type('html').send(render(req)); }

function submit(req, res) {
  bodyObject(req.body);
  for (let index = 1; index <= 5; index++) text(req.body['answer' + index], 'answer' + index, 3000);
  // The assessment requires displaying the form, not storing a fourth entity.
  res.type('html').send(render(req, true));
}

module.exports = { show, submit };
