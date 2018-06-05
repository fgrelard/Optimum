module.exports = {
    entry: 'js/main.js',
    targets: [
        {dest: 'bundle.js', format: 'iife'}
    ],
    globals: {
		jquery: "jQuery"
	},
    plugins: [
        require('rollup-plugin-node-resolve')(),
        require('rollup-plugin-commonjs')(),
        require('rollup-plugin-uglify-es')()
    ],
    sourceMap: 'inline'
};
