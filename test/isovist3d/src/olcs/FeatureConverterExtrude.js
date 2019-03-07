import FeatureConverter from './FeatureConverter';
import olcsCore from './core.js';
import olcsUtil, {getUid, isGroundPolylinePrimitiveSupported} from './util.js';
export default class FeatureConverterExtrude extends FeatureConverter {
    constructor(scene) {
        super(scene);
    }

    olPolygonGeometryToCesium(layer, feature, olGeometry, projection, olStyle) {
    olGeometry = olcsCore.olGeometryCloneTo4326(olGeometry, projection);
    console.assert(olGeometry.getType() == 'Polygon');

    const heightReference = this.getHeightReference(layer, feature, olGeometry);

    let fillGeometry, outlineGeometry, outlinePrimitive;
    if ((olGeometry.getCoordinates()[0].length == 5) &&
        (feature.getGeometry().get('olcs.polygon_kind') === 'rectangle')) {
      // Create a rectangle according to the longitude and latitude curves
      const coordinates = olGeometry.getCoordinates()[0];
      // Extract the West, South, East, North coordinates
      const extent = boundingExtent(coordinates);
      const rectangle = Cesium.Rectangle.fromDegrees(extent[0], extent[1],
          extent[2], extent[3]);

      // Extract the average height of the vertices
      let maxHeight = 0.0;
      if (coordinates[0].length == 3) {
        for (let c = 0; c < coordinates.length; c++) {
          maxHeight = Math.max(maxHeight, coordinates[c][2]);
        }
      }

      // Render the cartographic rectangle
      fillGeometry = new Cesium.RectangleGeometry({
        ellipsoid: Cesium.Ellipsoid.WGS84,
        rectangle,
        height: maxHeight
      });

      outlineGeometry = new Cesium.RectangleOutlineGeometry({
        ellipsoid: Cesium.Ellipsoid.WGS84,
        rectangle,
        height: maxHeight
      });
    } else {
      const rings = olGeometry.getLinearRings();
      // always update Cesium externs before adding a property
      const hierarchy = {};
      const polygonHierarchy = hierarchy;
      console.assert(rings.length > 0);

      for (let i = 0; i < rings.length; ++i) {
          const olPos = rings[i].getCoordinates();
        const positions = olcsCore.ol4326CoordinateArrayToCsCartesians(olPos);
        console.assert(positions && positions.length > 0);
        if (i == 0) {
          hierarchy.positions = positions;
        } else {
          if (!hierarchy.holes) {
            hierarchy.holes = [];
          }
          hierarchy.holes.push({
            positions
          });
        }
      }
      fillGeometry = new Cesium.PolygonGeometry({
        // always update Cesium externs before adding a property
          polygonHierarchy: polygonHierarchy,
          extrudedHeight : 0.0,
          heightReference: Cesium.HeightReference.RELATIVE_TO_GROUND,
          extrudedHeightReference : Cesium.HeightReference.CLAMP_TO_GROUND,
          perPositionHeight: true
      });

      // Since Cesium doesn't yet support Polygon outlines on terrain yet (coming soon...?)
      // we don't create an outline geometry if clamped, but instead do the polyline method
      // for each ring. Most of this code should be removeable when Cesium adds
      // support for Polygon outlines on terrain.
      if (heightReference === Cesium.HeightReference.CLAMP_TO_GROUND) {
        const width = this.extractLineWidthFromOlStyle(olStyle);
        if (width > 0) {
          const positions = [hierarchy.positions];
          if (hierarchy.holes) {
            for (let i = 0; i < hierarchy.holes.length; ++i) {
              positions.push(hierarchy.holes[i].positions);
            }
          }
          if (!isGroundPolylinePrimitiveSupported(this.scene)) {
            const color = this.extractColorFromOlStyle(olStyle, true);
            outlinePrimitive = this.createStackedGroundCorridors(layer, feature, width, color, positions);
          } else {
            const appearance = new Cesium.PolylineMaterialAppearance({
              // always update Cesium externs before adding a property
              material: this.olStyleToCesium(feature, olStyle, true)
            });
            const geometryInstances = [];
            for (const linePositions of positions) {
              const polylineGeometry = new Cesium.GroundPolylineGeometry({positions: linePositions, width});
              geometryInstances.push(new Cesium.GeometryInstance({
                geometry: polylineGeometry
              }));
            }
            const primitiveOptions = {
              // always update Cesium externs before adding a property
              appearance,
              geometryInstances
            };
            outlinePrimitive = new Cesium.GroundPolylinePrimitive(primitiveOptions);
            outlinePrimitive.readyPromise.then(() => {
              this.setReferenceForPicking(layer, feature, outlinePrimitive._primitive);
            });
          }
        }
      } else {
        // Actually do the normal polygon thing. This should end the removable
        // section of code described above.
        outlineGeometry = new Cesium.PolygonOutlineGeometry({
          // always update Cesium externs before adding a property
          polygonHierarchy: hierarchy,
          perPositionHeight: true
        });
      }
    }

    const primitives = this.wrapFillAndOutlineGeometries(
        layer, feature, olGeometry, fillGeometry, outlineGeometry, olStyle);

    if (outlinePrimitive) {
      primitives.add(outlinePrimitive);
    }

    return this.addTextStyle(layer, feature, olGeometry, olStyle, primitives);
  }



