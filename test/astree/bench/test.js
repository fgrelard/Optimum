import {euclideanDistance} from '../../../js/lib/distance.js';
import $ from 'jquery';
import {getRandomArbitrary, addRandomArcs, addRandomLocations} from '../../../js/lib/randomfeatures.js';
import Arc from '../../../js/lib/arc.js';
import ASTree from '../../../js/lib/astree.js';
import {angleToVector, vectorToAngle, boundingBox, centerOfMass, project} from '../../../js/lib/geometry.js';
import rbush from 'rbush';
import Dual from '../../../js/lib/polardual.js';
import DualEuclidean from '../../../js/lib/dual.js';
import Select from 'ol/interaction/select';
import DualRtree from '../../../js/lib/dualrtree.js';

function intersects(a, b) {
    return b.minX <= a.maxX &&
           b.minY <= a.maxY &&
           b.maxX >= a.minX &&
           b.maxY >= a.minY;
}

function contains(a, b) {
    return a.minX <= b.minX &&
           a.minY <= b.minY &&
           b.maxX <= a.maxX &&
           b.maxY <= a.maxY;
}

rbush.prototype.searchCpt = function(bbox) {

    var node = this.data,
        result = [],
        toBBox = this.toBBox;

    if (!intersects(bbox, node)) return result;

    var nodesToSearch = [],
        i, len, child, childBBox;
    var cpt = 0;
    while (node) {
        for (i = 0, len = node.children.length; i < len; i++) {

            child = node.children[i];
            childBBox = node.leaf ? toBBox(child) : child;

            if (intersects(bbox, childBBox)) {
                cpt++;
                if (node.leaf) result.push(child);
                else if (contains(bbox, childBBox)) this._all(child, result);
                else nodesToSearch.push(child);
            }
        }
        node = nodesToSearch.pop();
    }

    return {hits: result, number: cpt};
};

function addRandomInputPoints(arcs, radius, nbPoints) {
    var g = centerOfMass(arcs.map((arc) => arc.center));
    var extent = [g[0] - radius, g[1] - radius,
                  g[0] + radius, g[1] + radius];
    var locations = addRandomLocations(extent, nbPoints);
    return locations;
}

