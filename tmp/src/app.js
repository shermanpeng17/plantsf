var map = null;
var protocol = window.location.protocol === 'https:' ? 'https:' :  'http:'
var domainName = 'sfplanninggis.org';

var cors_api_host = 'cors-anywhere.herokuapp.com';
// var plantsfGISServerName = "http://" + cors_api_host + '/' + "sfplanninggis.org/arcgiswa/rest/services/PlantSFv4/MapServer";
var plantsfGISServerName = "http://sfplanninggis.org/arcgiswa/rest/services/PlantSFv4/MapServer";

var theServerName = window.location.host;



// Main global variable that stores raw return data from ArcGIS API
// Will maybe later create a function constructor for it
var plantFeatures;

// In charge of dealing with UI
var UICtrl = function(){
    var UISelectors = {
        intro: "#intro",
        loadingSpinner: "#loadSpinner",
        plantList: "#plantlist",
        printResultsLink: "#printResultsLink",
        searchResultsDisplay: "#searchResultsDisplay",
        filterSection: "#filterSection",
        shoppingCart: "#shopping-cart",
        searchResults: "#search-results",
        baseMapMenu: "",
        searchSectionButtons: ".search-section button",
        mainPage: ".main",
        searchResultSummary: "#searchResultsSummary"
    }
    var searchStr;

    /*  PRIVATE HELPER FUNCTIONS */

    // Get various plant properties (latin name, native type, common name, icon, image URL)
    function processPlantItem(plantItem) {
        var iconToAdd = {
            'CA Native': 	"<img style='PADDING-TOP: 5px; PADDING-RIGHT:3px' src='images/native-ca.png' title='California Native' alt='California Native'>",
            'SF Native': 	"<img style='PADDING-TOP: 5px; PADDING-RIGHT:3px' src='images/native-sf.png' title='San Francisco Native' alt='San Francisco Native'>" + "<img style='PADDING-TOP: 5px; PADDING-RIGHT:3px' src='images/native-ca.png' title='California Native' alt='California Native'>",
            'Exotic': 		"<img style='PADDING-TOP: 5px; PADDING-RIGHT:3px' src='images/native-ex.png' title='Non-native; exotic' alt='Non-native; exotic'>"
        }
        var plantObj = {};
        var featureAttributes = plantItem.attributes;
        var latinName = featureAttributes["Latin_Name"];
        var nativeType = featureAttributes["Climate_Appropriate_Plants"];
        var commonName = featureAttributes["Common_Name"]

        if(nativeType) {nativeType = nativeType.trim()};
        if(latinName === null) {latinName = ''};
        latinName = trim11(latinName);
        if(commonName === null) {commonName = latinName};
        var latinNameId = latinName.replace(/ /g, '_');

        var plantImageURL = 'images/plants/large/' + latinName + '01.jpg';
        var nativeTypeIcon = iconToAdd[nativeType];

        plantObj['plantLatinName'] = latinName;
        plantObj['nativeType'] = nativeType;
        plantObj['plantCommonName'] = commonName;
        plantObj['plantID'] = latinNameId;
        plantObj['nativeTypeIcon'] = nativeTypeIcon;
        plantObj['plantImageURL'] = plantImageURL;
        return plantObj
    }

    function trim11(str) {
        str = str.replace(/^\s+/, '');
        for (var i = str.length - 1; i >= 0; i--) {
            if (/\S/.test(str.charAt(i))) {
                str = str.substring(0, i + 1);
                break;
            }
        }
        return str;
    }

    // Get return data for constructing the popup window/ modal
    function updateDataModel(dataModelObject, typeToUpdate, plantID) {
        var currTypeToUpdate = dataModelObject[typeToUpdate];
        Object.values(currTypeToUpdate).forEach(function(item) {
            var returnData = '';
            if(item.label === 'Suggested for Green Connections Routes') {
                var greenConnectionRouteNumberString = plantFeatures[plantID].attributes[item.identifier]
                if(greenConnectionRouteNumberString !== 'NA') {
                    var greenConnectionNumArr = greenConnectionRouteNumberString.split(';');
                    greenConnectionNumArr.forEach(function(greenConnectionNum) {
                        returnData += 
                        `
                        <a target="_blank" href="docs/EcologyGuides_Route_${greenConnectionNum}.pdf">
                            <img src="images/gc-route${greenConnectionNum}-marker.png" width="32" height="32">
                        </a>
                        `
                    });
                } else {
                    returnData = greenConnectionRouteNumberString
                }
                return item['returnData'] = returnData
            } else if (item.label === "Appropriate Location") {
                // parse appropriate location string by removing ; and adding ,
                returnData = plantFeatures[plantID].attributes[item.identifier];
                returnData = returnData.split(';').join(', ')
                return item['returnData'] = returnData;
            } else {
                returnData = plantFeatures[plantID].attributes[item.identifier];
                returnData === null ? returnData = 'NA' : returnData = returnData;

                if(returnData.indexOf(';') !== -1) {
                    returnData = returnData.split(';').join(', ')
                }
                return item['returnData'] = returnData
            }
        });
    }

    function createElementWithClassName(elementType, className) {
        // Create elements based on element type 
        var element = document.createElement(elementType);
        element.setAttribute('class', className);
        return element;
    }

    function getPhotoPortionOfModal(modalData) {
        var latinName = modalData.names.latinName.returnData;
        var imagesContainer = createElementWithClassName('div', 'imagesContainer');
        var imageRow = createElementWithClassName('div', 'imageRow');
        var NUM_OF_PHOTOS = 4;
        var PICTURE_SIZE = 150;
        var photoCreditsObj = modalData.photos;
        

        for(var i = 0; i < NUM_OF_PHOTOS; i++) {
            var currPicture = new Image(PICTURE_SIZE, PICTURE_SIZE);
            var displayPictureLocation = `images/plants/large/${latinName}0${i+1}.jpg`;
            var currPhotoCredit = photoCreditsObj[`photo${i+1}`]
            var pictureDiv = createElementWithClassName('div', 'picture');

            // Check to see if photos exist and display if so
            // Can remove in future if all photos are there
            $.ajax({
                url: displayPictureLocation,
                type: "GET",
                async: false,
                success: function (result) {
                    var fullDisplayAnchor = createElementWithClassName('a', "");

                    var fullDisplayPictureLocation = `images/plants/full/${latinName}0${i+1}.jpg`;
                    fullDisplayAnchor.href = fullDisplayPictureLocation;

                    currPicture.src = displayPictureLocation;
                    currPicture.setAttribute('class', 'rounded')
                    fullDisplayAnchor.appendChild(currPicture);
                    fullDisplayAnchor.title = 'Photo credits: ' + currPhotoCredit;
                    fullDisplayAnchor.setAttribute('data-lightbox', 'plantDetail')
                    pictureDiv.appendChild(fullDisplayAnchor);
                    imageRow.appendChild(pictureDiv);
                },
                error: function(error) {}
            });
        }
        imagesContainer.appendChild(imageRow);
        return imagesContainer;
        
    }

    function getTablePortionOfModal(modalData) {
        var plantNamesObject = modalData.names;
        var numOfPhotoCredits = Object.keys(plantNamesObject).length;
        var textPortionContainer = createElementWithClassName('div', 'textPortion');
        var hrElement = document.createElement('HR');
        var namesSection = createElementWithClassName('div', 'familyNames');
        
        textPortionContainer.appendChild(hrElement);

        Object.values(plantNamesObject).forEach(function(name){
            if(name.label !== 'Common Name') {
                var nameDescription = document.createElement('p');
                nameDescription.setAttribute('class', 'nameDescription');
                nameDescription.innerHTML =  `<strong>${name.label}</strong>: ${name.returnData}`;
                namesSection.appendChild(nameDescription) 
            }
        });
        textPortionContainer.appendChild(namesSection)

        // textPortionContainer.appendChild(namesSection);
        var plantInformationLabel = document.createElement('h4');
        plantInformationLabel.innerText = "Plant Information";
        var tableContainer = createElementWithClassName('div', 'tableContainer');
        var plantDetail = modalData.plantDetails;

        console.log(plantDetail)

        tableContainer.innerHTML = 
        `
        <table class="table">
            <tr>
                <th scope="row">Additional Species, Cultivars and varieties: </th>
                    <td>${plantDetail.speciesVarieties.returnData}</td>
                <th scope="row">Plant Type: </th>
                    <td>Tree (deciduous)</td>
            </tr>
            <tr>
                <th scope="row">Bloom Time: </th>
                    <td>${plantDetail.bloomTime.returnData}</td>
                <th scope="row">Flower Color: </th>
                    <td>Orange, Red, Yellow</td>
            </tr>
            <tr>
                <th scope="row">Size at Maturity: </th>
                    <td>&gt; ${plantDetail.maturitySize.returnData}</td>
                <th scope="row">Appropriate Location: </th>
                    <td>${plantDetail.appropriateLocation.returnData}</td>
            </tr>
            <tr>
                <th scope="row">Watering Needs: </th>
                    <td>${plantDetail.waterNeeds.returnData}</td>
                <th scope="row">Site Conditions: </th>
                    <td>${plantDetail.siteConditions.returnData}</td>
            </tr>
            <tr>
                <th scope="row">Soil: </th>
                    <td>${plantDetail.soilType.returnData}</td>
                <th scope="row">Climate Appropriate: </th>
                    <td>${plantDetail.appropriateClimate.returnData}</td></tr>
            <tr>
                <th scope="row">Plant Communities: </th>
                    <td>${plantDetail.plantCommunities.returnData}</td>
                <th scope="row">Habitat Value: </th>
                    <td>${plantDetail.habitatValue.returnData}</td>
            </tr>
            <tr>
                <th scope="row">Associated Wildlife: </th>
                    <td>${plantDetail.associatedWildlife.returnData}</td>
                <th scope="row">Nurseries: </th>
                    <td>${plantDetail.nurseries.returnData}</td>
                </tr>
            <tr>
                <th scope="row">Suggested for Green Connections Routes: </th>
                    <td>
                        ${plantDetail.greenConnectionRoutes.returnData}
                    </td>
                <th scope="row">Approved Street Tree List: </th>
                    <td>${plantDetail.streetTreeList.returnData}</td>
            </tr>
            <tr>
                <th scope="row">Additional Characteristics: </th>
                    <td>${plantDetail.additionalCharacteristics.returnData}</td>
                <th scope="row"></th>
                    <td></td>
            </tr>
        </table>
        `
        textPortionContainer.appendChild(tableContainer);
        return textPortionContainer;
    }
    // public functions
    return {
        getUISelectors: function() {
            return UISelectors
        },
        setSearchString: function(searchString) {
            searchStr = searchString;
        },
        showHiddenSections: function() {
            document.querySelector(UISelectors.printResultsLink).style.visibility = "visible";
            document.querySelector(UISelectors.searchResultsDisplay).style.visibility = "visible";
            document.querySelector(UISelectors.filterSection).style.visibility = "visible";
            document.querySelector(UISelectors.shoppingCart).style.visibility = "visible";
            document.querySelector(UISelectors.searchResults).style.display = "block";
        },
        showPlantResults: function(responseResults) {
            // In charge of displaying the plant results
            var MAX_PLANT_NAME_LENGTH_ALLOWED = 15;
            var plantResultHtml = '';
            plantResultHtml += '<div class="container">'
            plantFeatures = responseResults.features;
            var numPlantResults = plantFeatures.length;
            var summaryOfPlantResults = '';
 
            $(UISelectors.intro).hide();
            $(UISelectors.loadingSpinner).hide();
            $(UISelectors.mainPage).removeClass('disabledDIV')
            UICtrl.showHiddenSections();
            
            for(var i = 0; i < plantFeatures.length; i++) {
                if (i === 0 ) { 
                    plantResultHtml += '<div class="row">'
                } else if (i % 3 === 0) {
                    plantResultHtml += '<div class="row">'
                }
                // Looping through each plant and get plant object that contains information about it
                var currPlantObj = processPlantItem(plantFeatures[i]);
                PlantItems.addToPlantArray(currPlantObj);

                // if (currPlantObj.plantCommonName.length > MAX_PLANT_NAME_LENGTH_ALLOWED) {
                //     currPlantObj.plantCommonName = currPlantObj.plantCommonName.slice(0, MAX_PLANT_NAME_LENGTH_ALLOWED) + '...';
                // }

                // if (currPlantObj.plantLatinName.length > MAX_PLANT_NAME_LENGTH_ALLOWED) {
                //     currPlantObj.plantLatinName = currPlantObj.plantLatinName.slice(0, MAX_PLANT_NAME_LENGTH_ALLOWED) + '...';
                // }
         
                plantResultHtml += 
                `
                    <div class="col-md-4 col-sm-4 plant-photos" style="display:flex" data-itemid='${currPlantObj.plantID}' >
                        <div class="plant-image-container"><img  onClick="UICtrl.showPlantDetail('${i}')" src="${currPlantObj.plantImageURL}" alt="${currPlantObj.plantLatinName}"></div>
                        <div class="plant-description" style="display:inline-block">
                            <a href="javascript:void(0)" onClick="UICtrl.showPlantDetail('${i}')">${currPlantObj.plantCommonName}</a>
                            <br>
                            <p>${currPlantObj.plantLatinName}</p>
                            ${currPlantObj.nativeTypeIcon}
                            <button  class="btn btn-link"><i class="fas fa-shopping-cart shop"></i></button>
                        </div>
                    </div>
                `
                if (i % 3 === 2) {
                    // End of row
                    plantResultHtml += '</div>'
                }   
            }

            summaryOfPlantResults += 
                `
                    Found <b> ${numPlantResults} </b> plants for ${searchStr}<br>
                    <p class="print-instructions">
                        Click "Print" to save/print a shopping list and then give this list to your landscaper or take it down
                        to your local nursery
                    </p>
                    
                `;
            document.querySelector(UISelectors.searchResultSummary).innerHTML = summaryOfPlantResults;

            plantResultHtml += '</div>'
            document.querySelector(UISelectors.plantList).innerHTML = plantResultHtml;
        }, 
        showPlantDetail: function(plantID) {
            // information about plant each time a plant is pressed
            dataToConstructModal = {
                names: {
                    commonName: {
                        label: 'Common Name',
                        identifier: 'Common_Name'
                    },
                    latinName: {
                        label: 'Latin Name',
                        identifier: 'Latin_Name'
                    },
                    formerLatinName: {
                        label: 'Former Latin Name',
                        identifier: 'Former_Latin_Name'
                    },
                    familyName: {
                        label: 'Family Name',
                        identifier: 'Family_Name'
                    }
                },
                plantDetails: {
                    speciesVarieties: {
                        label: 'Additional Species, Cultivars and varieties',
                        identifier: 'Additional_Species_Cultivars_Varieties'
                    },
                    plantType: {
                        label: 'Plant Type',
                        identifier: 'Plant_Type'
                    },
                    bloomTime: {
                        label: 'Bloom Time',
                        identifier: 'Bloom_Time'
                    },
                    flowerColor: {
                        label: 'Flower Color',
                        identifier: 'Flower_Color'
                    },
                    maturitySize: {
                        label: 'Size at Maturity',
                        identifier: 'Size_at_Maturity'
                    },
                    appropriateLocation: {
                        label: 'Appropriate Location',
                        identifier: 'Appropriate_Location'
                    },
                    waterNeeds: {
                        label: 'Water Needs',
                        identifier: 'Water_Needs'
                    },
                    siteConditions: {
                        label: 'Site Conditions',
                        identifier: 'Suitable_Site_Conditions'
                    },
                    soilType: {
                        label: 'Soil',
                        identifier: 'Soil_Type'
                    },
                    appropriateClimate: {
                        label: 'Climate Appropriate', 
                        identifier: 'Climate_Appropriate_Plants'
                    },
                    plantCommunities: {
                        label: 'Plant Communities',
                        identifier: 'Plant_Communities'
                    },
                    habitatValue: {
                        label: 'Habitat',
                        identifier: 'Habitat_Value'
                    },
                    associatedWildlife: {
                        label: 'Associated Wildlife',
                        identifier: 'Associated_Wildlife'
                    },
                    nurseries: {
                        label: 'Nurseries',
                        identifier: 'Nurseries'
                    },
                    greenConnectionRoutes: {
                        label: 'Suggested for Green Connections Routes',
                        identifier: 'Suggested_Green_Connection_Routes'
                    },
                    streetTreeList: {
                        label: 'Approved Street Tree List',
                        identifier: 'Street_Tree_List'
                    },
                    additionalCharacteristics: {
                        label: 'Additional Characteristics',
                        identifier: 'Additional_Characteristices_Notes'
                    }
                },
                photos: {
                    photo1: {
                        label: 'photo1',
                        identifier: 'PhotoCredit01'
                    },
                    photo2: {
                        label: 'photo2',
                        identifier: 'PhotoCredit02'
                    },
                    photo3: {
                        label: 'photo3',
                        identifier: 'PhotoCredit03'
                    },
                    photo4: {
                        label: 'photo4',
                        identifier: 'PhotoCredit04'
                    }
                }
            }
            
            photosObject = dataToConstructModal.photos;
            namesObject = dataToConstructModal.names;
            // grab return data for photos, names, and plantDetails to construct popup/modal
            updateDataModel(dataToConstructModal, 'photos', plantID);
            updateDataModel(dataToConstructModal, 'names', plantID);
            updateDataModel(dataToConstructModal, 'plantDetails', plantID);

            // html for photos portion of modal
            var picturePortionOfModal = getPhotoPortionOfModal(dataToConstructModal);
            // html for photos portion of modal
            var tablePortionOfModal = getTablePortionOfModal(dataToConstructModal);
            var modalContainer = createElementWithClassName('div', 'container');
            modalContainer.appendChild(picturePortionOfModal);
            modalContainer.appendChild(tablePortionOfModal);

            $('#plantInfoModelContent').html(modalContainer);
            var modalTitle = document.createElement('H3');
            modalTitle.innerText = dataToConstructModal.names.commonName.returnData;

            $('#plantInfoModal').modal('show');
        },
        addToCustomListUI: function(plantObject) {

        }
    }
}();

