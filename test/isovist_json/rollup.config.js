module.exports = {
    entry: 'js/main.js',
    targets: [
        {dest: 'bundle.js', format: 'iife'}
    ],
    globals: {
        jquery: "jquery",
        $: "jquery"
    },
    plugins: [

        require('rollup-plugin-node-resolve')({module:true, preferBuiltins:true}),
        require('rollup-plugin-commonjs')(),
        require('rollup-plugin-node-globals')(),
        require('rollup-plugin-node-builtins')(),

        require('rollup-plugin-uglify-es')()
    ],
    sourceMap: 'inline'
};
