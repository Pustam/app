'use strict';

var _fs = require('fs');

// Custom
var _appConfig = require(__dirname + '/../../config.js');

var LOG_DIVIDER = _appConfig.EOL + "------------------------------------------------------------------------------";
var END_OF_LOG_DIVIDER = "xxx~~~~~~~~~~~~~~xxx~~~~~~~~~~~~~~~xxx~~~~~~~~~~~~~~~~xxx~~~~~~~~~~~~~~~~xxx" + _appConfig.EOL;
var APP_STATUS_BAR = null;

var AppError = function(err, customMsg, log, overrideMsg) {
  if (!err) {
    throw new ReferenceError('Invalid error object.');
  }

  // If log is anything other than false,
  // set it to true.
  log = log !== false ? true : false;

  if (err instanceof Error) {
    this.message = customMsg;
    this.error = err;
    if (log) {
      this.log();
    }
    return this;
  } else if (err instanceof AppError) {
    if (overrideMsg) {
      err.message = customMsg;
    }
    return err;
  } else {
    throw new ReferenceError('Invalid error object.');
  }
};

AppError.prototype.display = function() {
  if (!APP_STATUS_BAR) {
    APP_STATUS_BAR = document.getElementById('appStatusbar');
  }
  // TODO Write code to display error.
};

AppError.prototype.log = function() {
  var errorString = "Message : " + this.message + _appConfig.EOL + new Date().toString() + LOG_DIVIDER;
  errorString += this.error.stack + _appConfig.EOL;
  errorString += END_OF_LOG_DIVIDER;
  var that = this;

  if (_appConfig.isDevelopment) {
    showAlert(_appConfig.EOL + errorString, 'You moron, fix this error!');
  }

  _fs.appendFile(_appConfig.logPath + 'error.log', errorString, function(err) {
    if (err) {
      // This inline string is intentional, dont include i18n.
      errorString = 'Things seem to be going really really wrong. ' +
        'We just encountered an error while processing an error!!! Error inside error! KABOOM!' +
        _appConfig.EOL + LOG_DIVIDER + errorString;
      showAlert(errorString, 'Unhandled Error');
    }
    that.logged = true;
  });
};

function showAlert(msg, title) {
  if (typeof window === 'undefined') {
    return;
  }
  window.alert(msg, title);
}

module.exports = AppError;
