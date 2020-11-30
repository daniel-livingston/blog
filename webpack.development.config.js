const path = require("path");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

module.exports = () => {
	return {
		mode: "development",
		entry: {
			index: { import: "./src/frontend/index.tsx" },
		},
		output: {
			path: path.resolve(__dirname, "dist"),
			filename: "[name].bundle.js",
		},
		plugins: [new MiniCssExtractPlugin()],
		module: {
			rules: [
				{
					test: /\.tsx?$/,
					exclude: /node_modules/,
					use: ["babel-loader"],
				},
				{
					test: /\.s(a|c)ss$/,
					use: [MiniCssExtractPlugin.loader, "css-loader", "sass-loader"],
				},
			],
		},
		resolve: {
			extensions: [".ts", ".tsx", ".js", ".jsx"],
		},
		devtool: "eval-cheap-module-source-map",
	};
};
