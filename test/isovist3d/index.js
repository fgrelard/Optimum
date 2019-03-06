const osmb = new OSMBuildings({
    container: 'map',
    zoom: 16,
    minZoom: 1,
    maxZoom: 19,
    position: { latitude: 45.4365, longitude: 4.3647 },
    state: true, // stores map position/rotation in url
    attribution: '© 3D <a href="https://osmbuildings.org/copyright/">OSM Buildings</a>'
});

osmb.addMapTiles(
    'https://{s}.tiles.mapbox.com/v3/osmbuildings.kbpalbpk/{z}/{x}/{y}.png',
    {
        attribution: '© Data <a href="https://openstreetmap.org/copyright/">OpenStreetMap</a> · © Map <a href="https://mapbox.com/">Mapbox</a>'
    }
);

// osmb.addGeoJSONTiles('https://{s}.data.osmbuildings.org/0.2/anonymous/tile/{z}/{x}/{y}.json');

osmb.addGeoJSON('file:///home/fgrelard/src/Optimum/test/isovist3d/map.geojson');
//***************************************************************************

// on pointer up
osmb.on('pointerup', e => {
    // if none, remove any previous selection and return
    if (!e.features) {
        osmb.highlight(feature => {});
        return;
    }

    // store id's from seleted items...
    const featureIDList = e.features.map(feature => feature.id);

    // ...then is is faster: set highlight color for matching features
    osmb.highlight(feature => {
        if (featureIDList.indexOf(feature.id) > -1) {
            return '#ffffff';
        }
    });
});

//***************************************************************************

const controlButtons = document.querySelectorAll('.control button');

controlButtons.forEach(button => {
    button.addEventListener('click', e => {
        const parentClassList = button.parentNode.classList;
        const direction = button.classList.contains('inc') ? 1 : -1;
        let increment, property;

        if (parentClassList.contains('tilt')) {
            property = 'Tilt';
            increment = direction*10;
        }
        if (parentClassList.contains('rotation')) {
            property = 'Rotation';
            increment = direction*10;
        }
        if (parentClassList.contains('zoom')) {
            property = 'Zoom';
            increment = direction*1;
        }
        if (property) {
            osmb['set'+ property](osmb['get'+ property]()+increment);
        }
    });
});
