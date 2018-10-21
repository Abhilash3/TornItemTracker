var path = require('path');

module.exports = {
    entry: { index: './app.js' },
    devtool: 'sourcemaps',
    cache: true,
    output: {
        path: __dirname,
        filename: './build/[name].js'
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /(node_modules)/,
                use: {
                    loader: 'babel-loader',
                }
            }, {
                test: /\.html$/,
                exclude: /(node_modules)/,
                use: {
                    loader: 'html-loader',
                }
            }
        ]
    }
};