function sectorsStEtienne(r=100) {
    var arcs = [new Arc([490530.2638429834,5689709.625998666],r, 65.42000000000003, 65.4729),

                new Arc([490530.2638429834,5689709.625998666],r, 35.60999999999997, 35.6562),

                new Arc([489901.92716161686,5688453.90383141],r, 139.55, 139.5746),

                new Arc([489901.92716161686,5688453.90383141],r, 140.0552, 141.4691),

                new Arc([489901.92716161686,5688453.90383141],r, 149.6627, 149.7853),

                new Arc([489901.92716161686,5688453.90383141],r, 193.1631, 193.1837),

                new Arc([489901.92716161686,5688453.90383141],r, 193.2136, 199.55),

                new Arc([489892.65053738403,5688443.330076676],r, 119.85000000000001, 134.5572),

                new Arc([489892.65053738403,5688443.330076676],r, 140.2455, 140.6157),

                new Arc([489764.32390216406,5688457.428419094],r, 93.1527, 93.195),

                new Arc([489850.90572833666,5688861.002883471],r, 151.2971, 154.1051),

                new Arc([489879.6632634582,5688846.903905587],r, 226.2393, 227.4359),

                new Arc([490086.22276304127,5688793.151756077],r, 56.0635, 56.2378),

                new Arc([490086.22276304127,5688793.151756077],r, 56.6236, 56.8244),

                new Arc([490113.74341493193,5688808.131830883],r, 6.949999999999978, 6.95),

                new Arc([490113.74341493193,5688808.131830883],r, 33.2355, 33.5482),

                new Arc([490145.90237893874,5689103.332535903],r, 334.5842, 334.8873),

                new Arc([490145.90237893874,5689103.332535903],r, 336.3348, 336.3519),

                new Arc([490645.6032042774,5689009.043491641],r, 111.8, 111.80000000000001),

                new Arc([490650.2415163939,5688977.760897256],r, 43.199999999999974, 43.2),

                new Arc([490800.83204977255,5689218.33126571],r, 146.7893, 149.131),

                new Arc([491029.9646683221,5689267.679832566],r, 278.3695, 278.6086),

                new Arc([491029.9646683221,5689267.679832566],r, 279.3141, 283.4915),

                new Arc([491029.9646683221,5689267.679832566],r, 331.78, 331.78000000000003),

                new Arc([491042.9519422479,5689234.193275388],r, 346.6761, 356.0078),

                new Arc([491049.4455792108,5689188.369768536],r, 358.96, 367.1163),

                new Arc([491051.30090405734,5689169.864188014],r, 45.8096, 47.619),

                new Arc([491053.15622890403,5689147.393177373],r, 372.2489, 375.1663),

                new Arc([491050.9916832496,5689126.24404241],r, 53.3676, 53.4377),

                new Arc([491049.4455792108,5689136.818603642],r, 347.53, 347.530001),

                new Arc([491047.8994751721,5689183.5230651805],r, 3.0500000000000007, 8.024),

                new Arc([491047.8994751721,5689183.5230651805],r, 43.2861, 43.6608),

                new Arc([491046.3533711332,5689217.89065473],r, 21.199999999999978, 21.2),

                new Arc([490717.9608732931,5689261.951859959],r, 264.2995, 264.3755),

                new Arc([489901.61794080905,5689558.048783805],r, 2.889999999999997, 2.89),

                new Arc([489890.4859917298,5689559.811294814],r, 303.78, 306.7307),

                new Arc([489890.4859917298,5689559.811294814],r, 306.8469, 306.9021),

                new Arc([489890.4859917298,5689559.811294814],r, 21.21999999999998, 21.22),

                new Arc([489698.7690909192,5689933.471462691],r, 344.4286, 354.4986),

                new Arc([489083.7289042863,5689258.8675685385],r, 222.25, 222.25000000000003),

                new Arc([489067.95864309056,5689244.767964126],r, 55.999999999999986, 56),

                new Arc([489067.95864309056,5689244.767964126],r, 103.9238, 106.0052),

                new Arc([489067.95864309056,5689244.767964126],r, 106.1809, 106.2375),

                new Arc([488977.3569464172,5689331.569006175],r, 197.3797, 197.7558),

                new Arc([488952.61928179645,5689305.132051459],r, 20.129999999999985, 20.13),

                new Arc([488952.61928179645,5689305.132051459],r, 45.373, 46.2441),

                new Arc([488952.61928179645,5689305.132051459],r, 49.1021, 49.775),

                new Arc([489058.68201885786,5690321.248504425],r, 111.5334, 112.123),

                new Arc([489058.68201885786,5690321.248504425],r, 112.5867, 112.7003),

                new Arc([489164.7447559192,5690533.211010033],r, 209.0545, 211.7253),

                new Arc([489164.7447559192,5690533.211010033],r, 212.6526, 212.7769),

                new Arc([489164.7447559192,5690533.211010033],r, 213.3008, 213.4917),

                new Arc([489555.9090777345,5690950.981328211],r, 46.739999999999995, 46.74),

                new Arc([489555.9090777345,5690950.981328211],r, 78.336, 82.9186),

                new Arc([489329.5594464548,5690960.235954726],r, 124.05, 124.05000000000001),

                new Arc([489362.64607288496,5691011.797620463],r, 222.8596, 227.81000000000003),

                new Arc([489664.13636045007,5691378.466920215],r, 52.63999999999997, 52.64),

                new Arc([489489.1173832585,5691544.6188916415],r, 98.55999999999999, 98.56),

                new Arc([489859.25469014613,5691225.5393167585],r, 197.853, 198.27),

                new Arc([489895.43352465396,5691229.505705746],r, 102.99999999999999, 103.4586),

                new Arc([489895.43352465396,5691229.505705746],r, 108.4909, 119.7107),

                new Arc([489039.8195495845,5690553.922792213],r, 236.43, 236.7088),

                new Arc([488387.0544244051,5691601.472661694],r, 14.459999999999969, 14.46),

                new Arc([488426.9439086061,5691633.205155494],r, 86.82999999999997, 86.83),

                new Arc([488106.5911517675,5692824.577257024],r, 82.89999999999999, 82.9),

                new Arc([488095.76842349605,5692821.4917378435],r, 94.09, 94.09000000000003),

                new Arc([487289.01133605244,5693465.947549609],r, 154.2883, 159.8829),

                new Arc([487276.02406212664,5693437.735106368],r, 174.9647, 175.0436),

                new Arc([487276.02406212664,5693437.735106368],r, 196.17, 196.17000000000004),

                new Arc([487232.73314904026,5693497.686654571],r, 203.64, 218.7426),

                new Arc([487241.39133165753,5693515.760361856],r, 34.80999999999999, 34.81),

                new Arc([487241.39133165753,5693515.760361856],r, 50.9611, 53.5271),

                new Arc([487241.39133165753,5693515.760361856],r, 55.9843, 56.1558),

                new Arc([487241.39133165753,5693515.760361856],r, 64.1614, 65.491),

                new Arc([487241.39133165753,5693515.760361856],r, 75.0333, 79.1707),

                new Arc([490619.93787723343,5686527.924174413],r, 89.6199, 92.0566),

                new Arc([490619.93787723343,5686527.924174413],r, 100.622, 104.5125),

                new Arc([490619.93787723343,5686527.924174413],r, 122.5653, 124.4248),

                new Arc([490361.1200611391,5686646.854193942],r, 72.32999999999997, 72.33),

                new Arc([490361.1200611391,5686646.854193942],r, 81.4116, 81.547),

                new Arc([490352.4618785219,5686658.306797703],r, 301.7839, 301.8131),

                new Arc([490352.4618785219,5686658.306797703],r, 311.1782, 311.6841),

                new Arc([490352.4618785219,5686658.306797703],r, 312.4587, 314.81),

                new Arc([490345.04057913565,5686653.0209787665],r, 55.61999999999999, 55.62),

                new Arc([490345.04057913565,5686653.0209787665],r, 57.6477, 61.0102),

                new Arc([490345.04057913565,5686653.0209787665],r, 61.4139, 61.7839),

                new Arc([490012.31898998684,5687027.881373262],r, 65.42999999999999, 65.43),

                new Arc([490012.31898998684,5687027.881373262],r, 106.4296, 106.4321),

                new Arc([490012.31898998684,5687027.881373262],r, 106.8502, 106.9752),

                new Arc([490012.31898998684,5687027.881373262],r, 107.1121, 113.9726),

                new Arc([490001.18704090756,5687068.848266398],r, 34.62999999999998, 34.63),

                new Arc([489884.3015755745,5687404.079024475],r, 73.84999999999998, 73.85),

                new Arc([489884.3015755745,5687404.079024475],r, 108.9817, 113.44999999999999),

                new Arc([489861.4192358004,5687424.343046748],r, 44.719999999999985, 44.72),

                new Arc([489576.31765104656,5688245.955613515],r, 85.30999999999999, 85.31)];

    var arcs2 = [];
    for (var arc of arcs) {
        if (arc.omega - arc.alpha > 1)
            arcs2.push(arc);

    }

    arcs = arcs2;

    var length = arcs.length;
    for (var i  = 0; i < length; i++) {
        arcs[i].computeGeometry();
     }
    arcs = arcs.slice(0,length);

    return arcs;
}


