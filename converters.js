var parser = require('xml2json');
var _ = require('lodash');

var validateAddress = {};
validateAddress.createXmlString = function(obj) {
    var address = {
        validateLocation: {
            location: {
                address1: { $t: obj.addressLine1 },
                address2: { $t: obj.addressLine2 },
                community: { $t: obj.community },
                state: { $t: obj.state },
                postalcode: { $t: obj.postalCode },
                type: { $t: 'ADDRESS' }
            }
        }
    };
    var xml = parser.toXml(address);
    return xml;
}
validateAddress.createJsObject = function(xml) {
    var json = parser.toJson(xml, { object: true });
    var location = json['ns2:validateLocationResponse'].Location; 

    var address = {
      addressId: location.locationid['xsi:nil'] ? null : location.locationid,
      addressLine1: location.address1,
      addressLine2: _.isEmpty(location.address2) ? '' : location.address2,
      houseNumber: location.legacydata.housenumber,
      prefixDirectional: location.legacydata.predirectional,
      streetName: location.legacydata.streetname,
      //postDirectional: Unknown. Not in the Bandwidth response
      //streetSuffix: Unknown. Not in the Bandwidth response
      community: location.community,
      state: location.state,
      //unitType: Unknown. Not in the Bandwidth response
      //unitTypeValue: Unknown. Not in the Bandwidth response
      longitude: location.longitude,
      latitude: location.latitude,
      postalCode: location.postalcode,
      zipPlusFour: location.plusfour,
      //description: Unknown. Description found in response: "Location is geocoded"
      addressStatus: location.status.code,
      //createdOn: Unknown. activatedtime/updatetime found in response
      //modifiedOn: Unknown. activatedtime/updatetime found in response
    };

    return address;
}

var addAddress = {};
addAddress.createXmlString = function(obj) {
    var address = {
        addLocation: {
            uri: {
                callername: { $t: obj.endpoint.callerName },
                uri: { $t: obj.endpoint.did },
            },
            location: {
                address1: { $t: obj.addressLine1 },
                address2: { $t: obj.addressLine2 },
                callername: { $t: obj.endpoint.callerName },
                community: { $t: obj.community },
                postalcode: { $t: obj.postalCode },
                state: { $t: obj.state },
                type: { $t: 'ADDRESS' },
            }
        }
    };
    var xml = parser.toXml(address);
    return xml;
};
addAddress.createJsObject = function(xml, did) {
    var json = parser.toJson(xml, { object: true });
    var location = json['ns2:addLocationResponse'].Location; 

    var address = {
      addressId: location.locationid, 
      addressLine1: location.address1,
      addressLine2: location.address2['xsi:nil'] ? null : location.address2,
      houseNumber: location.legacydata.housenumber,
      prefixDirectional: location.legacydata.predirectional,
      streetName: location.legacydata.streetname,
      //postDirectional: '', Unknown. Not in the Bandwidth response
      //streetSuffix: '', Unknown. Not in the Bandwidth response
      community: location.community,
      state: location.state,
      //unitType: '', Unknown. Not in the Bandwidth response
      //unitTypeValue: '', Unknown. Not in the Bandwidth response
      longitude: location.longitude,
      latitude: location.latitude,
      postalCode: location.postalcode,
      zipPlusFour: location.plusfour,
      //description: '', Unknown. Description found in response: "Location is geocoded"
      addressStatus: location.status.code,
      //createdOn: '', Unknown. activatedtime/updatetime found in response
      //modifiedOn: '', Unknown. activatedtime/updatetime found in response
      endpoint: {
        did: did, // Not found in the Bandwidth response, but was part of the request
        callerName: location.callername
      }
    };

    return address;
};

module.exports = {
    validateAddress,
    addAddress
};