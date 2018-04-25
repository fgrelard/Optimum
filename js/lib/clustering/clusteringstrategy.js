/**
 * @fileOverview Interface for cluster computation
 * @name clusteringstrategy.js
 * @author Florent Grelard
 * @license
 */

export default class ClusteringStrategy {
    constructor() {
        if (this.constructor === ClusteringStrategy) {
            throw new TypeError("Can not construct abstract class.");
        }
        if (this.computeClusters === ClusteringStrategy.prototype.computeClusters) {
            throw new TypeError("Please implement abstract method foo.");
        }
    }

    computeClusters() {
        throw new TypeError("Do not call abstract method foo from child.");
    }
};
