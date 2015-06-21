'use strict';

var AppError = function(err, customMsg, log) {
  if (err instanceof Error) {
    console.log(err);
  } else {
    return false;
  }
};

module.exports = AppError;
