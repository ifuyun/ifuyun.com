const gulp = require('gulp');
const path = require('path');

gulp.task('common:copy-styles', function () {
  return gulp.src([path.join(__dirname, '**/*.less')]).pipe(gulp.dest(path.join(__dirname, '../../dist/common')));
});

gulp.task('common:build', gulp.series('common:copy-styles'));
