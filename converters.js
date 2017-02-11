var _ = require('lodash');
var xml2js = require('xml2js');
var Promise = require("bluebird");

var parseXml = Promise.promisify(xml2js.parseString);

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
            return {
                addressId: location.locationid[0].$['xsi:nil'] ? null : location.locationid[0],
                addressLine1: location.address1[0],
                addressLine2: location.address2[0],
                houseNumber: location.legacydata[0].housenumber[0],
                prefixDirectional: location.legacydata[0].predirectional[0].$ && location.legacydata[0].predirectional[0].$['xsi:nil']
                    ? null : location.legacydata[0].predirectional[0],
                streetName: location.legacydata[0].streetname[0],
                //postDirectional: Unknown. Not in the Bandwidth response
                //streetSuffix: Unknown. Not in the Bandwidth response
                community: location.community[0],
                state: location.state[0],
                //unitType: Unknown. Not in the Bandwidth response
                //unitTypeValue: Unknown. Not in the Bandwidth response
                longitude: location.longitude[0],
                latitude: location.latitude[0],
                postalCode: location.postalcode[0],
                zipPlusFour: location.plusfour[0],
                //description: Unknown. Description found in response: "Location is geocoded"
                addressStatus: location.status[0].code[0],
                //createdOn: Unknown. activatedtime/updatetime found in response
                //modifiedOn: Unknown. activatedtime/updatetime found in response
            };
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
            return {
                addressId: location.locationid[0],
                addressLine1: location.address1[0],
                addressLine2: location.address2[0].$ && location.address2[0].$['xsi:nil'] ? null : location.address2[0],
                houseNumber: location.legacydata[0].housenumber[0],
                prefixDirectional: location.legacydata[0].predirectional[0].$ && location.legacydata[0].predirectional[0].$['xsi:nil']
                    ? null : location.legacydata[0].predirectional[0],
                streetName: location.legacydata[0].streetname[0],
                //postDirectional: '', Unknown. Not in the Bandwidth response
                //streetSuffix: '', Unknown. Not in the Bandwidth response
                community: location.community[0],
                state: location.state[0],
                //unitType: '', Unknown. Not in the Bandwidth response
                //unitTypeValue: '', Unknown. Not in the Bandwidth response
                longitude: location.longitude[0],
                latitude: location.latitude[0],
                postalCode: location.postalcode[0],
                zipPlusFour: location.plusfour[0],
                //description: '', Unknown. Description found in response: "Location is geocoded"
                addressStatus: location.status[0].code[0],
                //createdOn: '', Unknown. activatedtime/updatetime found in response
                //modifiedOn: '', Unknown. activatedtime/updatetime found in response
                endpoint: {
                    did: did, // Not found in the Bandwidth response, but was part of the request
                    callerName: location.callername[0]
                }
            };
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
            return status.code[0]; // Function returns only a single string;
        });
};

var getEndpoints = {};
getEndpoints.createJsObject = function (xml) {
    return parseXml(xml)
        .then(result => {
            var endpoints = _.map(result['ns2:getURIsResponse'].URIs[0].uris, uri => {
                return {
                    did: uri.uri[0],
                    callerName: uri.callername[0]
                }
            })
            return endpoints;
        })
}

var getAddressesByDid = {};
getAddressesByDid.createJsObject = function (xml, did) {
    return parseXml(xml)
        .then(result => {
            var addresses = _.map(result['ns2:getLocationsByURIResponse'].Locations, locations => {
                return {
                    addressId: locations.locationid[0],
                    addressLine1: locations.address1[0],
                    addressLine2: locations.address2[0].$ && locations.address2[0].$['xsi:nil'] ? null : locations.address2[0],
                    houseNumber: locations.legacydata[0].housenumber[0],
                    prefixDirectional: locations.legacydata[0].predirectional[0].$ && locations.legacydata[0].predirectional[0].$['xsi:nil']
                        ? null : locations.legacydata[0].predirectional[0],
                    streetName: locations.legacydata[0].streetname[0],
                    //postDirectional: '', Unknown. Not in the Bandwidth response
                    //streetSuffix: '', Unknown. Not in the Bandwidth response
                    community: locations.community[0],
                    state: locations.state[0],
                    //unitType: '', Unknown. Not in the Bandwidth response
                    //unitTypeValue: '', Unknown. Not in the Bandwidth response
                    longitude: locations.longitude[0],
                    latitude: locations.latitude[0],
                    postalCode: locations.postalcode[0],
                    zipPlusFour: locations.plusfour[0],
                    //description: '', Unknown. Description found in response: "Location is geocoded"
                    addressStatus: locations.status[0].code[0],
                    //createdOn: '', Unknown. activatedtime/updatetime found in response
                    //modifiedOn: '', Unknown. activatedtime/updatetime found in response
                    endpoint: {
                        did: did, // Not found in the Bandwidth response, but was part of the request
                        callerName: locations.callername[0]
                    }
                }
            });
            return addresses;
        });
}

module.exports = {
    validateAddress,
    addAddress,
    provisionAddress,
    getEndpoints,
    getAddressesByDid
};