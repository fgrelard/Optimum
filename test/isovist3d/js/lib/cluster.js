export default class Cluster {
    /**
     * Constructor
     * @param {Array.<Picture>} pictures
     * @param {String} label
     */
    constructor(pictures, label) {
        this.pictures = pictures;
        this.label = label;
    }

    /**
     * Checks whether a picture is inside this cluster
     * @param {} picture
     * @returns {} true if picture inside cluster, false else
     */
    hasPicture(picture) {
        for (var keyP in this.pictures) {
            var filename = this.pictures[keyP].getProperties().filename;
            if (filename === picture.filename)
                return true;
        }
        return false;
    }
}
