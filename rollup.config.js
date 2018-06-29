module.exports = {
    entry: 'js/main.js',
    targets: [
        {dest: 'bundle.js', format: 'iife', useStrict:false}
    ],
    globals: {
        jquery: "jquery",
        $: "jquery"
	},
    plugins: [
        require('rollup-plugin-commonjs')(),
        require('rollup-plugin-node-resolve')({module:true}),
        require('rollup-plugin-uglify-es')(),
        require('rollup-plugin-inject')({
            include: "node_modules/ol-ext/**",
            $: 'jquery'
        })
    ],
    sourceMap: 'inline'
};
