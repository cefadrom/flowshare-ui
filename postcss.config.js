const postcssPresetEnv = require('postcss-preset-env');

module.exports = {
    syntax: 'postcss-scss',
    from: 'dist/css/*.css',
    plugins: {
        postcssPresetEnv
    }
};
