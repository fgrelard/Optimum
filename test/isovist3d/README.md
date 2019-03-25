Isovist 3D: [live example](https://openlayers.org/ol-cesium/examples/).

# Install

```bash
npm i
```

Going further
-------------

See the [examples](https://openlayers.org/ol-cesium/examples/).

If you are new to Cesium, you should also check the [Cesium tutorials](https://cesiumjs.org/tutorials).


Running the examples in debug mode
----------------------------------

This is useful for contributing to Ol-Cesium, because it loads the
source files instead of a minified build:

    $ make serve

will make the distribution examples available at http://localhost:3000/examples

Running the unminified version of Cesium
----------------------------------------

Passing the parameter `?mode=dev` to an example will load the debug version of
Cesium instead of the minified one. This is helpful when something breaks inside
Cesium. In distribution mode, an unminified version of OpenLayers and Ol-Cesium is
also loaded.

