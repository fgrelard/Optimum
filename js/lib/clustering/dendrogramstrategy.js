/**
 * @fileOverview Dendrogram based on distance from several pictures
 * @name dendrogramstrategy.js
 * @author Florent Grélard
 * @license
 */
import {euclideanDistance} from '../distance';
import Cluster from '../cluster';
import ClusteringStrategy from './clusteringstrategy';


/** Distance strategy to cluster pictures
 */
export default class DistanceStrategy extends ClusteringStrategy {


    /**
     * Overrides constructor
     * @param {Array<Picture>} pictures
     */
    constructor(pictures) {
        super();
        /**
         * pictures
         * @type {Array<Picture>}
         */
        this.pictures = pictures;
    }


    /**
     * Dendrogram strategy
     * @returns {Array<Cluster>} array of clusters
     */
    computeClusters() {
        var indexes = [];
        var clusters = [];
        for (var i = 0; i < this.pictures.length; i++) {
            var pic1 = this.pictures[i];
            var pos1 = pic1.getProperties().position;
            var [minImage, minDistance, index] = this.getClosestImage(pos1);
            var pics = [];
            // if (indexes.indexOf(i) === -1) {
            //     indexes.push(i);
            //     pics.push(pic1);
            // }
            // if (indexes.indexOf(index) === -1) {
            //     indexes.push(index);
            //     pics.push(minImage);
            // }
            pics.push(pic1);
            pics.push(minImage);
            var cluster = new Cluster(pics, minDistance);
            clusters.push(cluster);
        }
        clusters.sort(function(a,b) {
            return a.label < b.label;
        });
        return clusters;
    }

    /**
     * Closest image from a given image
     * @param {Array<number>} pos1
     * @returns {Array<Object>} closest images, and distance
     */
    getClosestImage(pos1) {
        var minDistance = Number.MAX_VALUE;
        var minImage;
        var index = 0;
        for (var j = 0; j < this.pictures.length; j++) {
            var image2 = this.pictures[j];
            var pos2 = image2.getProperties().position;
            var d12 = euclideanDistance(pos1, pos2);
            if (d12 > 0 && d12 < minDistance) {
                minDistance = d12;
                minImage = image2;
                index = j;
            }
        }
        return [minImage, minDistance, index];
    }
}
