
var map, vectorlayer, vectorlayerA, vectorlayerC;

var theCenter = new ol.proj.fromLonLat(0,0);

var Radius =  2500000;
var dAngle =  1;
var Angle  = 0;
var AnimationFlag=true;
var DrawArcFlag = !AnimationFlag;

var objR = {xr:0, yr:0, radius:Radius, alpha:0, omega:360, segments:100, flag:false};

function init()
{

    var bounds = new ol.extent.boundingExtent(
        -3500000, -3500000, 3500000, 3500000
    );
    var options = {
        controls: [],
        maxExtent: bounds,
        maxResolution: 27343.75,      // = 3500000 * 2 / 256px
        minResolution: 27343.75,
        projection: "EPSG:0000",      // no special projection needed
        numZoomLevels:1,
        units: 'm'
    };
    map = new ol.Map('map', options);

    var blFake = new ol.layer.Vector();
    map.addLayer(blFake);

    //layer vectorlayerA for some background (a circle and 4 lines)
//    var styleMapA = new ol.StyleMap({
    //     "default": ol.Util.applyDefaults({ pointRadius: 10, strokeWidth:1, strokeColor:'#999999'}, ol.Feature.Vector.style["default"])
    // });

    vectorlayerA = new ol.layer.Vector();
    map.addLayer(vectorlayerA);

    //use of the arc function to draw a circle
    var ftArcArr  = objArc(new ol.geom.Point(objR.xr,objR.yr), objR.radius, objR.alpha, objR.omega, objR.segments, objR.flag);
    vectorlayerA.addFeatures(ftArcArr);

    var WKTString = "GEOMETRYCOLLECTION(";
    WKTString += "LINESTRING(" + (-(objR.radius+1000000)) + " " + 0 + "," + (objR.radius+1000000) + " " + 0 + "),";
    WKTString += "LINESTRING(" + 0 + " " + (-(objR.radius+1000000)) + "," + 0 + " " + (objR.radius+1000000) + "),";
    WKTString += "LINESTRING(" + (-(objR.radius+1000000)) + " " + (-(objR.radius+1000000)) + "," + (objR.radius+1000000) + " " + (objR.radius+1000000) + "),";
    WKTString += "LINESTRING(" + (-(objR.radius+1000000)) + " " + (objR.radius+1000000) + "," + (objR.radius+1000000) + " " + (-(objR.radius+1000000)) + ")";
    WKTString += ")";
    vectorlayerA.addFeatures(new ol.Format.WKT().read(WKTString));

    //layer vectorlayer for the vector animation
    var styleMap = new ol.StyleMap({
        "default": ol.Util.applyDefaults({ pointRadius: 10, strokeWidth:2}, ol.Feature.Vector.style["default"])
    });

    vectorlayer = new ol.layer.Vector("Vector layer", {"styleMap":styleMap});
    map.addLayer(vectorlayer);

    //layer vectorlayerC for the arc
    var styleMapC = new ol.StyleMap({
        "default": ol.Util.applyDefaults({ pointRadius: 2, strokeWidth:3, strokeColor:'#FF0000'}, ol.Feature.Vector.style["default"])
    });

    vectorlayerC = new ol.layer.Vector("arc", {"styleMap":styleMapC});
    map.addLayer(vectorlayerC);

    //map.addControl(new ol.Control.layerSwitcher());

    map.setCenter(theCenter, 1);

    vectorlayer.addFeatures(new ol.Format.WKT().read("GEOMETRYCOLLECTION(LINESTRING(" + -Radius + " 0, " + Radius + " 0),LINESTRING(" + Radius + " 0, " + Radius + " 0))"));
    setLines(vectorlayer);
    document.getElementById("irbtn1").checked = true;
}

/**
 * Function: setLines
 *
 * sets the new endpoints of the two lines
 *
 */
