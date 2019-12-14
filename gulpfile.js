// Global
const { src, dest, series, parallel } = require('gulp');
const sourcemaps = require('gulp-sourcemaps');
const clean = require('gulp-clean');
const clipEmptyFiles = require('gulp-clip-empty-files');
// Javascript
const babel = require('gulp-babel');
const uglify = require('gulp-uglify');
const rename = require('gulp-rename');
// Typescript
const typescript = require('gulp-typescript');
const tsProject = typescript.createProject('tsconfig.json');
// CSS
const sass = require('gulp-sass');
const postcss = require('gulp-postcss');
// Postcss plugins
const cssPlugins = [
    require('postcss-preset-env')({
        stage: 4,
        browsers: 'last 5 versions',
        autoprefixer: {
            grid: true
        }
    }),
    require('css-mqpacker')({
        sort: true
    }),
    require('postcss-zindex'),
    require('cssnano')({
        preset: ['default']
    })
];
// Images
const image = require('gulp-image');
// Images compression settings
const imageCompression = {
    pngquant: true,
    optipng: true,
    zopflipng: true,
    jpegRecompress: false,
    mozjpeg: true,
    guetzli: false,
    gifsicle: true,
    svgo: true,
    concurrent: 10,
    quiet: true // defaults to false
};
// HTML
const htmlmin = require('gulp-htmlmin');


function compileTS() {
    return src('src/typescript/*.ts')
        .pipe(sourcemaps.init())
        .pipe(tsProject())
        .pipe(clipEmptyFiles())
        .pipe(babel({
            presets: ['@babel/env']
        }))
        .pipe(uglify({
            toplevel: true
        }))
        .pipe(rename({
            extname: '.min.js'
        }))
        .pipe(sourcemaps.write('../javascript'))
        .pipe(
            dest('dist/javascript')
        );
}

function compileSCSS() {
    return src('src/scss/*.scss')
        .pipe(sourcemaps.init())
        .pipe(sass())
        .pipe(clipEmptyFiles())
        .pipe(postcss(cssPlugins))
        .pipe(rename({
            extname: '.min.css'
        }))
        .pipe(sourcemaps.write('../css'))
        .pipe(dest('dist/css'));
}

function minifyImages() {
    return src(['src/img/**/*.png', 'src/img/**/*.jpg', 'src/img/**/*.jpeg', 'src/img/**/*.ico', 'src/img/**/*.svg'])
        .pipe(image(imageCompression))
        .pipe(dest('dist/img'));
}

function minifyHTML() {
    return src('src/pages/**/*.html')
        .pipe(htmlmin({
            collapseWhitespace: true,
            quoteCharacter: '"',
            sortAttributes: true,
            sortClassName: true,
            removeComments: true,
            removeAttributeQuotes: true,
            useShortDoctype: true
        }))
        .pipe(dest('dist/'));
}

function cleanTask() {
    return src('dist/**/', { read: false })
        .pipe(clean());
}

function copyRessources() {
    return src(['src/res/**/*.*', 'src/res/**/.*'])
        .pipe(dest('dist/'))
}

// Production
exports.compile_TS = compileTS;
exports.compile_SCSS = compileSCSS;
exports.minify_HTML = minifyHTML;
exports.minify_Images = minifyImages;
exports.copyRessources = copyRessources;
exports.build = series(
    cleanTask,
    parallel(compileTS, compileSCSS, minifyImages, minifyHTML, copyRessources)
);
exports.clean = cleanTask;
