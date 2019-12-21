
var protocol = window.location.protocol === 'https:' ? 'https:' : 'http:'
var url = 'http://127.0.0.1:5501/';
var SERVER_NAME = window.location.host;

// In charge of dealing setting and getting base search and filter search for display in results summary
var SearchCtrl = function () {
    var baseSearchString;
    var addtionalSearchString;
    var searchSummary;
    var baseGreenConnectionHtml = '<h3 class="green-connection-summary">This location is near a <strong>Green Connections</strong> route: <a href="green-connections.html" target="_blank"><img src="images/question-mark.png" alt="What is a Green Connection? Learn more..." width="12" height="12" border="0" /></a></h2>';
    var finalGreenConnectionHtml;
    var isNotAtGreenConnectionHtml = '<h3 class="green-connection-summary">This location is not near a <strong>Green Connections</strong> route. <a href="green-connections.html"><img src="images/question-mark.png" alt="What is a Green Connection? Learn more..." width="12" height="12" border="0" /></a></h2>'
    var onGreenConnectionRoute;
    return {
        setBaseSearchString: function (str) {
            baseSearchString = str;
        },
        getBaseSearchString: function () {
            return baseSearchString;
        },
        setAdditionalSearchString: function (str) {
            var searchFilterItems = str.split('@').slice(1);
            searchFilterItems = searchFilterItems.map(function (item) {
                item = item.trim();
                return item.slice(0, item.length - 1)
            });
            addtionalSearchString = searchFilterItems.join('; ');
        },
        getAddtionalSearchString: function () {
            return addtionalSearchString;
        },
        setSearchSummary: function (str) {
            searchSummary = str;
        },
        getSearchSummary: function () {
            return searchSummary;
        },
        setGreenConnectionHtml: function (greenConnectionString) {
            var tempGreenConnectionStringHolder = baseGreenConnectionHtml
            tempGreenConnectionStringHolder += '<br>'
            var greenConnectionNumArr = greenConnectionString.split('/');
            greenConnectionNumArr.forEach(function (routeNum) {
                tempGreenConnectionStringHolder += '<a target="_blank" href="docs/EcologyGuides_Route_' + routeNum + '.pdf"><img src="images/gc-route' + routeNum + '-marker.png" height="32" align="absmiddle" /></a>&nbsp; '
            });
            finalGreenConnectionHtml = tempGreenConnectionStringHolder;
        },
        setGreenConnectionBoolean: function (bool) {
            onGreenConnectionRoute = bool;
        },
        isOnGreenConnectionRoute: function () {
            return onGreenConnectionRoute;
        },
        getIsAtGreenConnectionHtml: function () {
            return finalGreenConnectionHtml;
        },
        getIsNotAtGreenConnectionHtml: function () {
            return isNotAtGreenConnectionHtml;
        }
    }
}();


// In charge of constructing the appropriate sql statements and anything sql related
var SqlCtrl = function () {

    var overAllSqlStatement;

    var sqlMappingForDefinedLists = {
        "All Plants": "(1=1)",
        "SF Natives": "Climate_Appropriate_Plants in ( 'SF Native' , 'SF Native ' )",

        "Habitat Plants": "(Habitat_int = 1)",
        "Stormwater": " (Stormwater_int = 1) ",
        "Urban Forest Council Street TreeList": " (1=1) and (  \"Plant_Type\" in (\'Tree (evergreen)\'  , \'Tree (deciduous)\' )  and (  (\"Appropriate_Location\" like \'%Sidewalk%\' ) )  ) ",
        "Thrifty150": "(Thrifty150_int = 1)",
        "Sidewalk Landscaping": "(Sidewalk_Landscaping_Plants_int = 1)",
        "Sandy Soil": "(Sandy_Soil_int = 1)",
        "Shady Clay": "(Shady_Clay_int = 1)",
        "Super60": "(Super60_int = 1)",
        "Top20": "(Top20_int = 1)"
    }

    var plantCommunitySqlMapping = {
        'grasslandprairie': ' UPPER("Plant_Communities") like ' + "'%GRASSLAND/PRAIRIE%' ",
        'coastalscrub': ' UPPER("Plant_Communities") like ' + "'%COASTAL SCRUB%' ",
        'chaparral': ' UPPER("Plant_Communities") like ' + "'%CHAPARRAL%' ",
        'dunes': ' UPPER("Plant_Communities") like ' + "'%DUNES%' ",
        'wetland': ' UPPER("Plant_Communities") like ' + "'%WETLAND%' ",
        'riparian': ' UPPER("Plant_Communities") like ' + "'%RIPARIAN%' ",
        'woodland': ' UPPER("Plant_Communities") like ' + "'%WOODLAND%' ",
        'saltMarsh': ' UPPER("Plant_Communities") like ' + "'%SALT MARSH%' ",
    }

    return {

        getPlantCommunitySqlMapping: function() {
            return plantCommunitySqlMapping
        },

        getSqlMappingForDefinedLists: function() {
            return sqlMappingForDefinedLists;
        },

        setOverallSqlStatement: function(str) {
            overAllSqlStatement = str;
        },
        getOverAllSqlStatement: function () {
            return overAllSqlStatement;
        },
        /*
            This function combines the base sql with additional sql and then performs the search
        */
        combineBaseSqlWithFilterSqlAndSearch: function (baseSql) {
            var plantFilterSql = '(1=1)';
            var plantTypeIds = ['type1', 'type2', 'type3', 'type4', 'type5', 'type6', 'type7', 'type8', 'type9', 'type10'];
            var bloomTypes = ['bloom1', 'bloom2', 'bloom3', 'bloom4'];
            var sizeTypes = ['size1', 'size2', 'size3', 'size4', 'size5', 'size6'];
            var waterTypes = ['watering1', 'watering2', 'watering3'];
            var appropriateLocationType = ['approp1', 'approp2', 'approp4', 'approp5', 'approp6'];
            var habitatType = ['habitat1', 'habitat2', 'habitat3', 'habitat4', 'habitat5', 'habitat6'];
            var nativeType = ['native1', 'native2'];
            var soilType = ['soil1', 'soil2', 'soil3', 'soil4'];
            var siteType = ['sitecond1', 'sitecond2', 'sitecond3'];

            // Variable for to store each type checked under the filter categories 
            var choicesInCategoryForSql = '';

            // Variable for storing the types of filter selected, which then will later
            // be stored in the search result summary 
            var filterStringSummary = '';
            var choicesSelected = '';

            plantTypeIds.forEach(function (plantTypeId) {
                var currSelectionValue = document.getElementById(plantTypeId).value;
                if (document.getElementById(plantTypeId).checked) {
                    if (choicesInCategoryForSql) {
                        choicesInCategoryForSql += ', '
                    }

                    choicesInCategoryForSql += "'" + currSelectionValue + "'";
                    choicesSelected += currSelectionValue + ', ';
                }
            });


            if (choicesInCategoryForSql) {
                plantFilterSql += ' and ('
                plantFilterSql += ' "Plant_Type" in (' + choicesInCategoryForSql + ') ) '
                filterStringSummary += '@Plant Types - ' + choicesSelected;
                choicesInCategoryForSql = '';
                choicesSelected = '';
            }
            bloomTypes.forEach(function (plantTypeId) {
                var currSelectionValue = document.getElementById(plantTypeId).value;
                if (document.getElementById(plantTypeId).checked) {
                    if (choicesInCategoryForSql) {
                        choicesInCategoryForSql += ' or '
                    }
                    choicesSelected += currSelectionValue + ', ';
                    choicesInCategoryForSql += "(Bloom_Time like '%" + currSelectionValue + "%')"
                    // choicesInCategoryForSql += ` (Bloom_Time like '%${currSelectionValue}%')`
                }
            });

            if (choicesInCategoryForSql) {
                plantFilterSql += 'and ('
                plantFilterSql += choicesInCategoryForSql + ')';
                filterStringSummary += '@Bloom Time - ' + choicesSelected + ' ';
                choicesInCategoryForSql = '';
                choicesSelected = '';
            }

            sizeTypes.forEach(function (plantTypeId) {
                var currSelectionValue = document.getElementById(plantTypeId).value;
                if (document.getElementById(plantTypeId).checked) {
                    choicesSelected += currSelectionValue + ', ';
                    if (choicesInCategoryForSql) {
                        choicesInCategoryForSql += ' or '
                    }
                    choicesInCategoryForSql += " (Size_At_Maturity like '%" + currSelectionValue + "%')"
                    // choicesInCategoryForSql += ` (Size_At_Maturity like '%${currSelectionValue}%') `
                }
            })
            if (choicesInCategoryForSql) {
                plantFilterSql += 'and ('
                plantFilterSql += choicesInCategoryForSql + ')';
                filterStringSummary += '@Maturity Size - ' + choicesSelected + ' ';
                choicesInCategoryForSql = '';
                choicesSelected = '';
            }

            waterTypes.forEach(function (plantTypeId) {
                var currSelectionValue = document.getElementById(plantTypeId).value;
                if (document.getElementById(plantTypeId).checked) {
                    if (choicesInCategoryForSql) {
                        choicesInCategoryForSql += ' or '
                    }
                    choicesSelected += currSelectionValue + ', ';
                    choicesInCategoryForSql += " (Water_Needs like '%" + currSelectionValue + "%')";
                    // choicesInCategoryForSql += ` (Water_Needs like '%${currSelectionValue}%')`
                }
            });

            if (choicesInCategoryForSql) {
                plantFilterSql += 'and ('
                plantFilterSql += choicesInCategoryForSql + ')';
                filterStringSummary += '@Water Needs - ' + choicesSelected + ' ';
                choicesInCategoryForSql = '';
                choicesSelected = '';
            }

            appropriateLocationType.forEach(function (plantTypeId) {
                var currSelectionValue = document.getElementById(plantTypeId).value;
                if (document.getElementById(plantTypeId).checked) {
                    choicesSelected += currSelectionValue + ', ';
                    if (choicesInCategoryForSql) {
                        choicesInCategoryForSql += ' or '
                    }
                    if (plantTypeId === 'approp5') {
                        choicesInCategoryForSql += ' ("Stormwater_Benefit" like ' + "'%Yes%' ) "
                    } else if (plantTypeId === 'appro65') {
                        choicesInCategoryForSql += ' ((Size_At_Maturity like ' + "'%< 1 ft%') or " + ' (Size_At_Maturity like ' + "'%1-3 ft%') or " + ' (Size_At_Maturity like ' + "'%4-6 ft%')) and Water_Needs like '%None%'"
                    } else {
                        choicesInCategoryForSql += "(Appropriate_Location like '%" + currSelectionValue + "%')";
                        // choicesInCategoryForSql += ` (Appropriate_Location like '%${currSelectionValue}%')`

                    }
                }
            });

            if (choicesInCategoryForSql) {
                plantFilterSql += 'and ('
                plantFilterSql += choicesInCategoryForSql + ')';
                filterStringSummary += '@Appropriate Location - ' + choicesSelected + ' ';
                choicesInCategoryForSql = '';
                choicesSelected = '';
            }

            habitatType.forEach(function (plantTypeId) {
                var currSelectionValue = document.getElementById(plantTypeId).value;
                if (document.getElementById(plantTypeId).checked) {
                    choicesSelected += currSelectionValue + ', ';
                    if (choicesInCategoryForSql) {
                        choicesInCategoryForSql += ' or '
                    }
                    choicesInCategoryForSql += " (Habitat_Value like '%" + currSelectionValue + "%')";
                    // choicesInCategoryForSql += ` (Habitat_Value like '%${currSelectionValue}%')`
                }
            });

            if (choicesInCategoryForSql) {
                plantFilterSql += 'and ('
                plantFilterSql += choicesInCategoryForSql + ')';
                filterStringSummary += '@Habitat Value - ' + choicesSelected + ' ';
                choicesInCategoryForSql = '';
                choicesSelected = '';
            }

            nativeType.forEach(function (plantTypeId) {
                var currSelectionValue = document.getElementById(plantTypeId).value;
                if (document.getElementById(plantTypeId).checked) {
                    choicesSelected += currSelectionValue + ', ';
                    if (choicesInCategoryForSql) {
                        choicesInCategoryForSql += ' or '
                    }
                    if (plantTypeId === 'native1') {
                        choicesInCategoryForSql += ' "Climate_Appropriate_Plants" = ' + "'SF Native'"
                    } else if (plantTypeId === 'native2') {
                        choicesInCategoryForSql += ' "Climate_Appropriate_Plants" = ' + "'CA Native'" + " or " + ' "Climate_Appropriate_Plants" = ' + "'SF Native'"
                    }
                }
            });

            if (choicesInCategoryForSql) {
                plantFilterSql += 'and ('
                plantFilterSql += choicesInCategoryForSql + ')';
                filterStringSummary += '@Native - ' + choicesSelected + ' ';
                choicesInCategoryForSql = '';
                choicesSelected = '';
            }

            soilType.forEach(function (plantTypeId) {
                var currSelectionValue = document.getElementById(plantTypeId).value;
                if (document.getElementById(plantTypeId).checked) {
                    choicesSelected += currSelectionValue + ', ';
                    if (choicesInCategoryForSql) {
                        choicesInCategoryForSql += ' or '
                    }
                    if (plantTypeId === 'soil1') {
                        choicesInCategoryForSql += ' ("Soil_Type" like ' + "'%Clay%'  or " + '"Soil_Type" like ' + "'%All%')";
                    } else if (plantTypeId === 'soil2') {
                        choicesInCategoryForSql += ' ("Soil_type" like ' + "'%Loam%'  or " + '"Soil_Type" like ' + "'%All%')";
                    } else if (plantTypeId === 'soil3') {
                        choicesInCategoryForSql += ' ("Soil_Type" like ' + "'%Sand%'  or " + '"Soil_Type" like ' + "'%All%')";
                    } else if (plantTypeId === 'soil4') {
                        choicesInCategoryForSql += ' ("Soil_Type" like ' + "'%Rock%'  or " + '"Soil_Type" like ' + "'%All%')";
                    }
                }
            });

            if (choicesInCategoryForSql) {
                plantFilterSql += 'and ('
                plantFilterSql += choicesInCategoryForSql + ')';
                filterStringSummary += '@Soil Type - ' + choicesSelected + ' ';
                choicesInCategoryForSql = '';

                choicesSelected = '';
            }

            siteType.forEach(function (plantTypeId) {
                var currSelectionValue = document.getElementById(plantTypeId).value;
                if (document.getElementById(plantTypeId).checked) {
                    choicesSelected += currSelectionValue + ', ';
                    if (choicesInCategoryForSql) {
                        choicesInCategoryForSql += ' or '
                    }
                    choicesInCategoryForSql += " (Suitable_Site_Conditions like '%" + currSelectionValue + "%')";
                }
            });

            if (choicesInCategoryForSql) {
                plantFilterSql += 'and ('
                plantFilterSql += choicesInCategoryForSql + ')';
                filterStringSummary += '@Site Condtions - ' + choicesSelected + ' ';
                choicesInCategoryForSql = '';
                choicesSelected = '';
            }
            plantFilterSql += ' and (' + baseSql + ')';
            MapComponent.performFilterSearch(plantFilterSql, filterStringSummary)

        }
    }
}();

