const gulp = require('gulp');
const gzip = require('gulp-gzip');

require('./projects/common/gulpfile');

gulp.task('gzip:www', function () {
  return gulp
    .src(['./dist/www/browser/**/*.*', '!./dist/www/browser/**/*.gz'])
    .pipe(gzip())
    .pipe(gulp.dest('./dist/www/browser'));
});
gulp.task('gzip:blog', function () {
  return gulp
    .src(['./dist/blog/browser/**/*.*', '!./dist/blog/browser/**/*.gz'])
    .pipe(gzip())
    .pipe(gulp.dest('./dist/blog/browser'));
});
gulp.task('gzip:wallpaper', function () {
  return gulp
    .src(['./dist/wallpaper/browser/**/*.*', '!./dist/wallpaper/browser/**/*.gz'])
    .pipe(gzip())
    .pipe(gulp.dest('./dist/wallpaper/browser'));
});
gulp.task('gzip:jigsaw', function () {
  return gulp
    .src(['./dist/jigsaw/browser/**/*.*', '!./dist/jigsaw/browser/**/*.gz'])
    .pipe(gzip())
    .pipe(gulp.dest('./dist/jigsaw/browser'));
});
gulp.task('gzip:game', function () {
  return gulp
    .src(['./dist/game/browser/**/*.*', '!./dist/game/browser/**/*.gz'])
    .pipe(gzip())
    .pipe(gulp.dest('./dist/game/browser'));
});

gulp.task('gzip:all', gulp.series('gzip:www', 'gzip:blog', 'gzip:wallpaper', 'gzip:jigsaw', 'gzip:game'));
gulp.task('build', gulp.series('gzip:all'));
