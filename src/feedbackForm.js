var windowNav = window.navigator;
var browserInfo = encodeURI(windowNav.userAgent);
var operatingSystemInfo1 = encodeURI(windowNav.oscpu);
var operatingSystemInfo2 = encodeURI(windowNav.platform);
var finalOperatingSystemInfo = operatingSystemInfo1 === undefined ? operatingSystemInfo1 : operatingSystemInfo2;

var nVer = navigator.appVersion;
var nAgt = navigator.userAgent;
var browserName = navigator.appName;
var fullVersion = '' + parseFloat(navigator.appVersion);
var majorVersion = parseInt(navigator.appVersion, 10);
var nameOffset, verOffset, ix;

function getBrowserInformation() {
    console.log(nAgt.indexOf('Trident'))
    // In Opera, the true version is after "Opera" or after "Version"
    if ((verOffset = nAgt.indexOf("Opera")) != -1) {
        browserName = "Opera";
        fullVersion = nAgt.substring(verOffset + 6);
        if ((verOffset = nAgt.indexOf("Version")) != -1)
            fullVersion = nAgt.substring(verOffset + 8);
    }
    // In MSIE, the true version is after "MSIE" in userAgent
    else if ((verOffset = nAgt.indexOf("MSIE")) != -1) {
        browserName = "Microsoft-Internet-Explorer";
        fullVersion = nAgt.substring(verOffset + 5);
    }
    else if (nAgt.indexOf('Trident') != -1) {
        browserName = "Microsoft-Internet-Explorer";
        fullVersion = nAgt.substring(verOffset + 5);
    }
    // In Chrome, the true version is after "Chrome" 
    else if ((verOffset = nAgt.indexOf("Chrome")) != -1) {
        browserName = "Chrome";
        fullVersion = nAgt.substring(verOffset + 7);
    }
    // In Safari, the true version is after "Safari" or after "Version" 
    else if ((verOffset = nAgt.indexOf("Safari")) != -1) {
        browserName = "Safari";
        fullVersion = nAgt.substring(verOffset + 7);
        if ((verOffset = nAgt.indexOf("Version")) != -1)
            fullVersion = nAgt.substring(verOffset + 8);
    }
    // In Firefox, the true version is after "Firefox" 
    else if ((verOffset = nAgt.indexOf("Firefox")) != -1) {
        browserName = "Firefox";
        fullVersion = nAgt.substring(verOffset + 8);
    }
    // In most other browsers, "name/version" is at the end of userAgent 
    else if ((nameOffset = nAgt.lastIndexOf(' ') + 1) <
        (verOffset = nAgt.lastIndexOf('/'))) {
        browserName = nAgt.substring(nameOffset, verOffset);
        fullVersion = nAgt.substring(verOffset + 1);
        if (browserName.toLowerCase() == browserName.toUpperCase()) {
            browserName = navigator.appName;
        }
    }
    // trim the fullVersion string at semicolon/space if present
    if ((ix = fullVersion.indexOf(";")) != -1)
        fullVersion = fullVersion.substring(0, ix);
    if ((ix = fullVersion.indexOf(" ")) != -1)
        fullVersion = fullVersion.substring(0, ix);

    majorVersion = parseInt('' + fullVersion, 10);
    if (isNaN(majorVersion)) {
        if (browserName != 'Microsoft-Internet-Explorer') {
            fullVersion = '' + parseFloat(navigator.appVersion);
            majorVersion = parseInt(navigator.appVersion, 10);
        }
    }
}


function feedback() {

    getBrowserInformation()

    console.log('clicked on feedback');
    $('#exampleModal').modal('show');

    document.addEventListener('click', function (event) {

        event.preventDefault();
        var currElementId = event.target.id;
        browserName = encodeURI(browserName);
        majorVersion = encodeURI(majorVersion);
        if (currElementId === 'form-submit-button') {
            var name = encodeURI(document.getElementById('inputName').value);
            var email = encodeURI(document.getElementById('inputEmail').value);
            var emailSubject = encodeURI(document.getElementById('inputSubject').value);
            var feedbackMessage = encodeURI(document.getElementById('feedbackMessage').value);

            // var name = document.getElementById('inputName').value.replace(/ /g, "%20");
            // var email = document.getElementById('inputEmail').value
            // var emailSubject = document.getElementById('inputSubject').value.replace(/ /g, "%20");
            // var feedbackMessage = document.getElementById('feedbackMessage').value.replace(/ /g, "%20");
            var urlOfWebsite = encodeURI(window.location.href);
            var data = {
                name: name,
                email: email,
                emailSubject: emailSubject,
                feedbackMessage: feedbackMessage,
                urlOfWebsite: urlOfWebsite,
                browserInfo: browserInfo,
                finalOperatingSystemInfo: finalOperatingSystemInfo,
                browserName: browserName,
                majorVersion: fullVersion,
            };


            var phpUrl = '//' + theServerName + '/Feedback/send-feedback.php';
            $.post(phpUrl, data, function (returnData) {
                console.log(returnData)
            })
                .fail(function (err) {
                });

            $('.modal-body').html('Thank you for your feedback <br>');
            var modalFooter = document.querySelector('.modal-footer');
            var submitButton = document.getElementById('form-submit-button')
            modalFooter.removeChild(submitButton);
        }
    });

}