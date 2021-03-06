var _ = require('lodash');
var xml2js = require('xml2js');
var Promise = require("bluebird");

var parseXml = Promise.promisify(xml2js.parseString);

// Checks the object for XML null tags.
// If found, the function returns null. Otherwise, returns the original object.
function checkIfNull(obj) {
    if (obj.$ && obj.$['xsi:nil']) return null;
    return obj;
}

function createAddressStatus(status) {
    return checkIfNull(status.code[0]);
}

function createEndpoint(obj, did) {
    // Use explicit DID if available
    did = did || checkIfNull(obj.uri[0]);
    return {
        // Remove tel: prefix if present
        did: did.replace("tel:", ""),
        callerName: checkIfNull(obj.callername[0])
    };
}

function createAddress(location, did) {
    var address = {
        addressId: checkIfNull(location.locationid[0]) || 0, // return 0 instead of null
        addressLine1: checkIfNull(location.address1[0]),
        addressLine2: checkIfNull(location.address2[0]),
        houseNumber: checkIfNull(location.legacydata[0]) && checkIfNull(location.legacydata[0].housenumber[0]),
        prefixDirectional: checkIfNull(location.legacydata[0]) && checkIfNull(location.legacydata[0].predirectional[0]),
        streetName: checkIfNull(location.legacydata[0]) && checkIfNull(location.legacydata[0].streetname[0]),
        //postDirectional: '', Unknown. Not in the Bandwidth response
        //streetSuffix: '', Unknown. Not in the Bandwidth response
        community: checkIfNull(location.community[0]),
        state: checkIfNull(location.state[0]),
        //unitType: '', Unknown. Not in the Bandwidth response
        //unitTypeValue: '', Unknown. Not in the Bandwidth response
        longitude: checkIfNull(location.longitude[0]),
        latitude: checkIfNull(location.latitude[0]),
        postalCode: checkIfNull(location.postalcode[0]),
        zipPlusFour: checkIfNull(location.plusfour[0]),
        //description: '', Unknown. Description found in response: "Location is geocoded"
        addressStatus: createAddressStatus(location.status[0]),
        //createdOn: '', Unknown. activatedtime/updatetime found in response
        //modifiedOn: '', Unknown. activatedtime/updatetime found in response
    };

    // Include endpoint information if a DID was provided.
    if (did) {
        address.endpoint = createEndpoint(location, did);
    }

    return address;
}

var validateAddress = {};
validateAddress.createXmlString = function (obj) {
    var builder = new xml2js.Builder({ rootName: 'validateLocation' });
    var address = {
        location: {
            address1: obj.addressLine1,
            address2: obj.addressLine2,
            community: obj.community,
            state: obj.state,
            postalcode: obj.postalCode,
            type: 'ADDRESS'
        }
    };
    return builder.buildObject(address);
}
validateAddress.createJsObject = function (xml) {
    return parseXml(xml)
        .then(result => {
            var location = result['ns2:validateLocationResponse'].Location[0];
            return createAddress(location);
        });
}

var addAddress = {};
addAddress.createXmlString = function (obj) {
    var builder = new xml2js.Builder({ rootName: 'addLocation' });
    var address = {
        uri: {
            callername: obj.endpoint.callerName,
            uri: obj.endpoint.did
        },
        location: {
            address1: obj.addressLine1,
            address2: obj.addressLine2,
            callername: obj.endpoint.callerName,
            community: obj.community,
            postalcode: obj.postalCode,
            state: obj.state,
            type: 'ADDRESS'
        }
    };
    return builder.buildObject(address);
};
addAddress.createJsObject = function (xml, did) {
    return parseXml(xml)
        .then(result => {
            var location = result['ns2:addLocationResponse'].Location[0];
            return createAddress(location, did);
        });
};

var provisionAddress = {};
provisionAddress.createXmlString = function (obj) {
    var builder = new xml2js.Builder({ rootName: 'provisionLocation' });
    var locationId = {
        locationid: obj // Function takes a single int as a request
    }
    return builder.buildObject(locationId);
};
provisionAddress.createJsObject = function (xml) {
    return parseXml(xml)
        .then(result => {
            var status = result['ns2:provisionLocationResponse'].LocationStatus[0];
            return createAddressStatus(status); // Function returns only a single string;
        });
};

var getEndpoints = {};
getEndpoints.createJsObject = function (xml) {
    return parseXml(xml)
        .then(result => {
            var endpoints = _.map(result['ns2:getURIsResponse'].URIs[0].uris,
                uri => createEndpoint(uri)
            )
            return endpoints;
        })
}

var getAddressesByDid = {};
getAddressesByDid.createJsObject = function (xml, did) {
    return parseXml(xml)
        .then(result => {
            var addresses = _.map(result['ns2:getLocationsByURIResponse'].Locations,
                locations => createAddress(locations)
            );
            return addresses;
        });
}

var getProvisionedAddressByDid = {};
getProvisionedAddressByDid.createJsObject = function (xml, did) {
    return parseXml(xml)
        .then(result => {
            var location = result['ns2:getProvisionedLocationByURIResponse'].Location[0];
            return createAddress(location);
        });
};

var getProvisionedAddressHistoryByDid = {};
getProvisionedAddressHistoryByDid.createJsObject = function (xml, did) {
    return parseXml(xml)
        .then(result => {
            var addresses = _.map(result['ns2:getProvisionedLocationHistoryByURIResponse'].ProvisionedLocations,
                locations => createAddress(locations)
            );
            return addresses;
        });
}

var removeAddress = {};
removeAddress.createXmlString = function (obj) {
    var builder = new xml2js.Builder({ rootName: 'removelocation' });
    var locationId = {
        locationid: obj // Function takes a single int as a request
    }
    return builder.buildObject(locationId);
}
removeAddress.createJsObject = function (xml) {
    return parseXml(xml)
        .then(result => {
            var status = result['ns2:removeLocationResponse'].LocationStatus[0];
            return createAddressStatus(status); // Function returns only a single string;
        })
}

var removeEndpoint = {};
removeEndpoint.createXmlString = function (obj) {
    var builder = new xml2js.Builder({ rootName: 'removeURI' });
    var uri = {
        uri: obj // Function takes a single int as a request
    };
    return builder.buildObject(uri);
}
removeEndpoint.createJsObject = function (xml) {
    return parseXml(xml)
        .then(result => {
            var status = result['ns2:removeURIResponse'].URIStatus[0];
            return createAddressStatus(status); // Function returns only a single string
        });
}

var errors = {};
errors.createJsObject = function (xml) {
    return parseXml(xml)
    .then (result => {
        var fault = result['ns1:XMLFault'];
        var error = {
            message: fault['ns1:faultstring'][0]._
        };

        if (fault['ns1:detail'][0]['ns1:NotFoundException']){
            error.type = "NotFound";
        }

        return error;
    });
}

module.exports = {
    validateAddress,
    addAddress,
    provisionAddress,
    getEndpoints,
    getAddressesByDid,
    getProvisionedAddressByDid,
    getProvisionedAddressHistoryByDid,
    removeAddress,
    removeEndpoint,
    errors
};