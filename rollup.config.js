module.exports = {
    entry: 'js/testol.js',
    targets: [
        {dest: 'bundle.js', format: 'iife'}
    ],
    plugins: [
        require('rollup-plugin-node-resolve')(),
        require('rollup-plugin-commonjs')(),
        require('rollup-plugin-uglify')()
    ],
    sourceMap: 'inline'
};
