var _ = require('lodash');
var xml2js = require('xml2js');
var Promise = require("bluebird");

var parseXml = Promise.promisify(xml2js.parseString);

var validateAddress = {};
validateAddress.createXmlString = function (obj) {
    //     var address = {
    //         validateLocation: {
    //             location: {
    //                 address1: { $t: obj.addressLine1 },
    //                 address2: { $t: obj.addressLine2 },
    //                 community: { $t: obj.community },
    //                 state: { $t: obj.state },
    //                 postalcode: { $t: obj.postalCode },
    //                 type: { $t: 'ADDRESS' }
    //             }
    //         }
    //     };
    //     var xml = parser.toXml(address);
    //     return xml;

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
    // var json = parser.toJson(xml, { object: true });
    // var location = json['ns2:validateLocationResponse'].Location; 

    // var address = {
    //   addressId: location.locationid['xsi:nil'] ? null : location.locationid,
    //   addressLine1: location.address1,
    //   addressLine2: _.isEmpty(location.address2) ? '' : location.address2,
    //   houseNumber: location.legacydata.housenumber,
    //   prefixDirectional: location.legacydata.predirectional,
    //   streetName: location.legacydata.streetname,
    //   //postDirectional: Unknown. Not in the Bandwidth response
    //   //streetSuffix: Unknown. Not in the Bandwidth response
    //   community: location.community,
    //   state: location.state,
    //   //unitType: Unknown. Not in the Bandwidth response
    //   //unitTypeValue: Unknown. Not in the Bandwidth response
    //   longitude: location.longitude,
    //   latitude: location.latitude,
    //   postalCode: location.postalcode,
    //   zipPlusFour: location.plusfour,
    //   //description: Unknown. Description found in response: "Location is geocoded"
    //   addressStatus: location.status.code,
    //   //createdOn: Unknown. activatedtime/updatetime found in response
    //   //modifiedOn: Unknown. activatedtime/updatetime found in response
    // };

    // return address;

    return parseXml(xml)
        .then(result => {
            var location = result['ns2:validateLocationResponse'].Location[0];
            return {
                addressId: location.locationid[0].$['xsi:nil'] ? null : location.locationid[0],
                addressLine1: location.address1[0],
                addressLine2: location.address2[0],
                houseNumber: location.legacydata[0].housenumber[0],
                prefixDirectional: location.legacydata[0].predirectional[0],
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
    // var address = {
    //     addLocation: {
    //         uri: {
    //             callername: { $t: obj.endpoint.callerName },
    //             uri: { $t: obj.endpoint.did },
    //         },
    //         location: {
    //             address1: { $t: obj.addressLine1 },
    //             address2: { $t: obj.addressLine2 },
    //             callername: { $t: obj.endpoint.callerName },
    //             community: { $t: obj.community },
    //             postalcode: { $t: obj.postalCode },
    //             state: { $t: obj.state },
    //             type: { $t: 'ADDRESS' },
    //         }
    //     }
    // };
    // var xml = parser.toXml(address);
    // return xml;
};
addAddress.createJsObject = function (xml, did) {
    // var json = parser.toJson(xml, { object: true });
    // var location = json['ns2:addLocationResponse'].Location; 

    // var address = {
    //   addressId: location.locationid, 
    //   addressLine1: location.address1,
    //   addressLine2: location.address2['xsi:nil'] ? null : location.address2,
    //   houseNumber: location.legacydata.housenumber,
    //   prefixDirectional: location.legacydata.predirectional,
    //   streetName: location.legacydata.streetname,
    //   //postDirectional: '', Unknown. Not in the Bandwidth response
    //   //streetSuffix: '', Unknown. Not in the Bandwidth response
    //   community: location.community,
    //   state: location.state,
    //   //unitType: '', Unknown. Not in the Bandwidth response
    //   //unitTypeValue: '', Unknown. Not in the Bandwidth response
    //   longitude: location.longitude,
    //   latitude: location.latitude,
    //   postalCode: location.postalcode,
    //   zipPlusFour: location.plusfour,
    //   //description: '', Unknown. Description found in response: "Location is geocoded"
    //   addressStatus: location.status.code,
    //   //createdOn: '', Unknown. activatedtime/updatetime found in response
    //   //modifiedOn: '', Unknown. activatedtime/updatetime found in response
    //   endpoint: {
    //     did: did, // Not found in the Bandwidth response, but was part of the request
    //     callerName: location.callername
    //   }
    // };

    // return address;
};

var provisionAddress = {};
provisionAddress.createXmlString = function (obj) {
    // var locationId = {
    //     provisionLocation: {
    //         locationid: { $t: obj } // Function takes a single int as a request
    //     }
    // };
    // var xml = parser.toXml(locationId);
    // return xml;
};
provisionAddress.createJsObject = function (xml) {
    // var json = parser.toJson(xml, { object: true });
    // var status = json['ns2:provisionLocationResponse'].LocationStatus;
    // return status.code; // Function returns only a single string;
};

module.exports = {
    validateAddress,
    addAddress,
    provisionAddress
};