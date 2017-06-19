'use strict';

const os = require('os');
const path = require('path');

const i18n = require('i18n');

let appConfig = {
  BASE: path.join(__dirname, '..', path.sep) + path.sep,
  HTML: path.join(__dirname, 'html') + path.sep,
  IS_DEVELOPMENT: true
};

appConfig.EOL = os.EOL;

// Configure and add i18n
i18n.configure({
  locales: ['en', 'de'],
  directory: path.join(__dirname, '/lang'),
  defaultLocale: 'en',
});

appConfig.i18n = i18n;

// sidebar configuration
appConfig.SIDEBAR = {
  panel: 'mainContainer',
  menu: 'notebookList',
  padding: 330,
  tolerance: 70
};

appConfig.NOTE_DATEPICKER = {
  wrap: true,
  selector: '#dtNotepicker',
  altInput: true
};

module.exports = appConfig;