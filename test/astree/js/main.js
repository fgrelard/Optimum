import Map from 'ol/map';
import View from 'ol/view';
import Group from 'ol/layer/group';
import OSM from 'ol/source/osm';
import TileLayer from 'ol/layer/tile';
import proj from 'ol/proj';
import Point from 'ol/geom/point';
import Feature from 'ol/feature';
import LineString from 'ol/geom/linestring';
import Polygon from 'ol/geom/polygon';
import extent from 'ol/extent';
import Vector from 'ol/source/vector';
import VectorLayer from 'ol/layer/vector';
import Style  from 'ol/style/style';
import Stroke  from 'ol/style/stroke';
import Fill  from 'ol/style/fill';
import {euclideanDistance} from '../../../js/lib/distance.js';
import $ from 'jquery';
import {getRandomArbitrary, addRandomArcs, addRandomLocations} from '../../../js/lib/randomfeatures.js';
import Arc from '../../../js/lib/arc.js';
import ASTree from '../../../js/lib/astree.js';
import {angleToVector, boundingBox} from '../../../js/lib/geometry.js';
import rbush from 'rbush';

var stEtienneLonLatConv = [0, 0];

var polygonSource = new Vector();
var polygon = new VectorLayer({
    source: polygonSource
});


var polygonFoundSource = new Vector();
var polygonFound = new VectorLayer({
    source: polygonFoundSource,
    style:  new Style({
        stroke : new Stroke({
            color: '#FF0000'
        }),
        fill: new Fill({
            color: 'rgba(255, 0, 0, 0.5)',
        })
    })
});

var polygonSelectedSource = new Vector();
var polygonSelected = new VectorLayer({
    source: polygonSelectedSource,
    style:  new Style({
        stroke : new Stroke({
            color: '#00FF00'
        }),
        fill: new Fill({
            color: 'rgba(255, 255, 255, 0.3)',
        })
    })
});


var pointSource = new Vector();
var points = new VectorLayer({
    source: pointSource
});

var map = new Map({ layers: [ new Group({ title: 'Cartes', layers:
                                          [new TileLayer({ title:'OSM', type:'base', source: new OSM() })]
                                        }) ], target: 'map', view: new View({ center: stEtienneLonLatConv,
                                                                              zoom: 18 }) });

function test(sectors, tree) {
    var cpt = 0;
    var sum = 0;
    for (var sector of sectors) {
        var c = sector.center;
        var angle = (sector.alpha + sector.omega) / 2;
        var vector = tree.angleToVector(angle);
        var p = [c[0] + vector[0] * 50,
                 c[1] + vector[1] * 50];
        var number = {cpt : -1};
        var hits = tree.search(p, number);
        sum += number.cpt;
        cpt += (hits.length > 0) ? 1 : 0;
    }
    sum /= sectors.length;
    console.log("Average = " + sum);
    return (cpt === sectors.length);
}

