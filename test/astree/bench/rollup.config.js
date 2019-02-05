
module.exports = {
    entry: 'test.js',
    targets: [
        {dest: 'bundle.js', format: 'iife'}
    ],
    globals: {
        $: "jquery"
	},
    external : ["$"],
    plugins: [
        require('rollup-plugin-commonjs')({
            namedExports: {
                "node_modules/jquery/dist/jquery.js": ["jquery", "$"]
            }
        }),
        require('rollup-plugin-node-resolve')(),
        require('rollup-plugin-uglify-es')()
    ],
    sourceMap: 'inline'
};
