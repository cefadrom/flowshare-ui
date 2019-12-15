// Global
const { src, dest, series, parallel, watch } = require('gulp');
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
const cssPlugins = {
    base: [
        require('postcss-preset-env')({
            stage: 4,
            browsers: 'last 5 versions',
            autoprefixer: {
                grid: true
            }
        }),
        require('postcss-zindex')
    ],
    prod: [
        require('css-mqpacker')({
            sort: true
        }),
        require('cssnano')({
            preset: ['default']
        })
    ]
};
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
// Browser
const browserSync = require('browser-sync').create();
// Variables
const folders = {
    src: 'src',
    dist: 'dist',
    dev: './dev-live'
};
const sources = {
    typescript: `${folders.src}/typescript/**/*.ts`,
    scss: `${folders.src}/scss/**/*.scss`,
    images: [`${folders.src}/img/**/*.png`, `'${folders.src}/img/**/*.jpg`, `${folders.src}/img/**/*.jpeg`, `${folders.src}/img/**/*.ico`, `${folders.src}/img/**/*.svg`],
    html: `${folders.src}/pages/**/*.html`,
    ressources: [`${folders.src}/res/**/*.*`, `${folders.src}/res/**/.*`]
};
const out = {
    javascript: `/javascript`,
    css: `/css`,
    images: `/img`,
    html: '/',
    ressources: '/'
};


// ------------------- PRODUCTION --------------------


function prodCompileTS() {
    return src(sources.typescript)
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
        .pipe(dest(folders.dist + out.javascript));
}


function prodCompileSCSS() {
    return src(sources.scss)
        .pipe(sourcemaps.init())
        .pipe(sass().on('error', sass.logError))
        .pipe(clipEmptyFiles())
        .pipe(postcss([...cssPlugins.base, ...cssPlugins.prod]))
        .pipe(rename({
            extname: '.min.css'
        }))
        .pipe(sourcemaps.write('../css'))
        .pipe(dest(folders.dist + out.css));
}


function minifyImages() {
    return src(sources.images)
        .pipe(image(imageCompression))
        .pipe(dest(folders.dist + out.images));
}


function minifyHTML() {
    return src(sources.html)
        .pipe(htmlmin({
            collapseWhitespace: true,
            quoteCharacter: '"',
            sortAttributes: true,
            sortClassName: true,
            removeComments: true,
            removeAttributeQuotes: true,
            useShortDoctype: true
        }))
        .pipe(dest(folders.dist + out.html));
}


function prodCopyRes() {
    return src(sources.ressources)
        .pipe(dest(folders.dist + out.ressources));
}


function distClean() {
    return src(`${folders.dist}/**/`, { read: false })
        .pipe(clean());
}


// -------------------- DEVLOPMENT --------------------


function devCompileTS() {
    return src(sources.typescript)
        .pipe(sourcemaps.init())
        .pipe(tsProject())
        .pipe(clipEmptyFiles())
        .pipe(babel({
            presets: ['@babel/env']
        }))
        .pipe(rename({
            extname: '.min.js'
        }))
        .pipe(sourcemaps.write('../javascript'))
        .pipe(dest(folders.dev + out.javascript));
}


function devCompileSCSS() {
    return src(sources.scss)
        .pipe(sourcemaps.init())
        .pipe(sass().on('error', sass.logError))
        .pipe(clipEmptyFiles())
        .pipe(postcss(cssPlugins.base))
        .pipe(rename({
            extname: '.min.css'
        }))
        .pipe(sourcemaps.write('../css'))
        .pipe(dest(folders.dev + out.css))
        .pipe(browserSync.stream());
}


function devClean() {
    return src(`${folders.dev}/**/`, { read: false })
        .pipe(clean());
}


function devCopyHTML() {
    return src(sources.html)
        .pipe(dest(folders.dev + out.html));
}


function devCopyImages() {
    return src(sources.images)
        .pipe(dest(folders.dev + out.images));
}


function devCopyRes() {
    return src(sources.ressources)
        .pipe(dest(folders.dev + out.ressources));
}


function devWatch() {
    browserSync.init({
        server: {
            baseDir: folders.dev,
            middleware: function (req, res, next) {
                res.setHeader('Access-Control-Allow-Origin', '*');
                next();
            }
        },
        notify: false,
        startPath: 'home/',
        port: 80,
        cors: true
    });
    watch(sources.scss, devCompileSCSS);
    watch(sources.typescript).on('change', series(devCompileTS, browserSync.reload));
    watch(sources.html).on('change', series(devCopyHTML, browserSync.reload));
    watch(sources.images).on('change', series(devCopyImages, browserSync.reload));
    watch(sources.ressources).on('change', series(devCopyRes, browserSync.reload));
}


// Production
exports.prod_compile_TS = prodCompileTS;
exports.prod_compile_SCSS = prodCompileSCSS;
exports.minify_HTML = minifyHTML;
exports.minify_Images = minifyImages;
exports.prod_copyRessources = prodCopyRes;
exports.prod_build = series(
    distClean,
    parallel(prodCompileTS, prodCompileSCSS, minifyImages, minifyHTML, prodCopyRes)
);
exports.dist_clean = distClean;

// Devlopment
exports.dev_watch = series(
    devClean,
    parallel(devCompileTS, devCompileSCSS, devCopyHTML, devCopyImages, devCopyRes),
    devWatch
);