// Main app controller
const App = function(){
    var UISelectors = UICtrl.getUISelectors();
    require([
        "esri/layers/WebTileLayer",
        "esri/Map",
        "esri/config",
        "esri/core/urlUtils",
        "esri/layers/FeatureLayer",
        "esri/Basemap",
        "esri/Graphic",
        "esri/layers/TileLayer",
        "esri/layers/support/ImageParameters",
    
        "dijit/TitlePane",
        "esri/widgets/BasemapToggle",
        "esri/layers/MapImageLayer",
        "esri/layers/GroupLayer",
    
        "esri/tasks/support/IdentifyParameters",
        "esri/tasks/IdentifyTask",
        "esri/tasks/QueryTask",
        "esri/tasks/support/Query",
        "esri/symbols/PictureMarkerSymbol",
    
        "esri/widgets/LayerList",
        "esri/views/MapView",
        "esri/widgets/BasemapGallery",
        "dijit/layout/BorderContainer", 
        "dijit/form/Button",
        "dijit/layout/ContentPane",
        "dijit/form/DropDownButton",
        "dijit/DropDownMenu",
        "dijit/Menu",
        "dijit/MenuItem",
        "dojo/_base/array",
        "dojo/_base/connect",
    
        "dojo/on",
        "dojo/ready",
        "dojo/dom",
        "dojo/domReady!",
        ], function(WebTileLayer, Map, esriConfig, urlUtils, FeatureLayer, Basemap, Graphic, TileLayer, ImageParameters, TitlePane, BasemapToggle, MapImageLayer, 
        GroupLayer, IdentifyParameters,IdentifyTask, QueryTask, Query, PictureMarkerSymbol, LayerList, MapView, BasemapGallery, BorderContainer, Button, ContentPane, 
        DropDownButton, DropDownMenu, Menu, MenuItem, array, connect, on, ready, dom  ) {
        var mapImageLayers, identifyTask;
        // variable for storing plant features from return data
    
        // esriConfig.defaults.geometryService = new esri.tasks.GeometryService( protocol + "://" + theServerName +"/arcgiswa/rest/services/Utilities/Geometry/GeometryServer");
        // esri.config.defaults.io.alwaysUseProxy = false;

        // esriConfig.defaults.io.proxyRules.push({
        //     urlPrefix: theServerName +"/arcgiswa/rest/services",
        //     proxyUrl: "//" + theServerName + "/proxy/DotNet/proxy.ashx"
        // });

        // console.log(esriConfig)
        // esriConfig.request.proxyUrl = "//sfplanninggis.org/proxy/DotNet/proxy.ashx";

        // console.log(theServerName)
        // urlUtils.addProxyRule({
        //     urlPrefix:  "http://sfplanninggis.org/arcgiswa/rest/services",
        //     proxyUrl: "//sfplanninggis.org/proxy/DotNet/proxy.ashx"
        // });

        var basemapDropdown = document.getElementById("basemap-select");
    
        basemapDropdown.addEventListener("change", changeBasemap);
    
        var greenConnectionLayer = new FeatureLayer({
            url: "http://sfplanninggis.org/arcgiswa/rest/services/PlantSFv4/MapServer/3",
            // url: "http://" + cors_api_host + '/' + "sfplanninggis.org/arcgiswa/rest/services/PlantSFv4/MapServer/3",
            // visible: false
        });
    
        var plantCommunities = new FeatureLayer({
            url: "http://sfplanninggis.org/arcgiswa/rest/services/PlantSFv4/MapServer/12",
            // url: "http://" + cors_api_host + '/' + "sfplanninggis.org/arcgiswa/rest/services/PlantSFv4/MapServer/12",
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
    
        map = new Map({
            basemap: "topo-vector",
        });	
        
        var view = new MapView({
            container: "map_canvas",
            map: map,
            center: [-122.4425, 37.754],
            zoom: 11
        });  
    
        (function (){
            var imageParams = new ImageParameters();
            imageParams.layerIds = [9999];
    
    
            mapImageLayers = new MapImageLayer({
                url: plantsfGISServerName,
                imageTransparency: true,
                visible: false
            });
    
            map.add(mapImageLayers)
    
            // var dynamicMap = new esri.layers.ArcGISDynamicMapServiceLayer(theArcGISServerName, { "opacity": 0.75, "imageParameters": imageParams });
            view.on("click", handleMapClick);
    
        })();
    
        // Handle clicks on the map
        function handleMapClick(event) {
            identifyTask = new IdentifyTask(plantsfGISServerName);
            identifyParameters = new IdentifyParameters();
    
            identifyParameters.tolerance = 3;
            identifyParameters.geometry = event.mapPoint;
            identifyParameters.returnGeometry = false;
            // identifyParameters.layerIds = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
            identifyParameters.layerOption = "all";
            identifyParameters.width = view.width;
            identifyParameters.height = view.height;
            identifyParameters.mapExtent = view.extent;
            var theGeom = event.mapPoint;
    
            var source = new Proj4js.Proj("EPSG:102113");
            var dest = new Proj4js.Proj("WGS84");
            var p = new Proj4js.Point(theGeom.x, theGeom.y);
            Proj4js.transform(source, dest, p);
    
            var symbol = {
                type: 'picture-marker',
                url: 'images/greenMarker.png',
                height: '32px',
                width: '32px',
            }
            symbol.yoffset = "14px";
    
            view.graphics.removeAll()
            
            var graphic = new Graphic(theGeom, symbol);
            view.graphics.add(graphic)
            identifyClick(theGeom)
        }
    
        // identify what is clicked
        function identifyClick(pointGeometry) {
            console.log('in identify click button')
            var leftSFRangeX = -13638091;
            var rightSFRangeX = -13620761;
            var upperSFRangeY = 4556181;
            var lowerSFRangeY = 4538163
    
            if(pointGeometry.x < leftSFRangeX || pointGeometry.x > rightSFRangeX || pointGeometry.y > upperSFRangeY || pointGeometry.y < lowerSFRangeY) {
                var theTitle = "You Clicked Outside San Francisco"
                var theMessage = "This is a plant database for San Francisco microclimates and plant communities. Please click on a location within San Francisco."
                new Messi(theMessage, { title: theTitle, modal: true, titleClass: 'info', buttons: [{ id: 0, label: 'OK' }] });
                return;
            }
    
            identifyTask.execute(identifyParameters)
                .then(function(response) {
                    resolveResponsePlantData(response.results)
                });
        }
        
        // get response plant data from click and display in UI
        function resolveResponsePlantData(responseResults) {
            var sqlStatement = '"Plant_Communities"' + " like '%All%'";
            var plantListTableURL = plantsfGISServerName + '/13';
            var queryTask = new QueryTask({
                url: plantListTableURL
            });
            var query = new Query({
                outFields: ["Common_Name", "PhotoCredit01", "PhotoCredit02", "PhotoCredit03", "PhotoCredit04", "Latin_Name", "Family_Name", "Additional_Species_Cultivars_Varieties", "Former_Latin_Name", "Plant_Type", "Plant_Communities", "Bloom_Time", "Appropriate_Location", "Flower_Color", "Size_at_Maturity", "Climate_Appropriate_Plants", "Suitable_Site_Conditions", "Soil_Type", "Pruning_Needs", "Water_Needs", "Habitat_Value", "Associated_Wildlife", "Additional_Characteristices_Notes", "Street_Tree_List", "Suggested_Green_Connection_Routes", "Stormwater_Benefit", "Nurseries", "Super60", "Super60_int", "Thrifty150_int", "Top20_int"],
                returnGeometry: false
            });
            for(var i = 0; i < responseResults.length; i++) {
                var currResult = responseResults[i];
                if(currResult.layerName === "Habitats Merged"){
                    if(currResult.feature.attributes["Habitat"] !== null) {
                        sqlStatement += " or " + ' UPPER("Plant_Communities")' + " like '%" + currResult.feature.attributes["Habitat"].toUpperCase() + "%'";
                    }
                }
            }
            query.where = sqlStatement;
            queryTask.execute(query).then(UICtrl.showPlantResults)
        }
    });

    function performPlantSearch(searchString) {
        // search string will determine what type of data to get from GIS API
        // sql needed to perform search also depends on the searchString
        var sqlMapping = {
            "All Plants": "(1=1)",
            "SF Natives": "Climate_Appropriate_Plants in ( 'SF Native' , 'SF Native ' )",
            "Habitat Plants": "(Habitat_int = 1)",
            "Stormwater": "(Sandy_Soil_int = 1)",
            "Urban Forest Council Street TreeList": "(1=1) and (  (\"Habitat_Value\" like \'%Pollinator%\' )  or  (\"Habitat_Value\" like \'%;%\' )  ) ",
            "Thrifty150": "(Thrifty150_int = 1)",
            "Sidewalk Landscaping": "(Sidewalk_Landscaping_Plants_int = 1)",
            "Sandy Soil": "(Sandy_Soil_int = 1)",
            "Shady Clay": "(Shady_Clay_int = 1)",
            "Super60": "(Super60_int = 1)",
            "Top20": "(Top20_int = 1)"
        }

        var plantSql = sqlMapping[searchString];
        require([
            "esri/tasks/QueryTask","esri/tasks/support/Query",           
            "dojo/dom", "dojo/on", "dojo/domReady!"
        ], 
        function (QueryTask, Query, dom, on) {
            var plantListTableURL = plantsfGISServerName + '/13';
            var plantQuery = new Query({
                outFields: ["Common_Name", "Latin_Name", "Family_Name", "Former_Latin_Name", "Plant_Type", "Plant_Communities", "Bloom_Time", "Appropriate_Location", "Flower_Color", "Size_at_Maturity", "Climate_Appropriate_Plants", "Suitable_Site_Conditions", "Soil_Type", "Pruning_Needs", "Water_Needs", "Habitat_Value", "Associated_Wildlife", "Additional_Characteristices_Notes", "Street_Tree_List", "Suggested_Green_Connection_Routes", "PhotoCredit01", "PhotoCredit02", "PhotoCredit03", "PhotoCredit04", "Stormwater_Benefit", "Nurseries", "Additional_Species_Cultivars_Varieties"],
                returnGeometry: false,
                where: plantSql
            });
            var queryTask = new QueryTask({
                url: plantListTableURL
            });            
            // queryTask.execute(plantQuery).then(UICtrl.showPlantResults);
            queryTask.execute(plantQuery).then(function(results) {
                UICtrl.setSearchString(searchString);
                UICtrl.showPlantResults(results); 
            })
        });

    }

    function addPlantToCustomList(event) {
        var parentDiv = event.target.parentElement.parentElement.parentElement;
        var currPlantId = parentDiv.getAttribute('data-itemid');
        var allPlantsArr = PlantItems.getPlantsArray()
        var matchingPlantItem = allPlantsArr.filter(function(plantItem) {
            return currPlantId === plantItem.plantID;
        });
        if(!CustomPlantList.plantInCustomList(currPlantId)) {
            CustomPlantList.addTocustomPlantList(matchingPlantItem)
        } else {
            console.log('Plant already in custom list!');
        }
    }

    function handleClick(event) {
        if(event.target.className.includes('shop')) {
            addPlantToCustomList(event)
        } else {

        }
    }

    function listenForEvents() {
        $('.search-section button').on('click', function(event) {
            $(UISelectors.loadingSpinner).show();
            $('.main').addClass('disabledDIV');
            var searchValue = event.target.getAttribute('value')
            performPlantSearch(searchValue)
        });

        document.addEventListener('click', handleClick);

        // add event listener for plant detail later using event delegation 
    }

    return {
        init: function() {
            listenForEvents();
        }
    }
}(UICtrl, PlantItems, CustomPlantList);

var PlantItems = function() {
    // This will hold all cleaned-up plant items
    var plantsArray = []
    return {
        addToPlantArray: function(plantItem) {
            plantsArray.push(plantItem);
        },
        getPlantsArray: function() {
            return plantsArray;
        }
    }
}()

var CustomPlantList = function() {
    // This will hold all the custom plant items that the user wants
    var customPlantListArr = [];

    return {
        addTocustomPlantList: function(plantItem) {
            customPlantListArr.push(plantItem);
        },
        getCustomPlantList: function() {
            return customPlantListArr;
        },
        plantInCustomList(idOfPlant) {
            console.log(customPlantListArr)

            // return true if plant already in custom list else false
            console.log(idOfPlant)
            var plantMatchArr = customPlantListArr.filter(function(plantItem) {
                return idOfPlant === plantItem.plantID;
            });
            console.log(plantMatchArr)
            return plantMatchArr.length > 0 ? true : false;
            var protocol = window.location.protocol === 'https:' ? 'https:' :  'http:'

        }
    }
}();



App.init();