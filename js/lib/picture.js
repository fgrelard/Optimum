import Point from 'ol/geom/point';

export default class Picture {
    constructor(filename, position, arc) {
        this.filename = filename;
        this.position = position;
        this.arc = arc;
        this.geometry = new Point(position);
    }
}