function generateRandomSectors(n, r=10000000) {
    var extent = [0,0, 100, 100];
    var locations = addRandomLocations(extent, n);
    var arcs = addRandomArcs(locations);
    for (var i  = 0; i < arcs.length; i++) {
        arcs[i].radius = r;
        arcs[i].computeGeometry();
    }
    return arcs;
}

function generateSectors(nb) {
    var extent = [0,0, 100, 100];

    var arcs = [new Arc([5,5], 1000, 200, 250),
                new Arc([2,2], 1000, 190, 230),
                new Arc([3,3], 1000, 215, 260),
                new Arc([2,7], 1000, 180, 200),
                new Arc([6,6], 1000, 0, 45),
                new Arc([-50,-20], 1000, -20, 20),
                new Arc([6,4], 1000, 290, 330),
                new Arc([7,8], 1000, 130, 180),
                new Arc([10,0], 1000, 270, 310),
                new Arc([-20,20], 1000, 250, 290)
               ];

    arcs = [];
    var stepAngle = 360/nb;
    var locations = addRandomLocations(extent, nb);
    for (var i = 0; i < nb; i++) {
        var arc = new Arc(locations[i], 10000, i*stepAngle+1, (i+1)*stepAngle);
        arcs.push(arc);
    }

    for (var i  = 0; i < arcs.length; i++) {
        arcs[i].computeGeometry();
    }

    return arcs;
}

function pointHoughToLine(p, g) {
    var theta = p[0] + g[0];
    var rho = p[1] + g[1];
    var x = rho * Math.cos(theta);
    var y = rho * Math.sin(theta);
    var vortho = [x, y];
    var vline = [vortho[1], -vortho[0]];

    x += g[0];
    y += g[1];

    return {center:[x, y],
            vector: vline};

}


