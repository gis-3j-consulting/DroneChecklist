require([
    "esri/Map",
    "esri/views/MapView",
    "esri/Graphic",
    "esri/widgets/Locate",
    "esri/layers/GraphicsLayer",
    "esri/layers/FeatureLayer"
], function(Map, MapView, Graphic, Locate, GraphicsLayer, FeatureLayer) {
    const map = new Map({
        basemap: "topo-vector"
    });
    const view = new MapView({
        container: "map",
        map: map,
        center: [-122.805, 45.487],
        zoom: 9
    });

    var locateWidget = new Locate({
        view: view,
        useHeadingEnabled: false,
        goToOverride: function(view, options) {
        options.target.scale = 1500;
        return view.goTo(options.target);
        }
    });
   
    const graphicsLayer = new GraphicsLayer();
    map.add(graphicsLayer);
   
    const flightLayer = new FeatureLayer({
        url: "https://services3.arcgis.com/pZZTDhBBLO3B9dnl/arcgis/rest/services/Drone_flights/FeatureServer/0",
        outFields: ["*"]
    });
   
    let selectedPoint = null;

    function saveMapPoint() {
        if (selectedPoint) {
            const mapData = {
                point: {
                    longitude: selectedPoint.longitude,
                    latitude: selectedPoint.latitude
                },
                description: document.getElementById("coordinates-description").innerText
            };
            localStorage.setItem('mapData', JSON.stringify(mapData));
        }
    }

    function restoreMapPoint() {
        const savedMapData = localStorage.getItem('mapData');
        if (savedMapData) {
            const mapData = JSON.parse(savedMapData);
            if (mapData.point) {
                const point = {
                    type: "point",
                    longitude: mapData.point.longitude,
                    latitude: mapData.point.latitude
                };

                const pointGraphic = new Graphic({
                    geometry: point,
                    symbol: {
                        type: "simple-marker",
                        color: "red",
                        size: "8px"
                    }
                });

                graphicsLayer.removeAll();
                graphicsLayer.add(pointGraphic);
                selectedPoint = point;

                const coordinateDescription = document.getElementById("coordinates-description");
                if (coordinateDescription && mapData.description) {
                    coordinateDescription.innerText = mapData.description;
                }
            }
        }
    }
   
    view.on("click", function(event) {
        const coordinateDescription = document.getElementById("coordinates-description");
        graphicsLayer.removeAll();
       
        const currentLongitude = event.mapPoint.longitude;
        const currentLatitude = event.mapPoint.latitude;
       
        const point = {
            type: "point",
            longitude: currentLongitude,
            latitude: currentLatitude
        };
       
        const pointGraphic = new Graphic({
            geometry: point,
            symbol: {
                type: "simple-marker",
                color: "red",
                size: "8px"
            }
        });
       
        graphicsLayer.add(pointGraphic);
        selectedPoint = point;
        console.log(`Point added at longitude: ${currentLongitude}, latitude: ${currentLatitude}`);
        coordinateDescription.innerText = `Coords: ${currentLatitude.toFixed(3)}, ${currentLongitude.toFixed(3)}`;
        
        saveMapPoint();
    });

    function clearMapData() {
        localStorage.removeItem('mapData');
        graphicsLayer.removeAll();
        selectedPoint = null;
        const coordinateDescription = document.getElementById("coordinates-description");
        if (coordinateDescription) {
            coordinateDescription.innerText = '';
        }
    }

    window.addEventListener('load', restoreMapPoint);
    
    document.getElementById('clear-all-button').addEventListener('click', clearMapData);

    function saveFlight() {
        if (!selectedPoint) {
            console.error('No point selected on map');
            alert('No point selected on map');
            return;
        }
        const checkedBoxes = Array.from(document.querySelectorAll('input[type="checkbox"]:checked'))
            .map(checkbox => checkbox.id)
            .join(',');
       
        const date = document.getElementById('Date').value;
        const time = document.getElementById('time').value;
       
        if (!date || !time) {
            console.error('Date and time are required');
            return;
        }
        const dateTime = new Date(`${date}T${time}`).getTime();
       
        const geometry = {
            type: "point",
            longitude: selectedPoint.longitude,
            latitude: selectedPoint.latitude,
            spatialReference: { wkid: 4326 }
        };
       
        const attributes = {
            pilot: document.getElementById('pilot').value,
            project: document.getElementById('project').value,
            FlightTime: dateTime,
            weather: window.selectedWeather.join(','),
            checklistItems: checkedBoxes,
            altitude: document.getElementById('altitude').value,
            incident: document.getElementById('incident-description').value
        };
       
        const graphic = new Graphic({
            geometry: geometry,
            attributes: attributes
        });
        flightLayer.applyEdits({
            addFeatures: [graphic]
        }).then(function(result) {
            if (result.addFeatureResults.length > 0) {
                console.log('Flight saved successfully:', attributes);
                alert('Flight saved successfully! ✔️');
                window.location.reload();
            } else {
                console.error("No features were added");
            }
        }).catch(function(error) {
            console.error('Error saving flight: ', error);
        });
    }
    document.getElementById('save-flight').addEventListener('click', saveFlight);

    view.ui.add(locateWidget, "top-left");
});