// In charge of updating query params and anything URL related
var URLCtrl = function () {
    var uri = '';

    var checkingAddressFromUrl = false;

    function updateUrlParameter(uri, key, value) {
        value = value.replace(/\s/g, "%20");
        var i = uri.indexOf('#');
        var hash = i === -1 ? '' : uri.substr(i);
        uri = i === -1 ? uri : uri.substr(0, i);
        var re = new RegExp("([?&])" + key + "=.*?(&|$)", "i");
        var separator = uri.indexOf('?') !== -1 ? "&" : "?";

        if (!value) {
            // remove key-value pair if value is empty
            uri = uri.replace(new RegExp("([&]?)" + key + "=.*?(&|$)", "i"), '');
            if (uri.slice(-1) === '?') {
                uri = uri.slice(0, -1);
            }
        } else {
            uri = uri + separator + key + "=" + value;
        }
        return uri + hash;
    }

    return {
        /*
            This function checks the query params string in the url and does the appropriate search
        */
        checkForQueryParams: function () {
            var queryParamsString = window.location.search.substring(1);
            if (queryParamsString) {
                var params = new URLSearchParams(queryParamsString);
                var queryParamsValuesArr = Array.from(params.values());
                var queryParamsEntriesArr = Array.from(params.entries());
                if (queryParamsEntriesArr.length !== 0) {

                    var searchChoice = queryParamsEntriesArr[0][0];
                    var searchChoiceValue = queryParamsEntriesArr[0][1];
                    var queryString = queryParamsEntriesArr[0][1];
                    if (queryParamsEntriesArr.length === 1) {
                        // query params string just has either choice, address, community, or parcel as search
                        if (searchChoice === 'choice') {
                            var sqlMapping = SqlCtrl.getSqlMappingForDefinedLists()[searchChoiceValue];
                            // SqlCtrl.setOverallSqlStatement(sqlMapping)
                            MapComponent.searchByDefinedListAndGetSql(queryString);
                        } else if (searchChoice === 'address') {
                            MapComponent.searchMapByAddress(queryString)
                        } else if (searchChoice === 'parcel') {
                            MapComponent.searchMapByParcel(queryString)
                        } else if (searchChoice === 'community') {
                            MapComponent.searchByPlantCommunity(queryString);
                        }
                        SearchCtrl.setBaseSearchString(queryString)
                    } else if (queryParamsEntriesArr.length > 1) {
                        // query params string has choice, address, parcel as search and filter options
                        // get base sql and sql for filter then call filter search
                        if (searchChoice === 'address') {
                            console.log('searching for address yo');
                            checkingAddressFromUrl = true;
                            var searchAddress = queryParamsEntriesArr[0][1];
                            
                            // MapComponent.constructSqlFromAddress(searchAddress).then(function(promise) {
                            //     console.log('got here')
                            //     console.log(promise)
                            // })

                            MapComponent.searchMapByAddress(searchAddress)
                            for (var i = 1; i < queryParamsValuesArr.length; i++) {
                                $("input[value='" + queryParamsValuesArr[i] + "']").prop('checked', true);
                            }
                        } else if (searchChoice === 'choice') {
                            var sqlMapping = SqlCtrl.getSqlMappingForDefinedLists();
                            var baseSql = sqlMapping[queryString];
                            for (var i = 1; i < queryParamsValuesArr.length; i++) {
                                $("input[value='" + queryParamsValuesArr[i] + "']").prop('checked', true);
                            }
                            SqlCtrl.setOverallSqlStatement(baseSql)
                            SearchCtrl.setBaseSearchString(searchChoiceValue)
                            App.applyQueryParamsSearch(baseSql);
                        } else if (searchChoice === 'community') {
                            var plantCommunitySql = SqlCtrl.getPlantCommunitySqlMapping()[searchChoiceValue];
                            for (var i = 1; i < queryParamsValuesArr.length; i++) {
                                $("input[value='" + queryParamsValuesArr[i] + "']").prop('checked', true);
                            }
                            SqlCtrl.setOverallSqlStatement(plantCommunitySql)
                            SearchCtrl.setBaseSearchString(searchChoiceValue)
                            App.applyQueryParamsSearch(plantCommunitySql);
                        }

                    }
                }
            }
        },

        /*
            This function loops through all the checkboxes and updates the url appropriately
        */
        getQueryString: function () {
            var inputsNodeList = document.getElementsByTagName('input');
            var inputsArray = Array.from(inputsNodeList);
            var queryParams = window.location.search.substring(1);
            if (queryParams) {
                var params = new URLSearchParams(queryParams);
                var paramValuesArr = Array.from(params.values());
                var paramEntriesArr = Array.from(params.entries())
                var valueArr = [];

                for (var i = 0; i < paramValuesArr.length; i++) {
                    valueArr.push(paramValuesArr[i]);
                }
                if (valueArr.length === 1) {
                    uri = '?' + queryParams;
                    // Length === 1 means either addess/parcel or defined list already selected
                    inputsArray.forEach(function (input) {
                        if (input.checked) {
                            var currValueSelected = input.value;
                            var currNameSelected = input.name;
                            uri = updateUrlParameter(uri, currNameSelected, currValueSelected);
                        }
                    });
                } else if (valueArr.length > 1) {
                    // Reconstruct uri from blank string
                    uri = '';
                    // first searchType can be choice, address, parcel, or community ATM
                    var firstSearchType = paramEntriesArr[0][0];
                    uri = updateUrlParameter(uri, firstSearchType, params.get(firstSearchType));

                    // if (params.get('choice')) {
                    //     uri = updateUrlParameter(uri, 'choice', params.get('choice'));
                    // } else if (params.get('address')) {
                    //     uri = updateUrlParameter(uri, 'address', params.get('address'));
                    // } else if (params.get('parcel')) {
                    //     uri = updateUrlParameter(uri, 'parcel', params.get('parcel'));
                    // } else if (params.get('community')) {
                    //     uri = updateUrlParameter(uri, 'community', params.get('community'));
                    // }

                    inputsArray.forEach(function (input) {
                        if (input.checked) {
                            var currValueSelected = input.value;
                            var currNameSelected = input.name;
                            uri = updateUrlParameter(uri, currNameSelected, currValueSelected);
                        }
                    });
                }
            }
            return uri;
        },

        /*
            This function constructs the query params string
        */
        callUpdateUrlParameter: function (uri, key, value) {
            return updateUrlParameter(uri, key, value);
        },

        /*
            This function resets the url to the first selection
        */
        resetUrl: function () {
            var uri = '';
            var urlParamsString = window.location.search.substring(1);
            var params = new URLSearchParams(urlParamsString);

            var queryParamsEntriesArr = Array.from(params.entries());
            var firstQueryParams = queryParamsEntriesArr[0]
            uri = updateUrlParameter(uri, firstQueryParams[0], firstQueryParams[1])
            history.replaceState(null, null, uri);
        },

        getIsCheckingForAddressInUrl: function () {
            return checkingAddressFromUrl;
        }
    }
}();

