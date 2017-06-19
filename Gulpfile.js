var gulp = require('gulp');
var sass = require('gulp-sass');

const SASS_SRC = 'app/css/sass/**/*.scss';
const CSS_SRC = 'app/css/';

gulp.task('styles', function () {
  gulp.src(SASS_SRC)
    .pipe(sass().on('error', sass.logError))
    .pipe(gulp.dest(CSS_SRC));
});

// Watch task
gulp.task('default', function () {
  gulp.watch(SASS_SRC, ['styles']);
});