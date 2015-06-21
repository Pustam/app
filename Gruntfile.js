module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    jsbeautifier: {
      files: [__dirname + '/src/*.js',
        __dirname + '/src/browser/*.js',
        __dirname + '/src/helpers/*.js',
        __dirname + '/src/renderer/*.js'
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