function sectorsStEtienne() {
    var arcs = [new Arc([490530.2638429834,5689709.625998666],100, 65.42000000000003, 65.4729),

                new Arc([490530.2638429834,5689709.625998666],100, 35.60999999999997, 35.6562),

                new Arc([489901.92716161686,5688453.90383141],100, 139.55, 139.5746),

                new Arc([489901.92716161686,5688453.90383141],100, 140.0552, 141.4691),

                new Arc([489901.92716161686,5688453.90383141],100, 149.6627, 149.7853),

                new Arc([489901.92716161686,5688453.90383141],100, 193.1631, 193.1837),

                new Arc([489901.92716161686,5688453.90383141],100, 193.2136, 199.55),

                new Arc([489892.65053738403,5688443.330076676],100, 119.85000000000001, 134.5572),

                new Arc([489892.65053738403,5688443.330076676],100, 140.2455, 140.6157),

                new Arc([489764.32390216406,5688457.428419094],100, 93.1527, 93.195),

                new Arc([489850.90572833666,5688861.002883471],100, 151.2971, 154.1051),

                new Arc([489879.6632634582,5688846.903905587],100, 226.2393, 227.4359),

                new Arc([490086.22276304127,5688793.151756077],100, 56.0635, 56.2378),

                new Arc([490086.22276304127,5688793.151756077],100, 56.6236, 56.8244),

                new Arc([490113.74341493193,5688808.131830883],100, 6.949999999999978, 6.95),

                new Arc([490113.74341493193,5688808.131830883],100, 33.2355, 33.5482),

                new Arc([490145.90237893874,5689103.332535903],100, 334.5842, 334.8873),

                new Arc([490145.90237893874,5689103.332535903],100, 336.3348, 336.3519),

                new Arc([490645.6032042774,5689009.043491641],100, 111.8, 111.80000000000001),

                new Arc([490650.2415163939,5688977.760897256],100, 43.199999999999974, 43.2),

                new Arc([490800.83204977255,5689218.33126571],100, 146.7893, 149.131),

                new Arc([491029.9646683221,5689267.679832566],100, 278.3695, 278.6086),

                new Arc([491029.9646683221,5689267.679832566],100, 279.3141, 283.4915),

                new Arc([491029.9646683221,5689267.679832566],100, 331.78, 331.78000000000003),

                new Arc([491042.9519422479,5689234.193275388],100, 346.6761, 356.0078),

                new Arc([491049.4455792108,5689188.369768536],100, 358.96, 367.1163),

                new Arc([491051.30090405734,5689169.864188014],100, 45.8096, 47.619),

                new Arc([491053.15622890403,5689147.393177373],100, 372.2489, 375.1663),

                new Arc([491050.9916832496,5689126.24404241],100, 53.3676, 53.4377),

                new Arc([491049.4455792108,5689136.818603642],100, 347.53, 347.530001),

                new Arc([491047.8994751721,5689183.5230651805],100, 3.0500000000000007, 8.024),

                new Arc([491047.8994751721,5689183.5230651805],100, 43.2861, 43.6608),

                new Arc([491046.3533711332,5689217.89065473],100, 21.199999999999978, 21.2),

                new Arc([490717.9608732931,5689261.951859959],100, 264.2995, 264.3755),

                new Arc([489901.61794080905,5689558.048783805],100, 2.889999999999997, 2.89),

                new Arc([489890.4859917298,5689559.811294814],100, 303.78, 306.7307),

                new Arc([489890.4859917298,5689559.811294814],100, 306.8469, 306.9021),

                new Arc([489890.4859917298,5689559.811294814],100, 21.21999999999998, 21.22),

                new Arc([489698.7690909192,5689933.471462691],100, 344.4286, 354.4986),

                new Arc([489083.7289042863,5689258.8675685385],100, 222.25, 222.25000000000003),

                new Arc([489067.95864309056,5689244.767964126],100, 55.999999999999986, 56),

                new Arc([489067.95864309056,5689244.767964126],100, 103.9238, 106.0052),

                new Arc([489067.95864309056,5689244.767964126],100, 106.1809, 106.2375),

                new Arc([488977.3569464172,5689331.569006175],100, 197.3797, 197.7558),

                new Arc([488952.61928179645,5689305.132051459],100, 20.129999999999985, 20.13),

                new Arc([488952.61928179645,5689305.132051459],100, 45.373, 46.2441),

                new Arc([488952.61928179645,5689305.132051459],100, 49.1021, 49.775),

                new Arc([489058.68201885786,5690321.248504425],100, 111.5334, 112.123),

                new Arc([489058.68201885786,5690321.248504425],100, 112.5867, 112.7003),

                new Arc([489164.7447559192,5690533.211010033],100, 209.0545, 211.7253),

                new Arc([489164.7447559192,5690533.211010033],100, 212.6526, 212.7769),

                new Arc([489164.7447559192,5690533.211010033],100, 213.3008, 213.4917),

                new Arc([489555.9090777345,5690950.981328211],100, 46.739999999999995, 46.74),

                new Arc([489555.9090777345,5690950.981328211],100, 78.336, 82.9186),

                new Arc([489329.5594464548,5690960.235954726],100, 124.05, 124.05000000000001),

                new Arc([489362.64607288496,5691011.797620463],100, 222.8596, 227.81000000000003),

                new Arc([489664.13636045007,5691378.466920215],100, 52.63999999999997, 52.64),

                new Arc([489489.1173832585,5691544.6188916415],100, 98.55999999999999, 98.56),

                new Arc([489859.25469014613,5691225.5393167585],100, 197.853, 198.27),

                new Arc([489895.43352465396,5691229.505705746],100, 102.99999999999999, 103.4586),

                new Arc([489895.43352465396,5691229.505705746],100, 108.4909, 119.7107),

                new Arc([489039.8195495845,5690553.922792213],100, 236.43, 236.7088),

                new Arc([488387.0544244051,5691601.472661694],100, 14.459999999999969, 14.46),

                new Arc([488426.9439086061,5691633.205155494],100, 86.82999999999997, 86.83),

                new Arc([488106.5911517675,5692824.577257024],100, 82.89999999999999, 82.9),

                new Arc([488095.76842349605,5692821.4917378435],100, 94.09, 94.09000000000003),

                new Arc([487289.01133605244,5693465.947549609],100, 154.2883, 159.8829),

                new Arc([487276.02406212664,5693437.735106368],100, 174.9647, 175.0436),

                new Arc([487276.02406212664,5693437.735106368],100, 196.17, 196.17000000000004),

                new Arc([487232.73314904026,5693497.686654571],100, 203.64, 218.7426),

                new Arc([487241.39133165753,5693515.760361856],100, 34.80999999999999, 34.81),

                new Arc([487241.39133165753,5693515.760361856],100, 50.9611, 53.5271),

                new Arc([487241.39133165753,5693515.760361856],100, 55.9843, 56.1558),

                new Arc([487241.39133165753,5693515.760361856],100, 64.1614, 65.491),

                new Arc([487241.39133165753,5693515.760361856],100, 75.0333, 79.1707),

                new Arc([490619.93787723343,5686527.924174413],100, 89.6199, 92.0566),

                new Arc([490619.93787723343,5686527.924174413],100, 100.622, 104.5125),

                new Arc([490619.93787723343,5686527.924174413],100, 122.5653, 124.4248),

                new Arc([490361.1200611391,5686646.854193942],100, 72.32999999999997, 72.33),

                new Arc([490361.1200611391,5686646.854193942],100, 81.4116, 81.547),

                new Arc([490352.4618785219,5686658.306797703],100, 301.7839, 301.8131),

                new Arc([490352.4618785219,5686658.306797703],100, 311.1782, 311.6841),

                new Arc([490352.4618785219,5686658.306797703],100, 312.4587, 314.81),

                new Arc([490345.04057913565,5686653.0209787665],100, 55.61999999999999, 55.62),

                new Arc([490345.04057913565,5686653.0209787665],100, 57.6477, 61.0102),

                new Arc([490345.04057913565,5686653.0209787665],100, 61.4139, 61.7839),

                new Arc([490012.31898998684,5687027.881373262],100, 65.42999999999999, 65.43),

                new Arc([490012.31898998684,5687027.881373262],100, 106.4296, 106.4321),

                new Arc([490012.31898998684,5687027.881373262],100, 106.8502, 106.9752),

                new Arc([490012.31898998684,5687027.881373262],100, 107.1121, 113.9726),

                new Arc([490001.18704090756,5687068.848266398],100, 34.62999999999998, 34.63),

                new Arc([489884.3015755745,5687404.079024475],100, 73.84999999999998, 73.85),

                new Arc([489884.3015755745,5687404.079024475],100, 108.9817, 113.44999999999999),

                new Arc([489861.4192358004,5687424.343046748],100, 44.719999999999985, 44.72),

                new Arc([489576.31765104656,5688245.955613515],100, 85.30999999999999, 85.31)];


    var length = arcs.length;
    for (var i  = 0; i < length; i++) {
        arcs[i].center[0] -= 490000;
        arcs[i].center[1] -= 5687027;
        arcs[i].computeGeometry();
        polygon.getSource().addFeature(new Feature(arcs[i]));
     }
    arcs = arcs.slice(0,length);

    return arcs;
}