function divideArcsWithSlope(arcs) {
    var arcsX = [];
    var arcsY = [];
    for (var arc of arcs) {
        var alpha = Math.abs(arc.alpha) % 360;
        if ((alpha >= 0 && alpha < 45) ||
            (alpha > 315 && alpha <= 360) ||
            (alpha > 135 && alpha < 225)) {
            arcsX.push(arc);
        }
        else {
            arcsY.push(arc);
        }
    }
    return [arcsX, arcsY];
}

function histogramAngles(arcs) {
    var length = 60;
    var array = new Array(length).fill(0);
    for (var arc of arcs) {
        var angle = Math.round(arc.omega - arc.alpha);
        array[angle]++;
    }
    var histo = [];
    for (var i = 0; i < length; i++) {
        histo.push({x: i, y: array[i]});
    }
    return histo;
}

function writeCsv(array) {
    let csvContent = "data:text/csv;charset=utf-8,";
    for (var i = 0; i < array.length; i++) {
        for (var prop in array[i])
            csvContent += array[i][prop].toString() + "\t";
        csvContent += "\n";
    }
    var encodedUri = encodeURI(csvContent);
    return encodedUri;
}

function sectorsIntersected(sectors, n, dmin, radius, g) {
    var locations = addRandomInputPoints(sectors, radius, n);
    var sum = 0;
    for (var p of locations) {
        var norm = euclideanDistance(p, g);
        var vector = [(p[0] - g[0]) / norm, (p[1] - g[1]) / norm];
        var translation = [vector[0] * dmin, vector[1] * dmin];
        p[0] += translation[0];
        p[1] += translation[1];
        var number = 0;
        for (var s of sectors) {
            if (s.intersects(p)) {
                number++;
            }
        }
        sum += number;
    }
    sum /= n;
    return sum;
}

function findSectorInRtree(rtree, sector) {
    var data = rtree.data.children;
    var fifo = [data];
    while (fifo.length > 0) {
        data = fifo.shift();
        for (var node of data) {
            if (node.leaf) {
                var children = node.children;
                for (var c of children) {
                    if (c.feature.alpha === sector.alpha &&
                        c.feature.omega === sector.omega)
                        return node;
                }
            }
            else {
                fifo.push(node.children);
            }
        }

    }
    return false;
}

function discrepanciesRtree(rtree, sectors, n, dmin, radius, g) {
    var extent = [g[0]- radius, g[1] - radius,
                  g[0] + radius, g[1] + radius];
    var locations = addRandomLocations(extent, n);
    var sum = 0;
    for (var p of locations) {
        var norm = euclideanDistance(p, g);
        var vector = [(p[0] - g[0]) / norm, (p[1] - g[1]) / norm];
        var translation = [vector[0] * dmin, vector[1] * dmin];
        p[0] += translation[0];
        p[1] += translation[1];
        var number = 0;
        var hits = rtree.search([p[0] - g[0], p[1] - g[1]]);
        hits = hits.map(function(obj)  {
            return obj.feature;
        });
        for (var s of sectors) {
            if (s.intersects(p) && hits.indexOf(s) === -1) {
                console.log("false sector");
                console.log(findSectorInRtree(rtree, s));
                console.log(p);
                console.log(s);
                number++;
            }
        }
        sum += number;
    }
    sum /= n;
    return sum;
}


function intersectionNbPoints(arcs, g, dmax, nbMin, nbMax, step) {
    var array = [];
    for (var i = nbMin; i < nbMax; i+=step) {
        var n = sectorsIntersected(arcs, i, 0, dmax, g);
        array.push({x: i, y: n});
    }
    return array;
}

function intersectionDistance(arcs, g, dmin, dmax, step) {
    var array = [];
    for (var i = dmin; i < dmax; i+=step) {
        var n = sectorsIntersected(arcs, 50000, i-step, i, g);
        array.push({x: i, y: n});
    }
    return array;
}



function polarVsEuclideanDualities(arcs, nbPoints) {
    var g = centerOfMass(arcs.map((arc) => arc.center));
    var nb = 20;
    var rtreePolarDual = new DualRtree(Dual, nb);
    rtreePolarDual.load(arcs);

    var rtreeEuclideanDual = new DualRtree(DualEuclidean, nb, true);
    rtreeEuclideanDual.load(arcs);


    var locations = addRandomInputPoints(arcs, 1000, nbPoints);
    var averagePolar = 0;
    var averageEuclidean = 0;
    for (var p of locations) {
        var resultPolar = rtreePolarDual.search(p);
        var resultEuclidean = rtreeEuclideanDual.search(p);
        averagePolar += resultPolar.hits.length;
        averageEuclidean += resultEuclidean.hits.length;
    }
    averagePolar /= nbPoints;
    averageEuclidean /= nbPoints;
    return {x: arcs.length, polar: averagePolar, euclidean: averageEuclidean};

}