// In charge of dealing with UI
var UICtrl = function () {
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
        searchResultSummary: "#searchResultsSummary",
        customPlantListUl: "#favorites__custom-list",
        searchButton: "#searchButton",
        formInput: "#addressInput",
        filterButton: "#filter-button",
        printButton: '.print',
        mapContainer: '#mapContainer',
        spinLoaderForMap: '#loadSpinner__map',
        searchInput: '#addressInput',
        suggestionList: '#search-suggestions',
        favoritePlantListCount: '#custom-plant-count',
        calenderYear: '#year',
        logo: '.logo',
        siteDescription: '.site-description',
        logoContainer: '.logo-container'
    }

    /*  PRIVATE HELPER FUNCTIONS */

    // Get various plant properties (latin name, native type, common name, icon, image URL)
    function processPlantItemForDisplay(plantItem) {
        var iconToAdd = {
            'CA Native': "<img style='PADDING-TOP: 5px; PADDING-RIGHT:3px' src='images/native-ca.png' title='California Native' alt='California Native'>",
            'SF Native': "<img style='PADDING-TOP: 5px; PADDING-RIGHT:3px' src='images/native-sf.png' title='San Francisco Native' alt='San Francisco Native'>" + "<img style='PADDING-TOP: 5px; PADDING-RIGHT:3px' src='images/native-ca.png' title='California Native' alt='California Native'>",
            'Exotic': "<img style='PADDING-TOP: 5px; PADDING-RIGHT:3px' src='images/native-ex.png' title='Non-native; exotic' alt='Non-native; exotic'>"
        }
        var plantObj = {};
        var featureAttributes = plantItem.attributes;
        var latinName = featureAttributes["Latin_Name"];
        var nativeType = featureAttributes["Climate_Appropriate_Plants"];
        var commonName = featureAttributes["Common_Name"]

        if (nativeType) { nativeType = nativeType.trim() };
        if (latinName === null) { latinName = '' };
        latinName = trim11(latinName);
        if (commonName === null) { commonName = latinName };

        var plantImageURL = 'images/plants/large/' + latinName + '01.jpg';
        var nativeTypeIcon = iconToAdd[nativeType];
        nativeTypeIcon === undefined ? nativeTypeIcon = '' : nativeTypeIcon = nativeTypeIcon;

        plantObj['plantLatinName'] = latinName;
        plantObj['nativeType'] = nativeType;
        plantObj['plantCommonName'] = commonName;
        plantObj['plantID'] = latinName;
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
        Object.values(currTypeToUpdate).forEach(function (item) {
            var returnData = PlantItems.getSpecificReturnPlantData(plantID).attributes[item.identifier];
            // var returnData = plantFeatures[plantID].attributes[item.identifier];
            if (returnData === undefined || returnData === null || returnData == 'NA') {
                return item['returnData'] = 'NA';
            } else if (item.label === 'Suggested for Green Connections Routes') {
                var greenConnectionHtml = '';
                // Manually handle suggested green connection routes
                var greenConnectionNumArr = returnData.split(';');
                greenConnectionNumArr.forEach(function (greenConnectionNum) {
                    greenConnectionHtml +=

                        '<a target="_blank" href="docs/EcologyGuides_Route_' + greenConnectionNum + '.pdf">' +
                        '<img src="images/gc-route' + greenConnectionNum + '-marker.png" width="32" height="32"' +
                        '</a>'

                });
                return item['returnData'] = greenConnectionHtml;
            }
            if (returnData.indexOf(';') !== -1) {
                returnData = returnData.split(';').join(', ')
            }
            return item['returnData'] = returnData;
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

        for (var i = 0; i < NUM_OF_PHOTOS; i++) {
            var currPicture = new Image(PICTURE_SIZE, PICTURE_SIZE);
            var displayPictureLocation = 'images/plants/large/' + latinName + '0' + (i + 1) + '.jpg';
            var currPhotoCredit = photoCreditsObj['photo' + (i + 1)]
            var pictureDiv = createElementWithClassName('div', 'picture');

            // Check to see if photos exist and display if so
            // Can remove in future if all photos are there
            $.ajax({
                url: displayPictureLocation,
                type: "GET",
                async: false,
                success: function (result) {
                    var fullDisplayAnchor = createElementWithClassName('a', "");

                    // var fullDisplayPictureLocation = `images/plants/full/${latinName}0${i+1}.jpg`;
                    var fullDisplayPictureLocation = 'images/plants/full/' + latinName + '0' + (i + 1) + '.jpg'

                    fullDisplayAnchor.href = fullDisplayPictureLocation;

                    currPicture.src = displayPictureLocation;
                    currPicture.setAttribute('class', 'rounded')
                    fullDisplayAnchor.appendChild(currPicture);
                    fullDisplayAnchor.title = 'Photo credits: ' + currPhotoCredit.returnData;
                    fullDisplayAnchor.setAttribute('data-lightbox', 'plantDetail')
                    pictureDiv.appendChild(fullDisplayAnchor);
                    imageRow.appendChild(pictureDiv);
                },
                error: function (error) { }
            });
        }
        imagesContainer.appendChild(imageRow);
        return imagesContainer;
    }

    function getTablePortionOfModal(modalData) {
        var plantNamesObject = modalData.names;
        var currPlantLatinName = plantNamesObject.latinName.returnData;
        var encodedPlantLatinName = encodeURI(currPlantLatinName);
        var currPlantUrl = 'http://sfplanninggis.org/each-plant/index.html?search=' + encodedPlantLatinName;
        var textPortionContainer = createElementWithClassName('div', 'textPortion');
        var hrElement = document.createElement('HR');
        var namesSection = createElementWithClassName('div', 'familyNames');

        textPortionContainer.appendChild(hrElement);

        Object.values(plantNamesObject).forEach(function (name) {
            if (name.label !== 'Common Name') {
                var nameDescription = document.createElement('p');
                nameDescription.setAttribute('class', 'nameDescription');
                // nameDescription.innerHTML =  `<strong>${name.label}</strong>: ${name.returnData}`;
                nameDescription.innerHTML = '<strong>' + name.label + '</strong>: ' + name.returnData
                namesSection.appendChild(nameDescription)
            }
        });
        textPortionContainer.appendChild(namesSection)

        // textPortionContainer.appendChild(namesSection);
        var plantInformationLabel = document.createElement('h4');
        plantInformationLabel.innerText = "Plant Information";
        var tableContainer = createElementWithClassName('div', 'tableContainer');
        var plantDetail = modalData.plantDetails;

        tableContainer.innerHTML =
            '<table class="table">' +
            '<tr>' +
            '<th scope="row">Additional Species, Cultivars and varieties: </th>' +
            '<td>' + plantDetail.speciesVarieties.returnData + '</td>' +
            '<th scope="row">Plant Type: </th>' +
            '<td>' + plantDetail.plantType.returnData + '</td>' +
            '</tr>' +
            '<tr>' +
            '<th scope="row">Bloom Time: </th>' +
            '<td>' + plantDetail.bloomTime.returnData + '</td>' +
            '<th scope="row">Flower Color: </th>' +
            '<td>' + plantDetail.flowerColor.returnData + '</td>' +
            '</tr>' +
            '<tr>' +
            '<th scope="row">Size at Maturity: </th>' +
            '<td>' + plantDetail.maturitySize.returnData + '</td>' +
            '<th scope="row">Appropriate Location: </th>' +
            '<td>' + plantDetail.appropriateLocation.returnData + '</td>' +
            '</tr>' +
            '<tr>' +
            '<th scope="row">Watering Needs: </th>' +
            '<td>' + plantDetail.waterNeeds.returnData + '</td>' +
            '<th scope="row">Site Conditions: </th>' +
            '<td>' + plantDetail.siteConditions.returnData + '</td>' +
            '</tr>' +
            '<tr>' +
            '<th scope="row">Soil: </th>' +
            '<td>' + plantDetail.soilType.returnData + '</td>' +
            '<th scope="row">Climate Appropriate: </th>' +
            '<td>' + plantDetail.appropriateClimate.returnData + '</td>' +
            '</tr>' +
            '<tr>' +
            '<th scope="row">Plant Communities: </th>' +
            '<td>' + plantDetail.plantCommunities.returnData + '</td>' +
            '<th scope="row">Habitat Value: </th>' +
            '<td>' + plantDetail.habitatValue.returnData + '</td>' +
            '</tr>' +
            '<tr>' +
            '<th scope="row">Associated Wildlife: </th>' +
            '<td>' + plantDetail.associatedWildlife.returnData + '</td>' +
            '<th scope="row">Nurseries: </th>' +
            '<td>' + plantDetail.nurseries.returnData + '</td>' +
            '</tr>' +
            '<tr>' +
            '<th scope="row">Suggested for Green Connections Routes: </th>' +
            '<td>' +
            plantDetail.greenConnectionRoutes.returnData +
            '</td>' +
            '<th scope="row">Approved Street Tree List: </th>' +
            '<td>' + plantDetail.streetTreeList.returnData + '</td>' +
            '</tr>' +
            '<tr>' +
            '<th scope="row">Additional Characteristics: </th>' +
            '<td>' + plantDetail.additionalCharacteristics.returnData + '</td>' +
            '<th scope="row"></th>' +
            '<td></td>' +
            '</tr>' +
            '<tr>' +
            '<th scope="row">Url: </th>' +
            '<td> <a href=' + currPlantUrl + '>' + currPlantUrl + '</td>' +
            '<th scope="row"></th>' +
            '<td></td>' +
            '</tr>' +
            '</table>'

        textPortionContainer.appendChild(tableContainer);
        return textPortionContainer;
    }

    // public functions
    return {
        clearFavoriteList: function() {
            CustomPlantList.clearCustomList();
        },
        hideFavList: function() {
            $('.favorites').addClass('hide-favorites');
            $('.favorites').removeClass('show-favorites');
            $('.favorites-count-container').addClass('show-favorites-count')
            $('.favorites-count-container').removeClass('hide-favorites-count')
        },
        showFavList: function() {
            $('.favorites').addClass('show-favorites')
            $('.favorites').removeClass('hide-favorites')
            $('.favorites-count-container').addClass('hide-favorites-count')
            $('.favorites-count-container').removeClass('show-favorites-count')
        },
        clearCheckboxes: function(){
            var checkboxes = $('input:checkbox');
            for (var i = 0; i < checkboxes.length; i++) {
                checkboxes[i].checked = false;
            }
        },
        getUISelectors: function () {
            return UISelectors
        },
        hideTopLogo: function() {
            $(UISelectors.logo).hide();
            $(UISelectors.siteDescription).hide();
            $(UISelectors.logoContainer).hide();
        },
        showTopLogo: function() {
            $(UISelectors.logo).show();
            $(UISelectors.siteDescription).show();
            $(UISelectors.logoContainer).show();
        },
        showHiddenSections: function () {
            // document.querySelector(UISelectors.printResultsLink).style.visibility = "visible";
            document.querySelector(UISelectors.searchResultsDisplay).style.visibility = "visible";
            document.querySelector(UISelectors.filterSection).style.visibility = "visible";
            // document.querySelector(UISelectors.shoppingCart).style.visibility = "visible";
            document.querySelector(UISelectors.searchResults).style.display = "block";
        },
        updateFavPlantCount: function(addOrMinus) {
            var currFavPlantCount = Number($(UISelectors.favoritePlantListCount).text());
            if (addOrMinus === 'add') {
                console.log(currFavPlantCount)
                currFavPlantCount += 1;
                document.querySelector(UISelectors.favoritePlantListCount).innerHTML = currFavPlantCount;
            } else if (addOrMinus === 'minus'){
                currFavPlantCount -= 1;
                document.querySelector(UISelectors.favoritePlantListCount).innerHTML = currFavPlantCount;

            }
        },
        displaySearchSugesstions(apiResponse) {
            var haveHighPriority = false;
            var addToDropdownList = false;
            var features = apiResponse.features;
            if (features) {
                for (var i = 0; i < features.length; i++) {
                    var featureAttributes = features[i].attributes;
                    var address = featureAttributes['Address'];
                    var priority = featureAttributes['Priority'];
                    if (priority === 1 || priority === 2) {
                        haveHighPriority = true;
                        addToDropdownList = true;
                    } else {
                        if (haveHighPriority) {
                            addToDropdownList = false;
                        } else {
                            addToDropdownList = true;
                        }
                    }
                    if (addToDropdownList) {
                        $(UISelectors.suggestionList).append('<option value="'+address+'">'+address + '</option>')
                        $(UISelectors.suggestionList).focus();

                    }
                }
            }
        },
        showPlantResults: function (responseResults) {
            $(UISelectors.intro).hide();
            $(UISelectors.loadingSpinner).hide();
            $(UISelectors.mainPage).removeClass('disabledDIV');
            UICtrl.showHiddenSections();
            var summaryOfPlantResults = '';

            var numPlantResults;
            var plantResultHtml = '';
            var baseSearchStringForSummary = SearchCtrl.getBaseSearchString();
            if (responseResults === undefined) {
                // no plant results, display summary saying no results
                numPlantResults = 0;
                summaryOfPlantResults += 'Found <b>' + numPlantResults + '</b> plants for: <br><div class="filter-summary">' + baseSearchStringForSummary + '</div>';
                document.querySelector(UISelectors.searchResultSummary).innerHTML = summaryOfPlantResults;
                document.querySelector(UISelectors.plantList).innerHTML = '';

            } else {
                plantResultHtml += '<div class="container">'
                var plantFeatures = responseResults.features;
                PlantItems.setReturnPlantData(plantFeatures)
                numPlantResults = plantFeatures.length;
    
        
                PlantItems.emptyPlantListArray();
    
                for (var i = 0; i < plantFeatures.length; i++) {
                    if (i === 0) {
                        plantResultHtml += '<div class="row">'
                    } else if (i % 3 === 0) {
                        plantResultHtml += '<div class="row">'
                    }
                    // Looping through each plant and get plant object that contains information about it
                    var currPlantObj = processPlantItemForDisplay(plantFeatures[i]);
    
    
                    PlantItems.addToPlantArray(currPlantObj);
    
                    plantResultHtml +=
    
                        '<div class="col-md-4 col-sm-4 plant-photos" style="display:flex" data-itemid="' + currPlantObj.plantID + '" >' +
                        '<div class="plant-image-container"><img  onClick="UICtrl.showPlantDetail(' + i + ')" src="' + currPlantObj.plantImageURL + '" alt="' + currPlantObj.plantLatinName + '"></div>' +
                        '<div class="plant-description" style="display:inline-block">' +
                        '<a href="javascript:void(0)" onClick="UICtrl.showPlantDetail(' + i + ')">' + currPlantObj.plantCommonName + '</a>' +
    
                        '<br>' +
                        '<p>' + currPlantObj.plantLatinName + '</p>' +
                        currPlantObj.nativeTypeIcon +
                        '<button  class="btn btn-link"><i class="fas fa-heart add-to-custom-list"></i></button>' +
                        '</div>' +
                        '</div>'
    
                    if (i % 3 === 2) {
                        // End of row
                        plantResultHtml += '</div>'
                    }
                }
    
                var additionalSearchCriteriaForSummary = SearchCtrl.getAddtionalSearchString();
                console.log(additionalSearchCriteriaForSummary);
                
                if (additionalSearchCriteriaForSummary === undefined || !additionalSearchCriteriaForSummary) {
                    summaryOfPlantResults =
                        'Found <b>' + numPlantResults + '</b> plants for: <br><div class="filter-summary">' + baseSearchStringForSummary + '</div>' +
                        '<p class="print-instructions">' +
                        'Click "Print" to save/print a shopping list and then give this list to your landscaper or take it down ' +
                        'to your local nursery' +
                        '</p>' + 
                        '<div class="toolbar-search" id="printResultsLink">' +
                        '<a class="print" href="javascript:void(0);">Print</a>' +
                        '</div>';
    
                } else {
                    summaryOfPlantResults =
                        'Found <b> ' + numPlantResults + '</b> plants for: <br><div class="filter-summary">' + baseSearchStringForSummary + ' and ' + additionalSearchCriteriaForSummary + '<br>' +
                        '<p class="print-instructions">' +
                        'Click "Print" to save/print a shopping list and then give this list to your landscaper or take it down' +
                        'to your local nursery' +
                        '</p>' +
                        '<div class="toolbar-search" id="printResultsLink">' +
                        '<a class="print" href="javascript:void(0);">Print</a>' +
                        '</div>';
                }
    
                SearchCtrl.setSearchSummary(summaryOfPlantResults);
                if (SearchCtrl.isOnGreenConnectionRoute()) {
                    console.log('on green connection is ' + SearchCtrl.isOnGreenConnectionRoute())
                    var greenConnectionHtml = SearchCtrl.getIsAtGreenConnectionHtml();
                    summaryOfPlantResults += greenConnectionHtml;
                }
    
                // console.log(summaryOfPlantResults)
                document.querySelector(UISelectors.searchResultSummary).innerHTML = summaryOfPlantResults;
                plantResultHtml += '</div>'
                document.querySelector(UISelectors.plantList).innerHTML = plantResultHtml;
            }
        },

        showPlantDetail: function (plantID) {
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

            var currPlantTypeDescription = dataToConstructModal.plantDetails.plantType.returnData.toLowerCase();
            if (currPlantTypeDescription.indexOf('tree') !== -1) {
                $('#modalTitle').html(modalTitle.textContent + '&nbsp <i class="fas fa-tree" style="color:green"></i> (Tree)');
            } else {
                $('#modalTitle').html(modalTitle.textContent);
            }

            $(UISelectors.loadingSpinner).hide()
            $('#plantInfoModal').modal('show');
        },
        addToCustomListUI: function (plantObject) {
            var customPlantListUl = document.querySelector(UISelectors.customPlantListUl);
            var plantItemHtmlToAdd =
                '<li class="shopping-item" data-itemid=' + plantObject.plantID + '>' +
                '<div class="plant-description">' + plantObject.plantCommonName + '</div>' +
                '<img height="90px" width="90px" src="' + plantObject.plantImageURL + '">' +
                '<button class="btn btn-link remove-from-custom-list">' +
                '<i class="fas fa-times-circle"></i></button><hr>' +
                '</li>'
            
            // `
            // <li class="shopping-item" data-itemid=${plantObject.plantID}>
            //     <div class="plant-description">${plantObject.plantCommonName}</div>
            //     <img height="90px" width="90px" src="${plantObject.plantImageURL}">  
            //     <button class="btn btn-link remove-from-custom-list">
            //     <i class="fas fa-times-circle"></i></button><hr>
            // </li>
            // `
            customPlantListUl.insertAdjacentHTML('beforeend', plantItemHtmlToAdd);
        },
        deletePlantFromUI: function (event) {
            var liElement = event.target.parentElement.parentElement;
            var parentULElement = event.target.parentElement.parentElement.parentElement;
            parentULElement.removeChild(liElement);
        }
    }
}();



// Map componenet to hold all map related actions and variables
var MapComponent = function () {
    // Private variables only accessibly to MapComponent
    // Can only be retrieved through get methods and changed through set methods
    var mapImageLayers;
    var map;
    var findTask;
    var view;
    // var plantsfGISServerName = "http://54.83.57.240/arcgiswa/rest/services/PlantSFv4/MapServer";
    var plantsfGISServerName = 'http://sfplanninggis.org/arcgiswa/rest/services/PlantSFv4/MapServer'
    var bufferParameters;

    var overAllSqlStatement;


    // var sqlMapping = {
    //     "All Plants": "(1=1)",
    //     "SF Natives": "Climate_Appropriate_Plants in ( 'SF Native' , 'SF Native ' )",

    //     "Habitat Plants": "(Habitat_int = 1)",
    //     "Stormwater": " (Stormwater_int = 1) ",
    //     "Urban Forest Council Street TreeList": " (1=1) and (  \"Plant_Type\" in (\'Tree (evergreen)\'  , \'Tree (deciduous)\' )  and (  (\"Appropriate_Location\" like \'%Sidewalk%\' ) )  ) ",
    //     "Thrifty150": "(Thrifty150_int = 1)",
    //     "Sidewalk Landscaping": "(Sidewalk_Landscaping_Plants_int = 1)",
    //     "Sandy Soil": "(Sandy_Soil_int = 1)",
    //     "Shady Clay": "(Shady_Clay_int = 1)",
    //     "Super60": "(Super60_int = 1)",
    //     "Top20": "(Top20_int = 1)"
    // }

    // var plantCommunitySqlMapping = {
    //     'grasslandprairie': ' UPPER("Plant_Communities") like ' + "'%GRASSLAND/PRAIRIE%' ",
    //     'coastalscrub': ' UPPER("Plant_Communities") like ' + "'%COASTAL SCRUB%' ",
    //     'chaparral': ' UPPER("Plant_Communities") like ' + "'%CHAPARRAL%' ",
    //     'dunes': ' UPPER("Plant_Communities") like ' + "'%DUNES%' ",
    //     'wetland': ' UPPER("Plant_Communities") like ' + "'%WETLAND%' ",
    //     'riparian': ' UPPER("Plant_Communities") like ' + "'%RIPARIAN%' ",
    //     'woodland': ' UPPER("Plant_Communities") like ' + "'%WOODLAND%' ",
    //     'saltMarsh': ' UPPER("Plant_Communities") like ' + "'%SALT MARSH%' ",
    // }

    require([
        "esri/Map",
        "esri/core/urlUtils",
        "esri/layers/FeatureLayer",
        "esri/Graphic",
        "esri/layers/support/ImageParameters",

        "esri/layers/MapImageLayer",

        "esri/tasks/support/BufferParameters",
        "esri/views/MapView",

        "dojo/_base/array",
        "dojo/_base/connect",

        "dojo/on",
        "dojo/ready",
        "dojo/dom",
        "dojo/domReady!",
    ], function (Map, urlUtils, FeatureLayer, Graphic, ImageParameters, MapImageLayer,
        BufferParameters, MapView,
        array, connect, on, ready, dom) {

        urlUtils.addProxyRule({
            urlPrefix: "http://54.83.57.240/arcgiswa/rest/services",
            proxyUrl: "http://54.83.57.240/proxy/DotNet/proxy.ashx"
        });

        var greenConnectionLayer = new FeatureLayer({
            url: "http://54.83.57.240/arcgiswa/rest/services/PlantSFv4/MapServer/2",
            visible: false,
            opacity: 0.5
        });


        var plantCommunities = new FeatureLayer({
            url: "http://54.83.57.240/arcgiswa/rest/services/PlantSFv4/MapServer/11",
            visible: false
        });

        map = new Map({
            basemap: "satellite",
        });

        view = new MapView({
            container: "map_canvas",
            map: map,
            center: [-122.4425, 37.754],
            zoom: 11
        });

        var imageParams = new ImageParameters();
        imageParams.layerIds = [9999];

        mapImageLayers = new MapImageLayer({
            url: plantsfGISServerName,
            imageTransparency: true,
            visible: false
        });

        bufferParameters = new BufferParameters();
        bufferParameters.unit = "esriSRUnit_Foot";
        bufferParameters.unionResults = true;

        map.add(mapImageLayers)

        view.on("click", handleMapClick);

        // Handle clicks on the map
        function handleMapClick(event) {
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
            identifyWhatIsOnMap(theGeom);
        }
    });

    // PRIVATE HELPER FUNCTIONS

    /*
        get response plant data from click and display in UI
        also runs an intermediate query
    */
    function resolveResponsePlantData(responseResults) {

        require(["esri/tasks/QueryTask", "esri/tasks/support/Query"], function (QueryTask, Query) {
            /* code goes here */
            var plantListTableURL = plantsfGISServerName + '/13';

            var queryTask = new QueryTask({
                url: plantListTableURL
            });
            var query = new Query({
                outFields: ["*"],
                returnGeometry: false
            });

            overAllSqlStatement = '"Plant_Communities"' + " like '%All%'";

            for (var i = 0; i < responseResults.length; i++) {
                var currResult = responseResults[i];
                if (currResult.layerName === "Habitats Merged") {
                    if (currResult.feature.attributes["Habitat"] !== null) {
                        overAllSqlStatement += " or " + ' UPPER("Plant_Communities")' + " like '%" + currResult.feature.attributes["Habitat"].toUpperCase() + "%'";
                    }
                }
            }
            overAllSqlStatement = "( " + overAllSqlStatement + " )";

            overAllSqlStatement = " ( ( " + overAllSqlStatement + " ) or " + " (  \"Plant_Type\" in ('Tree (evergreen)'  , 'Tree (deciduous)' )  and ( \"Appropriate_Location\" like '%Sidewalk%' )  ) ) "
            query.where = overAllSqlStatement;
            if (URLCtrl.getIsCheckingForAddressInUrl()) {
                console.log(overAllSqlStatement)
            }
            
            queryTask.execute(query).then(UICtrl.showPlantResults);
            SqlCtrl.setOverallSqlStatement(overAllSqlStatement);
        });
        // Below is useful if there is an address search in the url query params
        return overAllSqlStatement;

    }

    /*
        This function takes in a geometry and runs a query using it on multiple layers. 
        Then it displays the appropriate plant results
    */
    function identifyWhatIsOnMap(geometryToProcess) {
        // This function identify whats on the map based on geometry (point or polygon)
        // Point is clicking on map and polygon is address or parcel search
        require(["esri/tasks/support/IdentifyParameters", "esri/tasks/IdentifyTask"], function (IdentifyParameters, IdentifyTask) {
            var identifyParameters = new IdentifyParameters();
            var identifyTask = new IdentifyTask(plantsfGISServerName);
            var identifyLatLongForPlants = false;

            identifyParameters.tolerance = 1;
            identifyParameters.returnGeometry = false;
            // identifyParameters.layerOption = "all";
            identifyParameters.width = view.width;
            identifyParameters.height = view.height;
            identifyParameters.mapExtent = view.extent;
            identifyParameters.geometry = geometryToProcess;
            // identifyParameters.layerIds = [0, 2];

            identifyParameters.layerOption = 'all';

            if (geometryToProcess.type === 'point') {
                var leftSFRangeX = -13638091;
                var rightSFRangeX = -13620761;
                var upperSFRangeY = 4556181;
                var lowerSFRangeY = 4538163
                if (geometryToProcess.x < leftSFRangeX || geometryToProcess.x > rightSFRangeX || geometryToProcess.y > upperSFRangeY || geometryToProcess.y < lowerSFRangeY) {
                    var theTitle = "You Clicked Outside San Francisco"
                    var theMessage = "This is a plant database for San Francisco microclimates and plant communities. Please click on a location within San Francisco."
                    new Messi(theMessage, { title: theTitle, modal: true, titleClass: 'info', buttons: [{ id: 0, label: 'OK' }] });
                    return;
                }
            } else if (geometryToProcess.type === 'polygon') {
                identifyParameters.tolerance = 0;
            }

            // First identify if on any address or green connection layer
            identifyTask.execute(identifyParameters)
                .then(function (response) {
                    var responseResults = response.results;

                    if (geometryToProcess.type === 'point') {
                        for (var i = 0; i < responseResults.length; i++) {
                            var currLayer = responseResults[i];
                            if (currLayer.layerName === 'Master Address Database') {
                                var addressOnClick = currLayer.feature.attributes['ADDRESSSIMPLE'];
                                SearchCtrl.setBaseSearchString(addressOnClick);
                                resolveResponsePlantData(responseResults);
                                SearchCtrl.setGreenConnectionBoolean(false);
                                return
                            }
                        }

                        for (var i = 0; i < responseResults.length; i++) {
                            var currLayer = responseResults[i];
                            if (currLayer.layerName === 'Green Connections') {
                                var greenConnectionString = currLayer.feature.attributes["GC_RT_NMBR"];
                                if (greenConnectionString !== null) {
                                    SearchCtrl.setGreenConnectionBoolean(true);
                                    SearchCtrl.setGreenConnectionHtml(greenConnectionString);
                                    break;
                                }
                            } else {
                                SearchCtrl.setGreenConnectionBoolean(false);
                                break;
                            }
                        }

                        // Search by lat long
                        var latitude = Number(geometryToProcess.latitude).toFixed(4)
                        var longitude = Number(geometryToProcess.longitude).toFixed(4);
                        var latLongString = 'Latitude: ' + latitude + ' Longitude: ' + longitude;
                        SearchCtrl.setBaseSearchString(latLongString);
                        resolveResponsePlantData(responseResults);

                    } else {
                        resolveResponsePlantData(responseResults);
                    }
                });
        });
    }

    function executeFindTaskAndZoomToPolygon(findParams) {
        console.log('in execute find task and zoom func');
        UICtrl.clearCheckboxes();

        require(["esri/tasks/FindTask", "esri/Graphic"], function (FindTask, Graphic) {
            var polygonGraphicToAdd = new Graphic();
            var findTask = new FindTask(plantsfGISServerName);

            var parcelReturnDataGeometry;
            var polygonSymbol = {
                type: 'simple-fill',
                color: [159, 180, 103, 0.65],
                style: 'solid',
                outline: {
                    color: [105, 159, 55],
                    width: 1
                }
            };
            findTask.execute(findParams).then(function (findResults) {
                if (findResults.results.length === 0) {
                    UICtrl.showPlantResults(undefined);
                    SqlCtrl.setOverallSqlStatement(undefined);
                    SearchCtrl.setAdditionalSearchString('');
                } else {
                    var firstResult = findResults.results[0];
                    var resultFeature = firstResult.feature;
                    var resultFeaturePolygon = resultFeature.geometry
                    parcelReturnDataGeometry = firstResult.feature.geometry;
                    polygonGraphicToAdd.geometry = parcelReturnDataGeometry;
                    polygonGraphicToAdd.symbol = polygonSymbol;
                    view.graphics.add(polygonGraphicToAdd);
                    view.goTo(polygonGraphicToAdd.geometry.extent.expand(2));
                    identifyWhatIsOnMap(resultFeaturePolygon);
                }
                // Just grab first result - find result returns multiple items in an array

            });
        });
    }

    // PUBLIC FUNCTIONS ACCESSIBLE THROUGH MAP COMPONENT
    return {
        getMapImageLayers: function () {
            return mapImageLayers;
        },
        getSqlMappingForDefinedLists: function () {
            return sqlMapping;
        },
        getMap: function () {
            return map;
        },
        getView: function () {
            return view;
        },
        getPlantSFGISService: function () {
            return plantsfGISServerName;
        },

        /*
            This function performs plant searches based on the input parcel. It also zooms 
            in to the location on the map and displays the plant results
        */
        searchMapByParcel: function (parcelString) {
            require(["esri/tasks/support/FindParameters"], function (FindParameters) {
                var PARCEL_LAYER_ID = 2;
                var findParams = new FindParameters();
                findParams.layerIds = [PARCEL_LAYER_ID];
                findParams.searchFields = ['BLKLOT'];
                findParams.searchText = parcelString.toUpperCase();
                findParams.outSpatialReference = { 'wkid': 102113 };
                findParams.returnGeometry = true;
                findParams.contains = false;
                console.log(findParams)
                executeFindTaskAndZoomToPolygon(findParams);
            });
        },

        /*
            This function performs plant searches based on the input address. It also zooms 
            in to the location on the map and displays the plant results
        */
        searchMapByAddress: function (addressString) {
            require(["esri/tasks/support/FindParameters"], function (FindParameters) {
                /* code goes here */
                var findParams = new FindParameters();
                var streetTypeExists = false;
                var streetPortionOfAddressString = addressString.substring(addressString.length, addressString.length - 3);
                var differentStreetTypes = [' ST', ' PL', ' CT', ' DR', ' HL', ' LN', ' RD'];
                var differentStreetTypes2 = [' AVE', ' ALY', 'CIR', ' PLZ', ' TER', ' WAY'];

                for (var i = 0; i < differentStreetTypes.length; i++) {
                    if (streetPortionOfAddressString === differentStreetTypes[i]) {
                        streetTypeExists = true;
                        break;
                    }
                }
                streetPortionOfAddressString = addressString.substring(addressString.length, addressString.length - 4);
                for (var i = 0; i < differentStreetTypes2.length; i++) {
                    if (streetPortionOfAddressString === differentStreetTypes[i]) {
                        streetTypeExists = true;
                        break;
                    }
                }
                if (addressString.substring(addressString.length, addressString.length - 5) === ' BLVD') {
                    streetTypeExists = true;
                };
                // Change in production server to 1
                var MASTER_LAYER_ID = 1;
                findParams.layerIds = [MASTER_LAYER_ID];
                findParams.searchFields = streetTypeExists === true ? ['AddressSimple'] : ["AddressNoTy"];
                findParams.searchText = addressString.toUpperCase();
                findParams.outSpatialReference = { 'wkid': 102113 };
                findParams.returnGeometry = true;
                findParams.contains = false;
                executeFindTaskAndZoomToPolygon(findParams);
            });
        },

        /*
            This function displays plant search results on pre-defined lists and returns the sql statement
        */
        searchByDefinedListAndGetSql: function (searchString) {
            var definedListSqlMapping = SqlCtrl.getSqlMappingForDefinedLists();
            var plantSql = definedListSqlMapping[searchString];
            SqlCtrl.setOverallSqlStatement(plantSql)
            // overAllSqlStatement = plantSql
            require([
                "esri/tasks/QueryTask", "esri/tasks/support/Query",
                "dojo/dom", "dojo/on", "dojo/domReady!"
            ],
                function (QueryTask, Query, dom, on) {
                    var plantsfGISServerName = MapComponent.getPlantSFGISService();
                    plantListTableURL = plantsfGISServerName + '/13';
                    var plantQuery = new Query({
                        outFields: ["*"],
                        returnGeometry: false,
                        where: plantSql
                    });
                    var queryTask = new QueryTask({
                        url: plantListTableURL
                    });
                    // queryTask.execute(plantQuery).then(UICtrl.showPlantResults);
                    queryTask.execute(plantQuery)
                        .then(function (results) {
                            SearchCtrl.setBaseSearchString(searchString);
                            UICtrl.showPlantResults(results);

                        })
                        .catch(function (err) {
                        });
                });
            return plantSql;
        },

        /*
            This function performs a search by plant community
        */
        searchByPlantCommunity: function (communitySearchString) {
            var plantCommunitySqlStatement = SqlCtrl.getPlantCommunitySqlMapping()[communitySearchString];
            SqlCtrl.setOverallSqlStatement(plantCommunitySqlStatement)

            require([
                "esri/tasks/QueryTask", "esri/tasks/support/Query",
                "dojo/dom", "dojo/on", "dojo/domReady!"
            ],
                function (QueryTask, Query, dom, on) {
                    var plantsfGISServerName = MapComponent.getPlantSFGISService();
                    plantListTableURL = plantsfGISServerName + '/13';
                    var plantQuery = new Query({
                        outFields: ["*"],
                        returnGeometry: false,
                        where: plantCommunitySqlStatement
                    });
                    var queryTask = new QueryTask({
                        url: plantListTableURL
                    });
                    queryTask.execute(plantQuery).then(function (results) {
                        console.log(results)
                        SearchCtrl.setAdditionalSearchString(plantCommunitySqlStatement);
                        UICtrl.showPlantResults(results);
                    });
                });
        },

        /*
            This function combies the baseSql and the filter string to perform the appropriate search
        */
        performFilterSearch: function (plantSearchSql, filterString) {
            // Gets base sql and filter sql combined to perform plant search
            require([
                "esri/tasks/QueryTask", "esri/tasks/support/Query",
                "dojo/dom", "dojo/on", "dojo/domReady!"
            ],
                function (QueryTask, Query, dom, on) {
                    var plantsfGISServerName = MapComponent.getPlantSFGISService();
                    plantListTableURL = plantsfGISServerName + '/13';
                    var plantQuery = new Query({
                        outFields: ["*"],
                        returnGeometry: false,
                        where: plantSearchSql
                    });
                    var queryTask = new QueryTask({
                        url: plantListTableURL
                    });
                    queryTask.execute(plantQuery).then(function (results) {
                        SearchCtrl.setAdditionalSearchString(filterString);
                        UICtrl.showPlantResults(results);
                    });
                });

        },

        /*
            This function constructs the sql statement from the query string values.
            Base sql can be address search, predefined list search or plant community search
        */
        getBaseSqlFromQueryString: function (queryEntriesArr) {
            var numOfQueryEntries = queryEntriesArr.length;
            var sqlFromQueryParams = '';
            var baseSelectionArr = queryEntriesArr[0];
            var baseSelectionType = baseSelectionArr[0];
            var baseSelectionValue = baseSelectionArr[1];

            console.log(baseSelectionType)
            switch (baseSelectionType) {
                case 'address':
                    // sqlFromQueryParams = 
                    break;
                case 'choice':
                    break;
                case 'community':
                    break;
            }

            sqlFromQueryParams = sqlMapping[baseSelectionValue];
            return sqlFromQueryParams;
        },

        setOverallSqlStatement: function (sqlString) {
            console.log('calling set sql statement')
            overAllSqlStatement = sqlString;
        },

        getOverAllSqlStatement: function () {
            return overAllSqlStatement;
        },

        constructSqlFromAddress: function (addressString) {
            var sql;
            var promise;
            require(["esri/tasks/support/IdentifyParameters", "esri/tasks/IdentifyTask",
                "esri/tasks/support/FindParameters", "esri/tasks/FindTask"], function (IdentifyParameters, IdentifyTask, FindParameters, FindTask) {
                    /* code goes here */
                    var findParams = new FindParameters();
                    var findTask = new FindTask(plantsfGISServerName);
                    var MASTER_LAYER_ID = 1;

                    console.log(plantsfGISServerName)
                    findParams.layerIds = [MASTER_LAYER_ID];
                    findParams.searchFields = ['AddressNoTy'];
                    // findParams.searchFields = streetTypeExists === true ? ['AddressSimple'] : ["AddressNoTy"];
                    findParams.searchText = addressString;
                    findParams.outSpatialReference = { 'wkid': 102113 };
                    findParams.returnGeometry = true;
                    findParams.contains = false;
                    console.log('got here');
                    findTask.execute(findParams).then(function(response) {
                        console.log(response)
                    })
                        // console.log(promise)
                        // .then(function (findResults) {
                        //     // Just grab first result - find result returns multiple items in an array
                        //     var firstResult = findResults.results[0];
                        //     var resultFeature = firstResult.feature;
                        //     var resultFeaturePolygon = resultFeature.geometry

                        //     return resultFeaturePolygon

                        // })
                        // .then(function (geometry) {

                        //     var identifyParameters = new IdentifyParameters();
                        //     var identifyTask = new IdentifyTask(plantsfGISServerName);
                        //     identifyParameters.tolerance = 1;
                        //     identifyParameters.returnGeometry = false;
                        //     // identifyParameters.layerOption = "all";

                        //     identifyParameters.width = view.width;
                        //     identifyParameters.height = view.height;
                        //     identifyParameters.mapExtent = view.extent;
                        //     identifyParameters.geometry = geometry;
                        //     // identifyParameters.layerIds = [0, 2];

                        //     identifyParameters.layerOption = 'all';
                        //     identifyTask.execute(identifyParameters)
                        //         .then(function (response) {
                        //             sql = resolveResponsePlantData(response.results);
                        //             overAllSqlStatement = sql;
                        //             console.log(SqlCtrl)
                        //             SqlCtrl.combineBaseSqlWithFilterSqlAndSearch(overAllSqlStatement)

                        //         })
                        // })

                });
                // return promise;
            // return promise;

        }
    }
}();


// Main app controller
var App = function () {
    var UISelectors = UICtrl.getUISelectors();
    var uri = '';
    // baseSql is used define the sql statement for the first search that the user does
    // Any subsequent filter will be combined with this base sql;
    var baseSql;
    var apiRequest;
    var showFavListForFirstTime = true;

    function isNumeric(text) {
        var validChars = "-0123456789.";
        for (var i = 0; i < text.length; i++) {
            var currChar = text[i];
            if (validChars.indexOf(currChar) === -1) {
                return false;
            }
        }
        return true;
    }

    function getCleanedAddressForAutoComplete(searchVal) {
        var adressMappingValues = {
            " 1ST": " 01ST", " 2ND": " 02ND", " 3RD": " 03RD",
            " 4TH": " 04TH", " 5TH": " 05TH", " 6TH": " 06TH",
            " 7TH": " 07TH", " 8TH": " 08TH", " 9TH": " 09TH",
            " BAYSHORE": " BAY SHORE", " S VAN NESS": " SOUTH VAN NESS",
            " S HILL": " SOUTH HILL", " S PARK": " SOUTH PARK",
            " N POINT": " NORTH POINT", " N VIEW": " NORTH VIEW",
            " E BEACH": " EAST BEACH", " W CLAY": " WEST CLAY",
            " W CRYSTAL ": " WEST CRYSTAL", " W PACIFIC": " WEST PACIFIC",
            " W POINT": " WEST POINT", " W PORTAL": " WEST PORTAL",
            " W VIEW": " WEST VIEW", "&": "%26"
        }
        for (var key in adressMappingValues) {
            var valuesToReplaceWith = adressMappingValues[key];
            searchVal = searchVal.replace(key, valuesToReplaceWith);
        }
        return searchVal;
    }

    function getCleanedAddress(searchVal) {

        searchVal = searchVal.replace(/^\s*/, "").replace(/\s*$/, "");
        searchVal = searchVal.replace("\\", "");
        searchVal = searchVal.replace("%20", " ");
        searchVal = searchVal.replace(/\s{2,}/, ' ');
        var cleanAddressMappingValues = {
            " 1ST": " 01ST", " FIRST STREET": " 01ST", " FIRST ST": " 01ST",
            " 2ND": " 02ND", " SECOND": " 02ND",
            " 3RD": " 03RD",
            " THIRD": " 03RD",
            " 4TH": " 04TH", " FOURTH": " 04TH",
            " 5TH": " 05TH", " FIFTH": " 05TH",
            " 6TH": " 06TH",
            " SIXTH": " 06TH",
            " 7TH": " 07TH", " SEVENTH": " 07TH",
            " 8TH": " 08TH", " EIGHTH": " 08TH",
            " 9TH": " 09TH", " NINETH": " 09TH",
            " TENTH": " 10TH",
            " ELEVENTH": " 11TH",
            " TWELTH": " 12TH",
            " THIRTEENTH": " 13TH",
            " FOURTEENTH": " 14TH",
            " FIFTHTEENTH": " 15TH",
            " SIXTEENTH": " 16TH",
            " SEVENTEENTH": " 17TH",
            " EIGHTEENTH": " 18TH",
            " NINETEENTH": " 19TH",
            " TWENTIETH": " 20TH",
            " TWENTY-FIRST": " 21ST", " TWENTYFIRST": " 21ST",
            " TWENTY-SECOND": " 22ND", " TWENTYSECOND": " 22ND",
            " TWENTY-THIRD": " 23RD", " TWENTYTHIRD": " 23RD",
            " TWENTY-FOURTH": " 24TH", " TWENTYFOURTH": " 24TH",
            " TWENTY-FIFTH": " 25TH", " TWENTYFIFTH": " 25TH",
            " TWENTY-SIXTH": " 26TH", " TWENTYSIXTH": " 26TH",
            " TWENTY-SEVENTH": " 27TH", " TWENTYSEVENTH": " 27TH",
            " TWENTY-EIGHTH": " 28TH", " TWENTYEIGHTH": " 28TH",
            " TWENTY-NINETH": " 29TH", " TWENTYNINETH": " 29TH",
            " THIRTIETH": " 30TH",
            " THIRTY-FIRST": " 31ST", " THIRTYFIRST": " 31ST",
            " THIRTY-SECOND": " 32ND", " THIRTYSECOND": " 32ND",
            " THIRTY-THIRD": " 33RD", " THIRTYTHIRD": " 33RD",
            " THIRTY-FOURTH": " 34TH", " THIRTYFOURTH": " 34TH",
            " THIRTY-FIFTH": " 35TH", " THIRTYFIFTH": " 35TH",
            " THIRTY-SIXTH": " 36TH", " THIRTYSIXTH": " 36TH",
            " THIRTY-SEVENTH": " 37TH", " THIRTYSEVENTH": " 37TH",
            " THIRTY-EIGHTTH": " 38TH", " THIRTYEITGHTH": " 38TH",
            " THIRTY-NINETH": " 39TH", " THIRTYNINETH": " 39TH",
            " FOURTIETH": " 40TH",
            " FOURTY-FIRST": " 41ST", " FOURTYFIRST": " 41ST",
            " FOURTY-SECOND": " 42ND", " FOURTYSECOND": " 42ND",
            " FOURTY-THIRD": " 43RD", " FOURTYTHIRD": " 43RD",
            " FOURTY-FOURTH": " 44TH", " FOURTYFOURTH": " 44TH",
            " FOURTY-FIFTH": " 45TH", " FOURTYFIFTH": " 45TH",
            " FOURTY-SIXTH": " 46TH", " FOURTYSIXTH": " 46TH",
            " FOURTY-SEVENTH": " 47TH", " FOURTYSEVENTH": " 47TH",
            " FOURTY-EIGHTH": " 48TH", " FOURTYEIGHTH": " 48TH",

            " STREET": " ST",
            " PLACE": " PL",
            " AVENUE": " AVE",
            " ALLEY": " ALY",
            " BOULEVARD": " BLVD",
            " CIRCLE": " CIR",
            " COURT": " CT",
            " DRIVE": " DR",
            " HILL": " HL",
            " LANE": " LN",
            " PLAZA": "P LZ",
            " ROAD": " RD",
            " TERRACE": " TER"
        };

        for (var key in cleanAddressMappingValues) {
            var valuesToReplaceWith = cleanAddressMappingValues[key];
            // console.log(key + ':' + valuesToReplaceWith)
            searchVal = searchVal.replace(key, valuesToReplaceWith);
        }
        return searchVal;
    }

    function cleanAddressOrParcelStringBeforeSearch(searchString) {
        console.log('in clean address')
        searchString = searchString.toUpperCase();
        
        var uri = '';
        // searchString = searchString.replace(" 7TH", " 07TH");
        // Search for address or parcel search
        if (searchString === '') {
            console.log('You searched for nothing')
        } else if ((searchString.substr(4, 1) != ".") 
            && (parseInt(searchString.length) > 6)
            && (parseInt(searchString.length) < 10)
            && (isNumeric(searchString.substr(0, 4)))
            && (isNumeric(searchString.substr(5, 2)))) {
            // Searching for a parcel
            SearchCtrl.setBaseSearchString(searchString);
            MapComponent.searchMapByParcel(searchString);
            uri = URLCtrl.callUpdateUrlParameter(uri, 'parcel', searchString);
            history.replaceState(null, null, uri);
        } else {
            // Searching for address
            searchString = getCleanedAddress(searchString)

            SearchCtrl.setBaseSearchString(searchString);
            MapComponent.searchMapByAddress(searchString);
            uri = URLCtrl.callUpdateUrlParameter(uri, 'address', searchString);
            history.replaceState(null, null, uri);
        }
    }

    function handleAddingPlant(event) {
        var parentDivWithPlantId = event.target.parentElement.parentElement.parentElement;
        var currPlantId = parentDivWithPlantId.getAttribute('data-itemid');
        var allPlantsArr = PlantItems.getPlantsArray()
        var matchingPlantItem = allPlantsArr.filter(function (plantItem) {
            return currPlantId === plantItem.plantID;
        })[0];

        if (!CustomPlantList.plantInCustomList(currPlantId)) {
            CustomPlantList.addTocustomPlantList(matchingPlantItem);
            UICtrl.addToCustomListUI(matchingPlantItem);
            UICtrl.updateFavPlantCount('add');
        } else {
            alert('The plant you selected is already in your custom list');
        }
    }

    function handleDeletingPlant(event) {
        var parentDivWithPlantId = event.target.parentElement.parentElement;
        var currPlantId = parentDivWithPlantId.getAttribute('data-itemid');
        CustomPlantList.removeFromCustomPlantList(currPlantId);
        UICtrl.updateFavPlantCount('minus');

        UICtrl.deletePlantFromUI(event);
    }

    function updatePlantDisplayBasedOnInputClick() {
        var previousSqlStatement = SqlCtrl.getOverAllSqlStatement();
        if (previousSqlStatement !== undefined) {
            SqlCtrl.combineBaseSqlWithFilterSqlAndSearch(previousSqlStatement);
            uri = URLCtrl.getQueryString();
            history.replaceState(null, null, uri);
        } else {
            $(UISelectors.loadingSpinner).hide();

            $(UISelectors.mainPage).removeClass('disabledDIV');
            console.log('made it here')
        }

    }

    function handleClick(event) {
        var currClassName = event.target.className;
        var clickedType = event.target.type;
        if (currClassName.indexOf('add-to-custom-list') !== -1) {
            handleAddingPlant(event);
            if (showFavListForFirstTime === true) {
                UICtrl.showFavList();
                showFavListForFirstTime = false;
            }
        } else if (currClassName.indexOf('fas fa-times-circle') !== -1) {
            handleDeletingPlant(event);
        } else if (currClassName === 'print') {
            printResults(PlantItems.getPlantsArray())
        } else if (currClassName === 'print-custom-list') {
            printResults(CustomPlantList.getCustomPlantList());
        } else if (clickedType === 'checkbox') {
            $(UISelectors.loadingSpinner).show();
            $('.main').addClass('disabledDIV');
            updatePlantDisplayBasedOnInputClick();
        } else if (currClassName === 'clear-filter-button') {
            $('.main').addClass('disabledDIV');
            UICtrl.clearCheckboxes();
            URLCtrl.resetUrl();
            $(UISelectors.loadingSpinner).show();
            updatePlantDisplayBasedOnInputClick();
        } else if (currClassName === 'show-feedback-form') {
            FeedbackCtrl.showFeedbackForm();
        }
    }

    function makeSuggestionForSearch(searchStr) {
        if (apiRequest) {
            apiRequest.abort();
        }
        if (searchStr.length > 1) {
        // https://sfplanninggis.org/arcgiswa/rest/services/Geocoder_plantSF/MapServer/0/query?where=Address+like+%27012%25%27&text=&objectIds=&time=&geometry=&geometryType=esriGeometryEnvelope&inSR=&spatialRel=esriSpatialRelIntersects&relationParam=&outFields=Address%2C+Priority&returnGeometry=false&returnTrueCurves=false&maxAllowableOffset=&geometryPrecision=&outSR=&returnIdsOnly=false&returnCountOnly=false&orderByFields=&groupByFieldsForStatistics=&outStatistics=&returnZ=false&returnM=false&gdbVersion=&returnDistinctValues=false&resultOffset=&resultRecordCount=15&queryByDistance=&returnExtentsOnly=false&datumTransformation=&parameterValues=&rangeValues=&f=html
            var plantsfGeocoderUrl = 'https://sfplanninggis.org/arcgiswa/rest/services/Geocoder_plantSF/MapServer/0';
            var queryUrl = plantsfGeocoderUrl +"/query?where=Address+like+%27" + searchStr +"%25%%27&geometryType=esriGeometryEnvelope&spatialRel=esriSpatialRelIntersects&outFields=Address,Priority&returnGeometry=false&returnTrueCurves=false&returnIdsOnly=false&returnCountOnly=false&returnZ=false&returnM=false&returnDistinctValues=false&resultRecordCount=9&returnExtentOnly=false&f=json"
            apiRequest =  $.ajax({
                url: queryUrl,
                success: function(results) {
                    UICtrl.displaySearchSugesstions(results);
                }
            })
            $(UISelectors.searchInput).val(searchStr);
        }
    }

    function listenForEvents() {
        // Clicking on pre-defined buttons
        $('.category-buttons').on('click', function (event) {
            var uri = '';
            var searchValue = event.target.getAttribute('value');
            var tempSqlHolder;
            $(UISelectors.loadingSpinner).show();
            $(UISelectors.searchInput).val('');
            $('.main').addClass('disabledDIV');
            UICtrl.clearCheckboxes();

            SearchCtrl.setAdditionalSearchString('');

            // baseSql = MapComponent.searchByDefinedListAndGetSql(searchValue);
            tempSqlHolder = MapComponent.searchByDefinedListAndGetSql(searchValue);
            SqlCtrl.setOverallSqlStatement(tempSqlHolder);
            // MapComponent.setOverallSqlStatement(tempSqlHolder);

            uri = URLCtrl.callUpdateUrlParameter(uri, "choice", searchValue);
            history.replaceState(null, null, uri);
        });

        // Remove logo if scrolling and addback when at top
        $(window).scroll(function() {
            if ($(this).scrollTop() > 0) {
                UICtrl.hideTopLogo();

            } else {
                UICtrl.showTopLogo();
            }
        });

        // Event listener for favorites list
        $('.fa-times').click(function() {
            UICtrl.hideFavList();
        })

        $('#favorites-symbol').click(function() {
            UICtrl.showFavList();
        })

        // Display suggestions below input
        document.querySelector(UISelectors.searchInput).addEventListener('keyup', function(event) {
            event.preventDefault();
            var searchVal = event.target.value.toUpperCase();
            searchVal = getCleanedAddressForAutoComplete(searchVal);
            if (event.keyCode === 13) {
                cleanAddressOrParcelStringBeforeSearch(searchVal)
            } else {
                makeSuggestionForSearch(searchVal)
            }
        })

        // Event delegation to handle generated html
        document.addEventListener('click', handleClick);

        // Clicking on submit button to search
        document.querySelector(UISelectors.searchButton).addEventListener('click', function (event) {
            event.preventDefault();
            var searchInput = document.querySelector(UISelectors.formInput).value;
            cleanAddressOrParcelStringBeforeSearch(searchInput);
        });

        // Check for query params in url after map has loaded
        window.onload = function () {
            var view = MapComponent.getView();
            view.when(function () {
                document.querySelector(UISelectors.mapContainer).classList.remove('disabledDIV')
                document.querySelector(UISelectors.spinLoaderForMap).style.display = 'none';

                $(UISelectors.loadingSpinner).hide();
                $(UISelectors.mainPage).removeClass('disabledDIV')
                URLCtrl.checkForQueryParams();
            });
        }
    }

    function initialize() {
        var year = new Date().getFullYear();
        $(UISelectors.loadingSpinner).show();
        $('.main').addClass('disabledDIV');
        $(UISelectors.calenderYear).text(year)
    }

    return {
        init: function () {
            initialize();
            listenForEvents();
        },
        applyQueryParamsSearch: function (sql) {
            SqlCtrl.combineBaseSqlWithFilterSqlAndSearch(sql)
        }

    }
}(MapComponent, UICtrl, PlantItems, CustomPlantList);

// In charge of deleteing with plant items
var PlantItems = function () {
    // 
    var plantsArray = [];
    var returnPlantDataFromAPI;

    return {
        addToPlantArray: function (plantItem) {
            plantsArray.push(plantItem);
        },
        getPlantsArray: function () {
            return plantsArray;
        },
        emptyPlantListArray: function () {
            plantsArray = [];
        },
        setReturnPlantData: function (data) {
            returnPlantDataFromAPI = data;
        },
        getAllReturnPlantData: function () {
            return returnPlantDataFromAPI;
        },
        getSpecificReturnPlantData: function (index) {
            return returnPlantDataFromAPI[index];
        }
    }
}();

// In charge of deleting and appending to custom plant list
var CustomPlantList = function () {
    var customPlantListArr = [];

    return {
        addTocustomPlantList: function (plantItem) {
            customPlantListArr.push(plantItem);
        },
        clearCustomList: function() {
            customPlantListArr = [];
            var uiSelectors = UICtrl.getUISelectors();
            $(uiSelectors.customPlantListUl).html('');
            $(uiSelectors.favoritePlantListCount).html('0');
        },
        removeFromCustomPlantList: function (plantId) {
            var plantToRemoveIndex = customPlantListArr.map(function (plant) {
                return plant.plantID
            }).indexOf(plantId);
            customPlantListArr.splice(plantToRemoveIndex, 1);
        },
        getCustomPlantList: function () {
            return customPlantListArr;
        },
        plantInCustomList: function (idOfPlant) {
            var plantMatchArr = customPlantListArr.filter(function (plantItem) {
                return idOfPlant === plantItem.plantID;
            });
            return plantMatchArr.length > 0 ? true : false;
        }
    }
}();


function printResults(plantListToPrint) {
    var printHTML = "<!DOCTYPE html>"
    printHTML += "\n<html lang='en-US'>"
    printHTML += "\n<head>"
    printHTML += "\n<meta charset='UTF-8' />"
    printHTML += '<meta http-equiv="X-UA-Compatible" content="IE=7">'
    // printHTML +="\n<LINK REL='SHORTCUT ICON' HREF='http://50.17.237.182/PIM/images/bannericonTransSmall.ico'>"
    printHTML += "\n<LINK REL='SHORTCUT ICON' HREF='http://" + 'sfplanninggis.org' + ":6080/PIM/images/bannericonTransSmall.ico'>"
    printHTML += "\n<title>SF Plant Finder - Printable Page</title>"

    printHTML += "\n<link rel='stylesheet' href='css/style.css'>"
    //printHTML +="\n<link rel='stylesheet' href='http://" + theServerName + "/plantsf/css/print.css'>"
    printHTML += "\n<style type='text/css'>"
    printHTML += "\n@media print {"
    printHTML += "\n    .NoPrint {display: none;}"
    printHTML += "\n}"
    printHTML += "\n</style>"
    printHTML += "\n<script>var dojoConfig = {parseOnLoad: true};</script>"

    printHTML += "\n<script src='js/printable.js'></script>"
    printHTML += "\n</head>"
    printHTML += "\n<body class='claro' >"

    printHTML += "<div class='no-print-borders' id='mainContentShell' >"
    printHTML += "<div class='no-print-borders' id='mainContent' >"
    printHTML += "<div class='no-print-borders' id='mainContent-SearchResults' >"

    printHTML += "<div class='no-print-borders' id='info' style='min-height: 1000px;'>"
    printHTML += "<div class='no-print-borders' id='searchResultss' >"


    // var thetemp = theLastSummary.replace(" (check for nursery availability by clicking on a plant):", ". Give this list to your landscaper or take it to your local nursery.")
    // thetemp = thetemp.replace("<br><div style='height:5px;'></div><span id='printInstructions'>Click \"Print\" to save/print a shopping list and then give this list to your landscaper or take it down to your local nursery.</span>", "")
    // thetemp = thetemp.replace("<br> <div style='height:5px;'></div>Check for nursery availability by clicking on a plant.", "")
    // option === 'shopping-list' ? thetemp = 'Custom shopping list' : thetemp = thetemp;
    // printHTML += "\n<span id='searchResultsSummary'>" + thetemp + "</span><br><br>"


    for (var i = 0, il = plantListToPrint.length; i < il; i++) {
        printHTML += '<div style=" width: 200px; height: 100px; float:left; display:flex">' +
            '<div>' +
            '<img style="width:70px; height:70px" src="' + plantListToPrint[i].plantImageURL + '">' +
            '</div>' +
            '<div style="margin-left:10px">' +
            '<span style="vertical-align:top; font-size:13px">' + plantListToPrint[i].plantCommonName + '</span><br>' +
            '<span style="color:gray; font-size:12px; font-style:italic">' + plantListToPrint[i].plantLatinName + '</span>' +
            '</div>' +
            '</div>'
    }

    //printHTML +=thePlantListHtmlToPrint;
    printHTML += "</div>"
    printHTML += "</div>"
    printHTML += "</div>"
    printHTML += "</div>"
    printHTML += "</div>"
    printHTML += "</body>"
    printHTML += "</html>"
    OpenWindow = window.open("", "PrintPlantList", "height=650, width=1050, status=yes, toolbar=yes,scrollbars=yes,menubar=yes,resizable=yes");
    OpenWindow.document.write(printHTML)
    OpenWindow.document.close()
    OpenWindow.focus();
}

App.init();