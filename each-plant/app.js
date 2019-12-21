/*
    This will take the plant name from the url and then send a request 
    to the ArcGIS API to retrieve information about it
*/
function getQueryPromise() {
    var searchParameter = window.location.search;
    var plantLatinName = decodeURI(searchParameter.split('=')[1])
    var promise;
    if (plantLatinName.includes(' ')) {
        plantLatinName = plantLatinName.replace(/'/g, "''")

    }

    var PLANT_TABLE_URL = 'http://sfplanninggis.org/arcgiswa/rest/services/PlantSFv4/MapServer/13';
    var plantIdQuery = "Latin_Name = '" + plantLatinName + "'"
    require(["esri/tasks/QueryTask", "esri/tasks/support/Query"], function(QueryTask, Query){
        var queryTask  = new QueryTask({
            url: PLANT_TABLE_URL
        });
        var query = new Query();
        query.returnGeometry = true;
        query.outFields = ["*"];
        query.where = plantIdQuery
        promise = queryTask.execute(query);
    });
    return promise;

}

function getPlantAttributesAndReplaceNulls(attributes) {
    Object.keys(attributes).forEach(function(key) {
        if (attributes[key] === null) {
            attributes[key] = 'N/A'
        }
        if (typeof attributes[key] === 'string' && attributes[key].includes(';') && key !== 'Suggested_Green_Connection_Routes') {
            attributes[key] = attributes[key].split(';').join(', ')
        }  
    })
    return attributes;
}

function createElementWithClassName(elementType, className) {
    // Create elements based on element type 
    var element = document.createElement(elementType);
    element.setAttribute('class', className);
    return element;
}

function getPhotoPortionOfPlantDetail(adjustedPlantAttributes) {
    var PICTURE_SIZE = 150;
    var latinName = adjustedPlantAttributes.Latin_Name;
    var separator = document.createElement('hr');

    var imagesContainer = createElementWithClassName('div', 'imagesContainer');

    for (var i = 0; i < 4; i++) {
        var fullDisplayPictureLocation = '../images/plants/full/' + latinName + '0' + (i+1) + '.jpg';

        var currPicture = new Image(PICTURE_SIZE, PICTURE_SIZE);
        currPicture.src = fullDisplayPictureLocation;
        imagesContainer.appendChild(currPicture);
    }
    imagesContainer.append(separator);
    return imagesContainer;
}

function getGreenConnectionRoutesHtml(greenConnectionString) {
    console.log(greenConnectionString)
    var greenConnectionAnchorString = '';
    var greenConnectionArr = greenConnectionString.split(';')
    greenConnectionArr.forEach(function(routeNum) {
        greenConnectionAnchorString += '<a target="_blank" href="../docs/EcologyGuides_Route_' + routeNum + '.pdf"><img src="../images/gc-route' + routeNum + '-marker.png" height="32" align="absmiddle" /></a>&nbsp; '
    });
  
    
    return greenConnectionAnchorString;
}

function getTextPortionOfPlantDetail(adjustedPlantAttributes) {
    console.log(adjustedPlantAttributes)
    var namesSection = createElementWithClassName('div', 'familyNames');
    var textPortionContainer = createElementWithClassName('div', 'textPortion');
    var tableContainer = createElementWithClassName('div', 'tableContainer');

    var greenConnectionInfo = adjustedPlantAttributes.Suggested_Green_Connection_Routes;
    if (greenConnectionInfo != 'N/A') {
        greenConnectionInfo = getGreenConnectionRoutesHtml(greenConnectionInfo)
    }
    
    var namesMapping = {
        'Latin Name': 'Latin_Name',
        'Former Latin Name': 'Former_Latin_Name',
        'Family Name': 'Family_Name'
    }

    Object.keys(namesMapping).forEach(function(key) {
        var currName = document.createElement('p');
        currName.setAttribute('class', 'nameDescription');
        // currName.innerHTML = `<b>${key}</b>: ${adjustedPlantAttributes[namesMapping[key]]}`;
        currName.innerHTML = '<b>' + key + '</b>:' + adjustedPlantAttributes[namesMapping[key]];

        namesSection.appendChild(currName)
    });

    tableContainer.innerHTML = 
    `
    <table class="table">
        <tr>
            <th scope="row">Additional Species, Cultivars and varieties: </th>
                <td>${adjustedPlantAttributes.Additional_Characteristices_Notes}</td>
            <th scope="row">Plant Type: </th>
                <td>${adjustedPlantAttributes.Plant_Type}</td>
        </tr>
        <tr>
            <th scope="row">Bloom Time: </th>
                <td>${adjustedPlantAttributes.Bloom_Time}</td>
            <th scope="row">Flower Color: </th>
                <td>${adjustedPlantAttributes.Flower_Color}</td>
        </tr>
        <tr>
            <th scope="row">Size at Maturity: </th>
                <td> ${adjustedPlantAttributes.Size_at_Maturity}</td>
            <th scope="row">Appropriate Location: </th>
                <td>${adjustedPlantAttributes.Appropriate_Location}</td>
        </tr>
        <tr>
            <th scope="row">Watering Needs: </th>
                <td>${adjustedPlantAttributes.Water_Needs}</td>
            <th scope="row">Site Conditions: </th>
                <td>${adjustedPlantAttributes.Suitable_Site_Conditions}</td>
        </tr>
        <tr>
            <th scope="row">Soil: </th>
                <td>${adjustedPlantAttributes.Soil_Type}</td>
            <th scope="row">Climate Appropriate: </th>
                <td>${adjustedPlantAttributes.Climate_Appropriate_Plants}</td></tr>
        <tr>
            <th scope="row">Plant Communities: </th>
                <td>${adjustedPlantAttributes.Plant_Communities}</td>
            <th scope="row">Habitat Value: </th>
                <td>${adjustedPlantAttributes.Habitat_Value}</td>
        </tr>
        <tr>
            <th scope="row">Associated Wildlife: </th>
                <td>${adjustedPlantAttributes.Associated_Wildlife}</td>
            <th scope="row">Nurseries: </th>
                <td>${adjustedPlantAttributes.Nurseries}</td>
            </tr>
        <tr>
            <th scope="row">Suggested for Green Connections Routes: </th>
                <td>
                    ${greenConnectionInfo}
                </td>
            <th scope="row">Approved Street Tree List: </th>
                <td>${adjustedPlantAttributes.Street_Tree_List}</td>
        </tr>
        <tr>
            <th scope="row">Additional Characteristics: </th>
                <td>${adjustedPlantAttributes.Additional_Characteristices_Notes}</td>
            <th scope="row"></th>
                <td></td>
        </tr>

    </table>
    `

    textPortionContainer.appendChild(namesSection);
    textPortionContainer.appendChild(tableContainer)
    return textPortionContainer
}

function getPlantTitlePortion(adjustedPlantAttributes) {
    var titleContainer = createElementWithClassName('div', 'title-container');
    var separator = document.createElement('hr');
    var h1Title = document.createElement("H1")  
    var commonName = adjustedPlantAttributes.Common_Name;
    var textTitle = document.createTextNode(commonName); 
    h1Title.appendChild(textTitle);
    titleContainer.appendChild(h1Title);
    titleContainer.append(separator)
    return titleContainer;
}

getQueryPromise().then(function(response) {
    var plantAttributes = response.features[0].attributes;
    var adjustedPlantAttributes = getPlantAttributesAndReplaceNulls(plantAttributes);
    var plantDetailContainer = createElementWithClassName('div', 'picture');



    var titlePortion = getPlantTitlePortion(adjustedPlantAttributes);
    var photoPortion = getPhotoPortionOfPlantDetail(adjustedPlantAttributes);
    var textPortion = getTextPortionOfPlantDetail(adjustedPlantAttributes);

    plantDetailContainer.appendChild(titlePortion)
    plantDetailContainer.appendChild(photoPortion)
    
    plantDetailContainer.appendChild(textPortion)
    $('body').html(plantDetailContainer)


})

