'use strict';

var fs = require('fs');
var AppConfig = require(__dirname + '/../../config.js');

var LOG_DIVIDER = AppConfig.EOL + "------------------------------------------------------------------------------";
var END_OF_LOG_DIVIDER = "xxx~~~~~~~~~~~~~~xxx~~~~~~~~~~~~~~~xxx~~~~~~~~~~~~~~~~xxx~~~~~~~~~~~~~~~~xxx" + AppConfig.EOL;
var APP_STATUS_BAR = null;

var AppError = function(err, customMsg, log, overrideMsg) {
  if (!err) {
    throw new ReferenceError('Invalid error object.');
  }
  if (log !== false) {
    log = true;
  }
  var errObj = null;
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
  var errorString = "Message : " + this.message + AppConfig.EOL + new Date().toString() + LOG_DIVIDER;
  errorString +=  this.error.stack + AppConfig.EOL;
  errorString += END_OF_LOG_DIVIDER;
  var that = this;
  if(AppConfig.isDevelopment) {
    window.alert(AppConfig.EOL + errorString, 'You moron, fix this error!');
  }
  fs.appendFile(AppConfig.logPath + 'error.log', errorString, function(err) {
    if(err) {
      // This inline string is intentional, dont include i18n.
      errorString = 'Things seem to be going really really wrong. ' +
        'We just encountered an error while processing an error!!! Error inside error! KABOOM!' +
        AppConfig.EOL + LOG_DIVIDER + errorString;
      window.alert(errorString, 'Unhandled Error');
    }
    that.logged = true;
  });
};

module.exports = AppError;
