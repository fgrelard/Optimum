/**
 * @fileOverview Interface for cluster computation
 * @name clusteringstrategy.js
 * @author Florent Grelard
 * @license
 */

/** Interface (abstract class) for cluster computation
 */
export default class ClusteringStrategy {

    /**
     * Deleted constructor
     * @throws {TypeError} if called from abstract class
     */
    constructor() {
        if (this.constructor === ClusteringStrategy) {
            throw new TypeError("Can not construct abstract class.");
        }
        if (this.computeClusters === ClusteringStrategy.prototype.computeClusters) {
            throw new TypeError("Please implement abstract method.");
        }
    }

    /**
     * Compute clusters
     * @throws {TypeError} if called from abstract class
     */
    computeClusters() {
        throw new TypeError("Do not call abstract method computeClusters from child.");
    }
};
