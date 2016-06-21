module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    jsbeautifier: {
      files: [path.join(__dirname, 'src', '*.js'),
        path.join(__dirname, 'src', 'browser', '*.js'),
        path.join(__dirname, 'src', 'common', '*.js'),
        path.join(__dirname, 'src', 'browser', 'about', '*.js'),
        path.join(__dirname, 'src', 'browser', 'help', '*.js'),
        path.join(__dirname, 'src', 'browser', 'notes', '*.js'),
        path.join(__dirname, 'src', 'browser', 'notebooks', '*.js'),
        path.join(__dirname, 'src', 'browser', 'app', '*.js')
      ],
      options: {
        js: {
          indentChar: ' ',
          indentSize: 2
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