function generateRandomSectors(n) {
    var extent = [0,0, 10000, 10000];
    var locations = addRandomLocations(extent, n);
    var arcs = addRandomArcs(locations);
    for (var i  = 0; i < arcs.length; i++) {
        arcs[i].radius = 10000;
        arcs[i].computeGeometry();
        polygon.getSource().addFeature(new Feature(arcs[i]));
    }
    return arcs;
}

function generateSectors() {
    var extent = [0,0, 10, 10];

    var arcs = [new Arc([5,5], 100, 200, 250),
                new Arc([2,2], 100, 190, 230),
                new Arc([3,3], 100, 215, 260),
                new Arc([2,7], 100, 180, 200),
                new Arc([6,6], 100, 0, 45),
                new Arc([-50,-20], 100, -20, 20),
                new Arc([6,4], 100, 290, 330),
                new Arc([7,8], 100, 130, 180),
                new Arc([10,0], 100, 270, 310),
                new Arc([-20,20], 100, 250, 290)
               ];

    // arcs = [new Arc([7413.534606607684,5824.853140709478], 10000,262.2417390459634, 272.1130602285505),
    //         new Arc([6009.726319840105,7168.520944193531], 10000,283.68752658494964, 293.1743702503799),
    //         new Arc([7734.042676005991,6849.194304440693], 10000,203.25597070078535, 209.54456500763442),
    //         new Arc([1796.9171424588988,4096.561882144149], 10000,102.0497961727957, 109.63930170217839),
    //         new Arc([4092.16086498841,6723.830122021069], 10000,257.3059602239052, 264.9183099509074),
    //         new Arc([4404.291656871323,4485.493731387805], 10000,136.82705401018737, 144.51908108000106),
    //         new Arc([4608.1363015032675,5373.1355344241365], 10000,213.68722156967962, 218.82368038533392),
    //         new Arc([5023.56533005735,6895.081609798261], 10000,212.4891404274605, 219.28105944921225),
    //         new Arc([3222.4982079734405,8174.600503922358], 10000,220.74506002064007, 228.27483143657753),
    //         new Arc([6107.27393415442,5449.996542786361], 10000,67.67024747791251, 75.41705916763611)];

    // arcs = [new Arc([700,500], 10000, 340, 380),
    //         new Arc([300,500], 10000, 160, 200),
    //         new Arc([500,300], 10000, 250, 290),
    //         new Arc([500,700], 10000, 70, 110),
    //         new Arc([600,600], 10000, 25, 65),
    //         new Arc([400,400], 10000, 205, 245),
    //         new Arc([400,600], 10000, 115, 155),
    //         new Arc([600,400], 10000, 295, 335)
    //        ];

    for (var i  = 0; i < arcs.length; i++) {
        arcs[i].computeGeometry();
        polygon.getSource().addFeature(new Feature(arcs[i]));
    }

    return arcs;
}