function setLines(vectorlayer)
{
    vectorlayer.features[0].geometry.components[1].x=Radius * Math.cos(Angle*Math.PI/180);
    vectorlayer.features[0].geometry.components[1].y=Radius * Math.sin(Angle*Math.PI/180);
    vectorlayer.drawFeature(vectorlayer.features[0]);

    vectorlayer.features[1].geometry.components[1].x=Radius * Math.cos(Angle*Math.PI/180);
    vectorlayer.features[1].geometry.components[1].y=Radius * Math.sin(Angle*Math.PI/180);
    vectorlayer.drawFeature(vectorlayer.features[1]);

    if(AnimationFlag)
        setTimeout("Thales()",100);
}

function Thales()
{
    if(Angle == 360)
        Angle = 0;

    Angle += dAngle
    var x = Radius * Math.cos(Angle*Math.PI/180);
    var y = Radius * Math.sin(Angle*Math.PI/180);
    setLines(vectorlayer)
    document.getElementById("Msg").innerHTML = Angle;
}

function MachWas(flag)
{
    if(flag==0)
        AnimationFlag = true;
    else if(flag==1)
        AnimationFlag = false;

    DrawArcFlag = !AnimationFlag;
    document.getElementById("ibtn").disabled=AnimationFlag;

    if(AnimationFlag)
    {   setLines(vectorlayer)
        vectorlayer.setVisibility(true);
        vectorlayerC.setVisibility(false);
    }
    else if(flag==2)
    {   vectorlayerC.destroyFeatures();
        var alpha = parseFloat(document.getElementById("itxt1").value);
        var omega = parseFloat(document.getElementById("itxt2").value);
        var showChordFlag = document.getElementById("icbx").checked;

        vectorlayerC.addFeatures(objArc(new ol.geom.Point(objR.xr,objR.yr), objR.radius, alpha, omega, objR.segments, showChordFlag));
        //alert(flag + ", " + alpha + ", " + omega + ", " + vectorlayerC.features.length);
        vectorlayer.setVisibility(false);
        vectorlayerC.setVisibility(true);
    }
}

/**
 * Function: objArc
 * creates an arc (a linestring with n segments)
 *
 * Parameters:
 * center   - center point
 * radius   - radius of the arc
 * alpha    - starting angle (in Grad)
 * omega    - ending angle   (in Grad)
 * segments - number of segments for drawing the arc
 * flag     - true  : create arc feature from center to start- to endpoint to center
 *            false : create arc feature from start- to endpoint
 *
 * Returns: an array with four features, if flag=true
 *          arc feature     (from Linestring)
 *          the startpoint  (from Point)
 *          the endpoint    (from Point)
 *          the chord       (from LineString)
 */
function objArc(center, radius, alpha, omega, segments, flag)
{
    var pointList=[];
    if(flag)
        pointList.push(new ol.geom.Point(center.x, center.y));

    var dAngle= segments+1;
    for(var i=0;i<dAngle;i++)
    {
        var Angle = alpha - (alpha-omega)*i/(dAngle-1);
        var x = center.x + radius*Math.cos(Angle*Math.PI/180);
        var y = center.y + radius*Math.sin(Angle*Math.PI/180);

        var point = new ol.geom.Point(x, y);

        pointList.push(point);
    }
    if(flag)
        pointList.push(new ol.geom.Point(center.x, center.y));

    var ftArc    = new ol.Feature.Vector(new ol.geom.LineString(pointList));
    if(flag)
    {
        var ftArcPt0 = new ol.Feature.Vector(pointList[1]);
        var ftArcPt1 = new ol.Feature.Vector(pointList[pointList.length-2]);
        var ftArcSehne = new ol.Feature.Vector(new ol.geom.LineString([pointList[1], pointList[pointList.length-2]]));
        var arrArc = [ftArc, ftArcPt0, ftArcPt1, ftArcSehne];
    }
    else
        var arrArc = [ftArc];

    return(arrArc);
}
