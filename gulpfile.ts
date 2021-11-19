import * as esbuild from 'esbuild';

import {exec} from 'child_process';
import gulp from 'gulp';

const ENTRIES = {
  js: {
    // File location for tsc output.  Based on tsconfig output settings.
    tsc_out: ['./dist/ui/page-builder-ui.js'],
    out: './dist/ui/page-builder-ui.min.js',
    watch: ['./src/**/*.ts'],
  },
};

/**
 * esBuild does not do type checks and can build with type errors so we first run
 * `tsc` and generate a JS file.  esBuild is then run on the outputted JS file.
 *
 * The entry point of tsc compilation is configured in tsconfig `include`.
 */
const runEsBuild = async (prod: boolean) => {
  return new Promise<void>((resolve, reject) => {
    exec('tsc', async (error, stderr) => {
      if (stderr) {
        console.error('Typescript errors');
        console.error(stderr);
        reject();
      } else {
        await esbuild.build({
          entryPoints: ENTRIES.js.tsc_out,
          outfile: ENTRIES.js.out,
          bundle: true,
          platform: 'browser',
          minify: prod,
        });
        resolve();
      }
    });
  });
};

gulp.task('build:js', async () => {
  await runEsBuild(true);
});

gulp.task('watch:js', async cb => {
  await runEsBuild(false);
  gulp.watch(ENTRIES.js.watch, async () => {
    await runEsBuild(false);
    cb();
  });
});

gulp.task('watch', gulp.parallel('watch:js'));
gulp.task('build', gulp.parallel('build:js'));
gulp.task('default', gulp.series('watch'));