function lineEquation(vector, center) {
    if (Math.abs(vector[1]) === 1) vector = [(vector[0] < 0) ? -0.01 : 0.01,
                                             (vector[1] < 0)? -0.99 : 0.99];
    var x = vector[1] / vector[0];
    var y = center[1] - x * center[0];
    return [x, -y];
}


function dualRepresentation(arcs) {
    var dual = [];
    for (var arc of arcs) {
        var firstVector = angleToVector(arc.alpha);
        var secondVector = angleToVector(arc.omega);
        var firstLine = lineEquation(firstVector, arc.center);
        var secondLine = lineEquation(secondVector, arc.center);
        points.getSource().addFeature(new Feature(new Point(firstLine)));
        points.getSource().addFeature(new Feature(new Point(secondLine)));
        var positions = [firstLine, secondLine];
        var bbox = boundingBox(positions);
        var bboxCoordinates = {minX: bbox[0][0],
                               minY: bbox[0][1],
                               maxX: bbox[1][0],
                               maxY: bbox[1][1],
                               feature: arc};
        dual.push(bboxCoordinates);
    }
    return dual;
}

function intersectionLineRectangle(line, rectangle) {
    var a = line[0];
    var b = line[1];
    var low = [rectangle.minX, rectangle.minY];
    var up = [rectangle.maxX, rectangle.maxY];
    var lowI = [(low[1] - b) / a, a * low[0] + b];
    var upI = [(up[1] - b) / a, a * up[0] + b];
    var condition = ((lowI[0] >= low[0] && lowI[0] <= up[0]) ||
                     (upI[0] >= low[0] && upI[0] <= up[0]) ||
                     (lowI[1] >= low[1] && lowI[1] <= up[1]) ||
                     (upI[1] >= low[1] && upI[1] <= up[1]));
    return condition;
}

function searchLineRTreeRecursive(hits, node, line) {
    if (node.leaf) {
        hits.push(...node.children);
        return;
    }
    for (var child of node.children) {
        var rectangle = {minX: child.minX,
                         minY: child.minY,
                         maxX: child.maxX,
                         maxY: child.maxY};
        if (intersectionLineRectangle(line, rectangle)) {
            searchLineRTreeRecursive(hits, child, line);
        }
    }
    return;
}

