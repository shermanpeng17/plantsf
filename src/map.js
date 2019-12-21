function map() {
    require([
        "esri/layers/WebTileLayer",
        "esri/Map",
        "esri/layers/FeatureLayer",
        "esri/Basemap",
        "esri/layers/TileLayer",
        "esri/layers/support/ImageParameters",
    
        "dijit/TitlePane",
        "esri/widgets/BasemapToggle",
        "esri/layers/MapImageLayer",
        "esri/layers/GroupLayer",
        "esri/widgets/LayerList",
        "esri/views/MapView",
        "esri/widgets/BasemapGallery",

        "dijit/layout/BorderContainer", 
     
        "dojo/_base/array",
        "dojo/_base/connect",
    
        "dojo/on",
        "dojo/ready",
        "dojo/dom",
        "dojo/domReady!",
        ], function(WebTileLayer, Map, FeatureLayer, Basemap, TileLayer, ImageParameters, TitlePane, BasemapToggle, MapImageLayer, 
        GroupLayer, LayerList, MapView, BasemapGallery, BorderContainer, array, connect, on, ready, dom  ) {
    
        var basemapDropdown = document.getElementById("basemap-select");
    
        basemapDropdown.addEventListener("change", changeBasemap);
    
    
        var greenConnectionLayer = new FeatureLayer({
            url: "http://50.17.237.182/arcgiswa/rest/services/PlantSFv4/MapServer/3",
            visible: false
        });
    
        var plantCommunities = new FeatureLayer({
            url: "http://50.17.237.182/arcgiswa/rest/services/PlantSFv4/MapServer/12",
            visible: false
        })
    
        function changeBasemap(event){
            var baseMapValue = basemapDropdown.value;
            if(baseMapValue === 'green-connections') {
                console.log('green connections')
    
                if(greenConnectionLayer.visible) {
                    // map.layers.add(greenConnectionLayer)
                    map.remove(greenConnectionLayer)
                    greenConnectionLayer.visible = false
    
                } else {
                    map.add(greenConnectionLayer)
                    greenConnectionLayer.visible = true
                }
            } else if (baseMapValue === 'plant-communities') {
                if(plantCommunities.visible) {
                    // map.layers.add(plantCommunities)
                    map.remove(plantCommunities)
                    plantCommunities.visible = false
    
                } else {
                    map.add(plantCommunities)
                    plantCommunities.visible = true
                }
            } else {
                view.map.basemap = baseMapValue;
            } 
        }
    
    
    
        var basemapGroupLayer = new GroupLayer({
            title: "Layers",
            visible: true,
            visibilityMode: "exclusive",
            opacity: 0.75
        });
    
        var map = new Map({
            basemap: "topo-vector",
        });							
    
    
        var view = new MapView({
            container: "map_canvas",
            map: map,
            center: [-122.4425, 37.754],
            zoom: 11
        });  
    });
}

module.exports = {
    map
}