import {euclideanDistance} from '../distance';
import Cluster from '../cluster';
import ClusteringStrategy from './clusteringstrategy';

export default class DistanceStrategy extends ClusteringStrategy {
    constructor(pictures) {
        super();
        this.pictures = pictures;
    }

    computeClusters() {
        var indexes = [];
        var clusters = [];
        for (var i = 0; i < this.pictures.length; i++) {
            if (indexes.indexOf(i) !== -1) continue;
            var pic1 = this.pictures[i];
            var pos1 = pic1.getProperties().position;
            var r1 = pic1.getProperties().arc.radius;
            var cluster = [];
            for (var j = i+1; j < this.pictures.length; j++) {
                if (indexes.indexOf(j) !== -1) continue;
                var pic2 = this.pictures[j];
                var pos2 = pic2.getProperties().position;
                if (euclideanDistance(pos1, pos2) < r1) {
                    indexes.push(j);
                    cluster.push(pic2);
                }
            }
            cluster.push(pic1);
            clusters.push(new Cluster(cluster, pic1.getProperties().filename));
        }
        return clusters;
    }
}
