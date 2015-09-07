module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    jsbeautifier: {
      files: [__dirname + '/src/*.js',
        __dirname + '/src/browser/*.js',
        __dirname + '/src/common/*.js',
        __dirname + '/src/browser/about/*.js',
        __dirname + '/src/browser/help/*.js',
        __dirname + '/src/browser/notes/*.js',
        __dirname + '/src/browser/notebooks/*.js',
        __dirname + '/src/browser/app/*.js',
      ],
      options: {
        js: {
          indentChar: ' ',
          indentSize: 2,
        },
        html : {
          wrapLineLength: 90
        }
      }
    }
  });

  // Load the plugin that provides the "uglify" task.
  grunt.loadNpmTasks("grunt-jsbeautifier");

  // Default task(s).
  grunt.registerTask('default', ['jsbeautifier']);
};