function compareDualities(min, max, step, nbPoints) {
    var array = [];
    for (var i = min; i < max; i+=step) {
        var arcs = generateRandomSectors(i);
        array.push(polarVsEuclideanDualities(arcs, nbPoints));
    }
    return array;
}

function searchLinear(arcs, points) {
    var hits = [];
    for (var p of points) {
        var h = [];
        for (var arc of arcs) {
            if (arc.intersects(p)) {
                h.push(arc);
            }
        }
        hits.push(h);
    }
    return hits;
}

function searchRtree(rtree, points) {
    var hits=  [];
    for (var p of points) {
        hits.push(rtree.searchCpt({minX: p[0],
                                maxX: p[0]+1,
                                minY: p[1],
                                maxY: p[1]+1}));
    }
    return hits;
}

function searchDualRtree(dualRtree, points) {
    var hits = [];
    for (var p of points)
        hits.push(dualRtree.search(p));
    return hits;
}

function sum(array) {
	var num = 0;
	for (var i = 0, l = array.length; i < l; i++) num += array[i];
	return num;
}

function mean(array) {
	return sum(array) / array.length;
}

function variance(array) {
	var av = mean(array);
	return mean(array.map(function(num) {
		return Math.pow(num - av, 2);
	}));
}

function standardDeviation(array) {
	return Math.sqrt(variance(array));
}

function compareSearchTime(arcs, b, nbPoints, radius) {
    //console.log(b);
    var locations = addRandomInputPoints(arcs, radius, nbPoints);

    console.time("init DualRtree");
    var dualRtree = new DualRtree(Dual, b);
    dualRtree.load(arcs);
    console.timeEnd("init DualRtree");

    console.time("init rtree");
    var rtree = rbush(b);
    var geometries = arcs.map(function(arc) {
        var polygonExtent = arc.geometry.getExtent();
        var polygonBBox = {minX: polygonExtent[0],
                           minY: polygonExtent[1],
                           maxX: polygonExtent[2],
                           maxY: polygonExtent[3],
                           feature : arc};
        return polygonBBox;
    });
    rtree.load(geometries);
    console.timeEnd("init rtree");

    console.time("search linear");
    var resultLinear = searchLinear(arcs, locations);
    console.timeEnd("search linear");

    console.time("search rtree");
    var resultRtree = searchRtree(rtree, locations);
    console.timeEnd("search rtree");

    var hitsR = resultRtree.map((res) => res.hits.length);
    var accessR = resultRtree.map((res) => res.number);
    var dataR = mean(hitsR) + "\t" + standardDeviation(hitsR) + "\t" + mean(accessR) + "\t" +standardDeviation(accessR);

    console.time("search DualRtree");
    var resultDualRtree = searchDualRtree(dualRtree, locations);
    console.timeEnd("search DualRtree");

    var hits = resultDualRtree.map((res) => res.hits.length);
    var access = resultDualRtree.map((res) => res.number.cpt);
    var data = dataR + "\t" + mean(hits) + "\t" + standardDeviation(hits) + "\t" + mean(access) + "\t" +standardDeviation(access);
    console.log(data);

}

var cpt = 0;
for (var i = 500; i <= 1000000; i=i*((cpt % 2 === 0) ? 5 : 2)) {
    var ar = generateRandomSectors(i);
    compareSearchTime(ar, 7, 50000, 5000);
    cpt++;
}



// var array = compareDualities(0, 10000, 500, 1000);
// var uri = writeCsv(array);
// console.log(uri);

var arcs = sectorsStEtienne();
var g = centerOfMass(arcs.map((arc) => arc.center));

// var histo = histogramAngles(arcs);
// var uri = writeCsv(histo);
// console.log(uri);
//var averageSectors = sectorsIntersected(arcs, 500, 0, 1000, g);
//console.log(averageSectors);
// var curve =intersectionNbPoints(arcs, g, 2000, 0, 100000, 1000);
//var curve =intersectionDistance(arcs, g, 1000, 20000, 1000);
// points.getSource().addFeature(new Feature(new Polygon([ [ [g[0] - 10000, g[1] - 10000], [g[0] + 10000, g[1] - 10000], [g[0] + 10000, g[1] + 10000], [g[0] - 10000, g[1] + 10000] ] ])));
// var uri = writeCsv(curve);
// console.log(uri);
