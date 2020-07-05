module.exports = {
    entry: { index: './app.js' },
    devtool: 'source-map',
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
                use: [ 'babel-loader', ],
            }, {
                test: /\.html$/,
                exclude: /(node_modules)/,
                use: [ 'html-loader', ],
            }, {
                test: /\.css$/,
                exclude: /(node_modules)/,
                use: [ 'style-loader', 'css-loader', ],
            },
        ]
    }
};
