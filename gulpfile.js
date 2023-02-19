const fs = require('fs');
const gulp = require('gulp');
const gzip = require('gulp-gzip');
const replace = require('gulp-replace');

gulp.task('replace', function () {
  const env = fs.readFileSync('./src/environments/environment.prod.ts');
  const host = (/host:\s*'([^']+)'/i.exec(env)[1] || '').replace(/\/$/i, '');
  return gulp.src('./dist/browser/index.html')
    .pipe(replace(/(<link [^>]*href=")\/?([^"]+)("[^>]*>)/gi, (matched, p1, p2, p3) => {
      if (/^https?:\/\//i.test(p2) || /.css$/i.test(p2)) {
        return p1 + p2 + p3;
      }
      return `${p1}${host}/${p2}${p3}`;
    }))
    .pipe(gulp.dest('./dist/browser'));
});

gulp.task('compress', function () {
  return gulp.src(['./dist/browser/**/*.*', '!./dist/browser/**/*.gz'])
    .pipe(gzip())
    .pipe(gulp.dest('./dist/browser'));
});

gulp.task('build', gulp.series('compress'));
