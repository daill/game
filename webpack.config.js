const HtmlWebpackPlugin = require("html-webpack-plugin");
const path = require("path");


module.exports = {
	entry: "./src/main.js",
    mode: "development",
    watch: true,
    module: {
        rules: [
            {
                test: /\.(png|jpg|jpeg)$/i,
                type: "asset/resource",
            },
            {
                // Embed your WGSL files as strings
                test: /\.(wgsl|gltf|bin)$/i,
                type: "asset/source",
            }, 
        ]
    },
    plugins: [new HtmlWebpackPlugin({
        template: "./game.html",
    })],
};