    // olPointGeometryToCesium(
    //     layer,
    //     feature,
    //     olGeometry,
    //     projection,
    //     style,
    //     billboards,
    //     opt_newBillboardCallback
    // ) {
    //     console.log(olGeometry);
    //     console.assert(olGeometry.getType() == 'Point');
    //     olGeometry = olcsCore.olGeometryCloneTo4326(olGeometry, projection);
    //     console.log(olGeometry);
    //     let modelPrimitive = null;
    //     const imageStyle = style.getImage();
    //     if (imageStyle) {
    //         const olcsModelFunction = /** @type {function():olcsx.ModelStyle} */ (olGeometry.get('olcs_model') || feature.get('olcs_model'));
    //         if (olcsModelFunction) {
    //             //const olcsModel = olcsModelFunction();
    //             //  const options = /** @type {Cesium.ModelFromGltfOptions} */ (Object.assign({}, {scene: this.scene}, olcsModel.cesiumOptions));
    //             // const model = Cesium.Model.fromGltf(options);
    //             var extrudedPolygon = new Cesium.PolygonGeometry({
    //                 polygonHierarchy : new Cesium.PolygonHierarchy(
    //                     Cesium.Cartesian3.fromDegreesArray([
    //                         -72.0, 40.0,
    //                         70.0, 35.0,
    //                         75.0, -30.0,
    //                         -70.0, 30.0,
    //                         -68.0, 40.0
    //                     ])
    //                 ),
    //                 extrudedHeight: 300000
    //             });
    //             var geometry = Cesium.PolygonGeometry.createGeometry(extrudedPolygon);
    //             var instance = new Cesium.GeometryInstance({
    //                 geometry: geometry
    //             })

    //             modelPrimitive = new Cesium.PrimitiveCollection();
    //             modelPrimitive.add( new Cesium.Primitive({
    //                 geometryInstances : instance,
    //                 appearance : new Cesium.EllipsoidSurfaceAppearance({
    //                     material : Cesium.Material.fromType('Checkerboard')
    //                 })
    //             }));

    //             // if (olcsModel.debugModelMatrix) {
    //             //     modelPrimitive.add(new Cesium.DebugModelMatrixPrimitive({
    //             //         //modelMatrix: olcsModel.debugModelMatrix
    //             //     }));
    //             // }
    //         } else {

    //             this.createBillboardFromImage(layer, feature, olGeometry, projection, style, imageStyle, billboards, opt_newBillboardCallback);
    //         }
    //     }

    //     if (style.getText()) {
    //         return this.addTextStyle(layer, feature, olGeometry, style, modelPrimitive || new Cesium.Primitive());
    //     } else {
    //         return modelPrimitive;
    //     }
    // }
}
