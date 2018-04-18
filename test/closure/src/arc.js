goog.require('ol.geom.Polygon');
goog.require('ol.geom.Point');
goog.require('ol.geom.LineString');

var _arc_ = {};

_arc_.objArc = function(center, radius, alpha, omega, segments, flag)
{
    var pointList=[];
    if(flag)
        pointList.push([center[0], center[1]]);

    var dAngle= segments+1;
    for(var i=0;i<dAngle;i++)
    {
        var Angle = alpha - (alpha-omega)*i/(dAngle-1);
        var x = center[0] + radius*Math.cos(Angle*Math.PI/180);
        var y = center[1] + radius*Math.sin(Angle*Math.PI/180);

        var point = [x, y];
        pointList.push(point);
    }
    if(flag)
        pointList.push([center[0], center[1]]);

    var ftArc = new Polygon([pointList]);
    var arrArc = [ftArc];
    if(flag)
    {
             var ftArcPt0 = new Point(pointList[1]);
        var ftArcPt1 = new Point(pointList[pointList.length-2]);
        var ftArcSehne = new LineString([pointList[1], pointList[pointList.length-2]]);

        arrArc = [ftArc, ftArcPt0, ftArcPt1, ftArcSehne];
    }
    return arrArc;
};

export default _arc_;
