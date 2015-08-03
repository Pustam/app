var os = require('os');

var AppConfig = {
	basePath: __dirname + '/',
	htmlPath: __dirname + '/html/',
	rendererPath: __dirname + '/src/renderer/',
	browserSrcPath: __dirname + '/src/browser/',
	helperPath : __dirname + '/src/helpers/',
	srcPath : __dirname + '/src/',
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
	}
};

AppConfig.partialsPath = AppConfig.htmlPath + 'partials/';
AppConfig.dialogsPath = AppConfig.htmlPath + 'dialogs/';
AppConfig.logPath = AppConfig.basePath + 'logs/';
AppConfig.settingsPath = AppConfig.basePath + 'settings.json';

AppConfig.EOL = os.EOL;

module.exports = AppConfig;
