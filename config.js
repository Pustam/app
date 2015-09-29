'use strict';

var os = require('os');
var _i18n = require('i18n');

var AppConfig = {
	basePath: __dirname + '/',
	htmlPath: __dirname + '/src/html/',
	rendererPath: __dirname + '/src/renderer/',
	browserSrcPath: __dirname + '/src/browser/',
	commonsPath : __dirname + '/src/common/',
	srcPath : __dirname + '/src/',
	dialogsPath : __dirname + '',
	partialsPath : __dirname + '',
	isDevelopment: false,
	database: {
		path: __dirname + '/db/',
		notes: 'notes.db',
		notebooks: 'notebooks.db'
	},
	i18nConfiguration: {
		locales: ['en'],
		directory: __dirname + '/locales',
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
	}
};

AppConfig.partialsPath = AppConfig.htmlPath + 'partials/';
AppConfig.dialogsPath = AppConfig.htmlPath + 'dialogs/';
AppConfig.logPath = AppConfig.basePath + 'logs/';
AppConfig.settingsPath = AppConfig.basePath + 'settings.json';

AppConfig.EOL = os.EOL;

module.exports = AppConfig;
