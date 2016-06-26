'use strict';

var os = require('os');
var _i18n = require('i18n');
var path = require('path');

var AppConfig = {
	basePath: path.join(__dirname, path.sep) + path.sep,
	htmlPath: path.join(__dirname, 'src', 'html') + path.sep,
	rendererPath: path.join(__dirname, 'src', 'renderer') + path.sep,
	browserSrcPath: path.join(__dirname, 'src', 'browser') + path.sep,
	commonsPath : path.join(__dirname, 'src', 'common') + path.sep,
	srcPath : path.join(__dirname, 'src') + path.sep,
	dialogsPath : __dirname,
	partialsPath : __dirname,
	isDevelopment: false,
	database: {
		path: path.join(__dirname, 'db') + path.sep,
		notes: 'notes.db',
		notebooks: 'notebooks.db'
	},
	i18nConfiguration: {
		locales: ['en'],
		directory: path.join(__dirname, 'locales'),
		defaultLocale: 'en',
		objectNotation: true
	},
	defaultNotebook : {
		'name' : 'Daily',
		'type' : 'task',
		'shrinkNotes' : false,
		'createdOn' : null,
		'modifiedOn' : null
	},
	dateFormat : 'DD, dd MM, yyyy',
	getNotebookContentID : function(notebookDbID) {
		return 'notebook_' + notebookDbID;
	},
	getNotebookHeaderID : function(notebookDbID) {
		return 'notebookHeader_' + notebookDbID;
	},
	getDatepickerConfig : function() {
		return {
			todayBtn: true,
			orientation: 'top',
			todayHighlight: true,
			autoclose: true,
			format: AppConfig.dateFormat
		};
	},
	regexForTime: /\$\d{1,3}(\.\d{1,3})? \w{1,4}\$/,
	maxPastDate: 60
};

AppConfig.partialsPath = path.join(AppConfig.htmlPath, 'partials') + path.sep;
AppConfig.dialogsPath = path.join(AppConfig.htmlPath, 'dialogs') + path.sep;
AppConfig.logPath = path.join(AppConfig.basePath, 'logs') + path.sep;
AppConfig.settingsPath = path.join(AppConfig.basePath, 'settings.json');

AppConfig.EOL = os.EOL;

module.exports = AppConfig;
