import cjs from 'rollup-plugin-commonjs';
import node from 'rollup-plugin-node-resolve';
import uglify from 'rollup-plugin-uglify-es';
//import inject from 'rollup-plugin-inject';
var $ = jQuery;
export default {
    entry: 'js/main.js',
    targets: [
        {dest: 'bundle.js', format: 'iife', useStrict:false}
    ],
    globals: {
        jquery: "jquery",
        $: "jquery"
	},
    plugins: [
        node({module:true}),
        cjs(),
        uglify()//,
        // inject({
        //     include: "node_modules/ol-ext/**",
        //     modules: {
        //         $: 'jquery'
        //     }
        // })
    ],
    sourceMap: 'inline'
};
