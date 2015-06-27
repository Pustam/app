'use strict';

var App = require('app'); // Module to control application life.
var BrowserWindow = require('browser-window'); // Module to create native browser window.
var AppConfig = require(__dirname + '/../../config.js');
var NotesApp = require(AppConfig.srcPath + 'notes-app.js');

// Report crashes to our server.
require('crash-reporter').start();

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the javascript object is GCed.
var mainWindow = null;

// Quit when all windows are closed.
App.on('window-all-closed', function() {
  if (process.platform !== 'darwin') {
    App.quit();
  }
});

// This method will be called when Electron has done everything
// initialization and ready for creating browser windows.
App.on('ready', function() {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600
  });

  // Open the dev tools.
  if (AppConfig.isDevelopment) {
    mainWindow.openDevTools();
  }

  // and load the index.html of the app.
  mainWindow.loadUrl('file://' + AppConfig.htmlPath + 'loading.html');
  NotesApp.init(function(err) {
    if (err) {
      // TODO : Load error html.
      return;
    }
    mainWindow.loadUrl('file://' + AppConfig.htmlPath + 'index.html');
  });

  // Emitted when the window is closed.
  mainWindow.on('closed', function() {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null;
  });
});
