const path = require('path');
const flatpickr = require('flatpickr');

const config = require(path.join(__dirname, 'config.js'));

runTranslations(config.i18n);
setupSidebar(config.SIDEBAR);
setupNoteDatepicker(config.NOTE_DATEPICKER);

function runTranslations (i18n) {
  let elTranslate = document.querySelectorAll('[translate]');
  for (let i = 0; i !== elTranslate.length; ++i) {
    let i18nKey = elTranslate[i].getAttribute('translate');
    if (i18nKey) {
      elTranslate[i].innerHTML = i18n.__(i18nKey);
    }
  }
}

function setupSidebar (sidebarConfig) {
  document.getElementById('btnToggleSidebar').addEventListener('click', () => {
    document.getElementsByTagName('body')[0].classList.toggle('sidebar-open');
  });
}

function setupNoteDatepicker (dtConfig) {
  flatpickr(dtConfig.selector, dtConfig);
}