console.log(intersectionLineRectangle([4,-1], {minX: 0.5,
                                               minY: -2,
                                               maxX: 3,
                                               maxY: 0}));

points.getSource().addFeature(new Feature(new Point(stEtienneLonLatConv)));

var arcs = sectorsStEtienne(30);
// var astree = new ASTree(arcs, 5);
// astree.load(true);



var dual = dualRepresentation(arcs);
var rtree = rbush(5);
rtree.load(dual);
console.log(rtree);

// arcs.map(function(element) {
//     console.log("new Arc(["+ element.center + "], 100," + element.alpha + ", " + element.omega +"),");
// });
// var found = astree.search(stEtienneLonLatConv);
// for (let i = 0; i < found.length; i++) {
//     var polyFound = found[i];
//     polygonFound.getSource().addFeature(new Feature(polyFound));
// }

// /* Visualization */
// var dataNodes = [];
// var dataEdges = [];
// var index = 1;
// var fifo = [astree.tree];
// while (fifo.length > 0) {
//     var node = fifo.shift();
//     if (!node.value) continue;
//     if (node.value.hasOwnProperty("alpha")) {
//         dataNodes.push({id: index++, label: Math.round(node.value.alpha) + "°-" + Math.round(node.value.omega)+"°", color: 'rgb(255,168,7)'});
//     } else {
//         var label = node.value.toString();
//         dataNodes.push({id: index++, label: label, value: node.value});
//     }
//     if (node.parentIndex)
//         dataEdges.push({from: node.parentIndex, to: index-1, arrows:"to"});
//     for (let i = 0; i < node.children.length; i++) {
//         var nodeChild = node.children[i];
//         nodeChild.parentIndex = index-1;
//         fifo.push(nodeChild);
//     }
// }

// var nodes = new vis.DataSet(dataNodes);

// // create an array with edges
// var edges = new vis.DataSet(dataEdges);

// // create a network
// var container = document.getElementById('mynetwork');
// var data = {
//     nodes: nodes,
//     edges: edges
// };

// var options = {
//         layout: {
//           hierarchical: {
//             sortMethod: "directed"
//           }
//         },
//         edges: {
//           smooth: true,
//           arrows: {to : true }
//         }
//       };
// var network = new vis.Network(container, data, options);

// network.on("selectNode", function (params) {
//     polygonSelected.getSource().clear();
//     var node = dataNodes[params.nodes[0]-1];
//     var sector = node.value;
//     if (sector.firstPlane)
//         var center = sector.firstPlane.center;
//     else
//         center = sector.center;
//     var closestArc;
//     var min = Number.MAX_VALUE;
//     for (let arc of arcs) {
//         var d = euclideanDistance(center, arc.center);
//         if (d < min) {
//             min = d;
//             closestArc = arc;
//         }
//     }
//    polygonSelected.getSource().addFeature(new Feature(closestArc));

// });


map.on('click', function(event) {
    polygonFound.getSource().clear();
    points.getSource().clear();
    points.getSource().addFeature(new Feature(new Point(event.coordinate)));
    // var found = astree.search(event.coordinate);
    // for (let i = 0; i < found.length; i++) {
    //     var polyFound = found[i];
    //     polygonFound.getSource().addFeature(new Feature(polyFound));
    // }

    var p = event.coordinate;
    var l = [p[0], -p[1]];
    var hits = [];
    console.log(l);
    searchLineRTreeRecursive(hits, rtree.data, l);
    console.log(hits);
    for (let i = 0; i < hits.length; i++) {
        var polyFound = hits[i].feature;

        polygonFound.getSource().addFeature(new Feature(polyFound));
    }
    // var v = p[0] * -1000 + p[1];
    // var v2 = p[0] * 1000 + p[1];
    // var m = Math.min(v, v2);
    // var M = Math.max(v, v2);
    // var req = {minX: -1000,
    //            minY: m,
    //            maxX: 1000,
    //            maxY: M};
    // var rep = rtree.search(req);
    // for (var r of rep) {
    //     console.log(r.feature.alpha +  " " + r.feature.omega);
    // }
});

map.addLayer(polygon);
map.addLayer(points);
map.addLayer(polygonFound);
map.addLayer(polygonSelected);

// var t = test(arcs, astree);
// console.log("Test=" + t);
