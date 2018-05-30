import Point from 'ol/geom/point';
import IsoVist from './isovistsectors2d';
export default class Picture {
    constructor(filename, position, arc) {
        this.filename = filename;
        this.position = position;
        this.arc = arc;
        this.geometry = new Point(position);
        this.selected = false;
        this.isovist = null;
        this.visualizesInput = false;
    }
}
