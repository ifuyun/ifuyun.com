const gulp = require('gulp');
const gzip = require('gulp-gzip');

gulp.task('gzip', function () {
  return gulp.src(['./dist/browser/**/*.*', '!./dist/browser/**/*.gz']).pipe(gzip()).pipe(gulp.dest('./dist/browser'));
});

gulp.task('build', gulp.series('gzip'));
