import {euclideanDistance} from '../../../js/lib/distance.js';
import $ from 'jquery';
import {getRandomArbitrary, addRandomArcs, addRandomLocations} from '../../../js/lib/randomfeatures.js';
import Arc from '../../../js/lib/arc.js';
import ASTree from '../../../js/lib/astree.js';
import {angleToVector, vectorToAngle, boundingBox, centerOfMass, project} from '../../../js/lib/geometry.js';
import rbush from 'rbush';
import {rectanglesIntersect} from '../../../js/lib/lineintersection.js';
import Dual from '../../../js/lib/polardual.js';
import DualEuclidean from '../../../js/lib/dual.js';
import Select from 'ol/interaction/Select';
import DualRtree from '../../../js/lib/dualrtree.js';
import {sectorsStEtienne2345_r1500, sectorsStEtienne2345_r300,
        sectorsStEtienne} from '../../../js/lib/datastetienne.js';

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


function generateRandomSectors(n, r=10000000, cumulHisto = null) {
    var extent = [0,0, 100, 100];
    var locations = addRandomLocations(extent, n);
    var arcs = addRandomArcs(locations);
    for (var i  = 0; i < arcs.length; i++) {
        if (cumulHisto)
            arcs[i].omega = arcs[i].alpha + angleFitStEtienneDistribution(cumulHisto);
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
    var length = 100;
    var array = new Array(length).fill(0);
    for (var arc of arcs) {
        var angle = Math.round(arc.omega - arc.alpha);
        if (arc.omega - arc.alpha > 0.00001) {
            array[angle]++;
        }
    }
    var histo = [];
    for (var i = 0; i < length; i++) {
        histo.push({x: i, y: array[i]});
    }
    return histo;
}

function cumulativeHisto(histo) {
    var cumulativeHisto = [];
    histo.sort(function(a, b) {
        return a.x - b.x;
    });
    var sum = 0;
    for (let elem of histo) {
        sum += elem.y;
        cumulativeHisto.push({x: elem.x, y: sum});
    }

    for (let elem of cumulativeHisto) {
        elem.y /= sum;
    }
    return cumulativeHisto;
}


function angleFitStEtienneDistribution(cumulHisto) {
    var nb = getRandomArbitrary(0, 1);
    if (nb <= 0.64537) {
        return getRandomArbitrary(0.1, 0.5);
    }
    var min;
    var max;
    var found = false;
    for (let elem of cumulHisto) {
        if (nb >= elem.y) {
            min = {x: elem.x, y: elem.y};
        }
        else {
            max = {x: elem.x, y: elem.y};
            break;
        }
    }
    if (!max || !min) return 7.0;
    var intervalY = max.y - min.y;
    var intervalX = max.x - min.x;
    var diff = (max.y - nb) / intervalY;
    var value = (diff * intervalX) + min.x;
    return value;
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

function area(rectangle) {
    var w = rectangle.maxX - rectangle.minX;
    var h = rectangle.maxY - rectangle.minY;
    return w*h;
}

function coverage(parent, children) {
    var areaParent = area(parent);
    var sumAreaChildren = 0;
    for (var child of children) {
        var a = area(child);
        sumAreaChildren += a;
    }
    return areaParent / sumAreaChildren;
}

function overlap(parent, children) {
    var areaParent = area(parent);
    var sumArea = 0;
    for (var i=0; i<children.length; i++) {
        var sumIntersection = 0;
        for (var j=0; j < children.length; j++) {
            if (i === j) continue;
            var intersection = rectanglesIntersect(children[i], children[j]);
            if (intersection) {
                sumIntersection += area(intersection);
            }
        }
        sumArea += sumIntersection / area(children[i]);
    }
    return sumArea / children.length;
}

function overlapLiterature(parent, children) {
    var areaParent = area(parent);
    var sumArea = 0;
    for (var i=0; i<children.length; i++) {
        var sumIntersection = 0;
        for (var j=i+1; j < children.length; j++) {
            var intersection = rectanglesIntersect(children[i], children[j]);
            if (intersection) {
                sumIntersection += area(intersection);
            }
        }
        sumArea += sumIntersection;
    }
    return sumArea / area(parent);
}

function characteristicsTree(tree, firstCols) {
    console.log(tree);
    var data;
    var fifo = [tree];
    var str="";
    var hist = new Array(8).fill(0);
    while (fifo.length > 0) {
        data = fifo.shift();
        var h = data.height;
        hist[h]++;
        var c = coverage(data, data.children);
        if (h === 1) {
            console.log("node");
            console.log(data);
            console.log(data.children);
            console.log(c);
        }
        var o = overlapLiterature(data, data.children);
        str += firstCols +  h + "\t" + c + "\t" + o + "\n";
        if (!data.leaf) {
            for (var child of data.children) {
                if (child.leaf) continue;
                fifo.push(child);
            }
        }
    }
    console.log(hist);
    return str;
}

function compareCharacteristics(arcs, b) {

    var dualRtree = new DualRtree(Dual, b);
    dualRtree.load(arcs);
    console.log(arcs.length);
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

    var firstCols = arcs.length + "\t" + b + "\t";

    var charDualRtree = characteristicsTree(dualRtree.rtree.data, firstCols + "Dual R-tree\t");
    var charRtree = characteristicsTree(rtree.data, firstCols + "R-tree\t");
    return charDualRtree + charRtree;

}

function compareCharacteristicsDualities(arcs, b) {
    var dualRtree = new DualRtree(Dual, b);
    dualRtree.load(arcs);

    var rtreeEuclideanDual = new DualRtree(DualEuclidean, b, true);
    rtreeEuclideanDual.load(arcs);

    var firstCols = arcs.length + "\t" + b + "\t";

    var charDualRtree = characteristicsTree(dualRtree.rtree.data, firstCols + "Dual R-tree\t");
    var charRtreeH = characteristicsTree(rtreeEuclideanDual.rtree.data, firstCols + "R-tree H\t");
    var charRtreeV = characteristicsTree(rtreeEuclideanDual.rtreeVertical.data, firstCols + "R-tree V\t");
    return charDualRtree + charRtreeH + charRtreeV;
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

function compareDualities(arcs, b, nbPoints, radius) {
    var locations = addRandomInputPoints(arcs, radius, nbPoints);

    var t0 = performance.now();
    var dualRtree = new DualRtree(DualEuclidean, b);
    dualRtree.load(arcs);
    var t1 = performance.now();
    var timeInitDual = t1-t0;

    t0 = performance.now();
    var dualRtreeEuclidean = new DualRtree(DualEuclidean, b, true);
    dualRtreeEuclidean.load(arcs);
    t1 = performance.now();
    var timeInitDualE = t1-t0;

    var firstCols = arcs.length + "\t" + b + "\t" + nbPoints + "\t" + radius + "\t";
    t0 = performance.now();
    var resultDualRtree = searchDualRtree(dualRtree, locations);
    t1 = performance.now();
    var timeDualRtree = t1 - t0;

    t0 = performance.now();
    var resultDualRtreeE = searchDualRtree(dualRtreeEuclidean, locations);
    t1 = performance.now();
    var timeDualRtreeE = t1 - t0;

    var hits = resultDualRtree.map((res) => res.hits.length);
    var access = resultDualRtree.map((res) => res.number.cpt);
    var hitsE = resultDualRtreeE.map((res) => res.hits.length);
    var accessE = resultDualRtreeE.map((res) => res.number.cpt);

    var data = firstCols + timeInitDual + "\t" + timeDualRtree + "\t" + mean(hits) + "\t" + standardDeviation(hits) + "\t" + mean(access) + "\t" +standardDeviation(access) + "\t" + dualRtree.rtree.data.height +"\tPolar\n";

    var dataE = firstCols + timeInitDualE + "\t" + timeDualRtreeE + "\t" + mean(hitsE) + "\t" + standardDeviation(hitsE) + "\t" + mean(accessE) + "\t" +standardDeviation(accessE) + "\t"+ dualRtreeEuclidean.rtree.data.height + "\tEuclidean\n";
    return dataE+data;
}

function compareSearchTime(arcs, b, nbPoints, radius) {
    var locations = addRandomInputPoints(arcs, radius, nbPoints);

    var t0 = performance.now();
    var dualRtree = new DualRtree(Dual, b);
    dualRtree.load(arcs);
    var t1 = performance.now();
    var timeInitDual = t1-t0;

    t0 = performance.now();
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
    t1 = performance.now();
    var timeInitRtree = t1-t0;

    t0 = performance.now();
    var resultLinear = searchLinear(arcs, locations);
    t1 = performance.now();
    var timeLinear = t1-t0;
    var firstCols = arcs.length + "\t" + b + "\t" + nbPoints + "\t" + radius + "\t";
    var linear = firstCols + 0 + "\t" + timeLinear + "\t" + "0\t0\t0\t0\tLinear\n";

    t0 = performance.now();
    var resultRtree = searchRtree(rtree, locations);
    t1 = performance.now();
    var timeRtree = t1 - t0;
    console.log(resultRtree);
    var hitsR = resultRtree.map((res) => res.length);
    var accessR = resultRtree.map((res) => res.number);
    var dataR = firstCols + timeInitRtree + "\t" + timeRtree + "\t" + mean(hitsR) + "\t" + standardDeviation(hitsR) + "\t" + mean(accessR) + "\t" +standardDeviation(accessR)+"\tR-tree\n" ;

    t0 = performance.now();
    var resultDualRtree = searchDualRtree(dualRtree, locations);
    t1 = performance.now();
    var timeDualRtree = t1 - t0;

    var hits = resultDualRtree.map((res) => res.hits.length);
    var access = resultDualRtree.map((res) => res.number.cpt);
    var data = firstCols + timeInitDual + "\t" + timeDualRtree + "\t" + mean(hits) + "\t" + standardDeviation(hits) + "\t" + mean(access) + "\t" +standardDeviation(access) + "\tDual R-tree\n";

    return linear+dataR+data;

}

$.getJSON('data/freeAngles2.json', function(json) {
    /* Real data */
    var arcString = json.arcs;
    console.log(arcString);
    var arcs = [];
    for (var arcS of arcString) {
        var posArray = arcS.position[0].split(",");
        var arc = new Arc([Number.parseFloat(posArray[0]), Number.parseFloat(posArray[1])], Number.parseInt(arcS.radius), Number.parseFloat(arcS.alpha), Number.parseFloat(arcS.omega));
        arc.computeGeometry();
        arcs.push(arc);
    }
    console.log(arcs);
    // var g = centerOfMass(arcs.map((arc) => arc.center));
    var histo = histogramAngles(arcs);
    var cumulHisto = cumulativeHisto(histo);
    var encodedUri = writeCsv(cumulHisto);

    /* Compare characteristics */
    var cpt = 0;
    let csvContent = "data:text/csv;charset=utf-8,";
    var res = compareSearchTime(arcs, 7, 500, 5000);
    csvContent += res;
    // for (var i = 1000000; i <= 1000000; i=i*((cpt % 2 === 0) ? 5 : 2)) {
    //     console.log("number of sectors " + i);
    //     var ar = generateRandomSectors(i, 10000000, cumulHisto);
    //     //var res = compareDualities(ar, 7, 5000, 5000);
    //     //var res = compareSearchTime(ar, 7, 5000, 5000);
    //     for (var b = 50; b <= 5000; b+=50) {
    //         var res = compareSearchTime(ar, b, 500, 5000);
    //         csvContent += res;
    //     }
    //     cpt++;
    // }
    console.log("done");
    var encodedUri = encodeURI(csvContent);
    var link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "my_data.csv");
    document.body.appendChild(link);
    link.click(); // This will download the data file named "my_data.csv".

});




//var averageSectors = sectorsIntersected(arcs, 500, 0, 1000, g);
//console.log(averageSectors);
// var curve =intersectionNbPoints(arcs, g, 2000, 0, 100000, 1000);
//var curve =intersectionDistance(arcs, g, 1000, 20000, 1000);
// points.getSource().addFeature(new Feature(new Polygon([ [ [g[0] - 10000, g[1] - 10000], [g[0] + 10000, g[1] - 10000], [g[0] + 10000, g[1] + 10000], [g[0] - 10000, g[1] + 10000] ] ])));
// var uri = writeCsv(curve);
// console.log(uri);
