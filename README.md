# Projet Optimum

Code for the client-side of the [Optimum Project](http://liris.univ-lyon2.fr/optimum/index.php/geolocalisation/)

## Getting Started

In order to be used properly, the Optimum server must be running (currently on Eidolon). See the [Optimum-server](https://github.com/fgrelard/Optimum-server) repository for more information.

Install the dependencies :
```
npm install
```

Compile the Javascript ES modules into a single bundle file, thanks to [`rollup`](https://github.com/rollup/rollup) :
```
npm run start
```

Then, open the `index.html` file in your browser. 


## Examples

Minimal examples can be found in the `test` directory. It contains code for the dual R-tree (`astree`), the isovist in 2D and 3D (`isovist` and `isovist3d`) as well as the heatmap (`polygonintersection`).



