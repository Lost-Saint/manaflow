import gulp from 'gulp';
import zip from 'gulp-zip';
import gulpClean from 'gulp-clean';

function cleanDist() {
  return gulp.src('dist', { read: false, allowEmpty: true }).pipe(gulpClean({ force: true }));
}

function prepareSrc() {
  return gulp
    .src(['src/**/*', 'node_modules/webextension-polyfill/dist/browser-polyfill.min.js'])
    .pipe(gulp.dest('dist'));
}

function prepareIcons() {
  return gulp.src(['assets/**/*']).pipe(gulp.dest('dist/assets'));
}

function pack() {
  return gulp.src(['dist/**/*']).pipe(zip('ff_ext_fps_meter.zip')).pipe(gulp.dest('dist'));
}

export const clean = cleanDist;
export const prepare = gulp.series(cleanDist, prepareSrc, prepareIcons);
export const build = gulp.series(prepare, pack);
export default build;
