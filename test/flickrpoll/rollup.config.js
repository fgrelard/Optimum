module.exports = {
    entry: 'js/index.js',
    targets: [
        {dest: 'bundle.js', format: 'iife'}
    ],
    plugins: [
        require('rollup-plugin-node-resolve')(),
        require('rollup-plugin-commonjs')(),
//        require('rollup-plugin-node-globals')(),
        require('rollup-plugin-uglify-es')()
    ],
    sourceMap: 'inline'
};