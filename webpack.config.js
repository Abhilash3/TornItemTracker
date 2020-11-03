const UglifyJsPlugin = require('uglifyjs-webpack-plugin');

module.exports = {
    entry: {index: './public/js/index.js'},
    devtool: 'source-map',
    cache: true,
    optimization: {minimizer: [new UglifyJsPlugin()]},
    output: {
        path: __dirname,
        filename: './public/build/[name].js'
    },
    module: {
        rules: [{
            test: /\.js$/,
            exclude: /(node_modules)/,
            use: ['babel-loader'],
        }, {
            test: /\.html$/,
            exclude: /(node_modules)/,
            use: ['html-loader'],
        }, {
            test: /\.css$/,
            exclude: /(node_modules)/,
            use: ['style-loader', 'css-loader'],
        }]
    },
};
