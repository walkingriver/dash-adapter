
var config = require('./config/config');
var rp = require('request-promise');
var restify = require('restify');
var parser = require('xml2json');
var options = {
  'auth': {
    'sendImmediately': true
  }
};

var server = restify.createServer();

server.use(restify.authorizationParser());
server.use(restify.acceptParser(server.acceptable));
server.use(restify.bodyParser({ mapParams: false }));

server.use(function (req, res, next) {
  console.log('Got request for ' + req.url);
  console.log('Auth: ', req.authorization);

  if (req.authorization && req.authorization.basic) {
    options.auth.user = req.authorization.basic.username;
    options.auth.pass = req.authorization.basic.password;
    return next();
  } else {
    res.send(401);
  }
});

server.post(/ValidateAddress/i, validateAddress);
server.post(/AddAddress/i, addAddress);

server.get('/', function (req, res, next) {
  // console.log(req);
  authCheck(req, res, next);
});


server.listen(config.port, function () {
  console.log('Listening on ', config.port);
});

function validateAddress(req, res, next) {
  //res.send('Not Yet Implemented.');
  //res.send(req.body);
  var address = {
    validateLocation: {
      location: {
        address1: { $t: req.body.addressLine1 },
        address2: { $t: req.body.addressLine2 },
        community: { $t: req.body.community },
        state: { $t: req.body.state },
        postalcode: { $t: req.body.postalCode },
        type: { $t: 'ADDRESS' }
      }
    }
  };
  var xml = parser.toXml(address);
  rp.post(config.dash.url + 'validatelocation', {
    auth: options.auth,
    body: xml,
    headers: [
        {
          name: 'content-type',
          value: 'application/xml'
        }
      ]
  })
  .then(function (response) {
    var json = parser.toJson(response, { object: true });
    var location = json['ns2:validateLocationResponse'].Location; 
    console.log(location);

    var validatedAddress = {
      //addressId: Unknown. Not in the Bandwidth response
      addressLine1: location.address1,
      addressLine2: Object.keys(location.address2).length === 0 && location.address2.constructor === Object ? '' : location.address2,
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

    res.json(validatedAddress);
    next();
  })
  .catch(function (err) {
    console.log('Error: ', err);
    res.writeHead(400, { 'Content-Type': 'text/plain' });
    res.end(err);
  });
}

function addAddress(req, res, next) {
  var address = {
    addLocation: {
      uri: {
        callername: { $t: req.body.endpoint.callerName },
        uri: { $t: req.body.endpoint.did },
      },
      location: {
        address1: { $t: req.body.addressLine1 },
        address2: { $t: req.body.addressLine2 },
        callername: { $t: req.body.endpoint.callerName },
        community: { $t: req.body.community },
        postalcode: { $t: req.body.postalCode },
        state: { $t: req.body.state },
        type: { $t: 'ADDRESS' },
      }
    }
  };

  rp.post(config.dash.url + 'addlocation', {
    auth: options.auth,
    body: parser.toXml(address),
    headers: [
        {
          name: 'content-type',
          value: 'application/xml'
        }
      ]
  })
  .then(function (response) {
    var json = parser.toJson(response, { object: true });
    var responseLocation = json['ns2:addLocationResponse'].Location; 
    console.log(responseLocation);

    var location = {
      addressId: responseLocation.locationid, 
      addressLine1: responseLocation.address1,
      addressLine2: responseLocation.address2['xsi:nil'] && null,
      houseNumber: responseLocation.legacydata.housenumber,
      prefixDirectional: responseLocation.legacydata.predirectional,
      streetName: responseLocation.legacydata.streetname,
      //postDirectional: '', Unknown. Not in the Bandwidth response
      //streetSuffix: '', Unknown. Not in the Bandwidth response
      community: responseLocation.community,
      state: responseLocation.state,
      //unitType: '', Unknown. Not in the Bandwidth response
      //unitTypeValue: '', Unknown. Not in the Bandwidth response
      longitude: responseLocation.longitude,
      latitude: responseLocation.latitude,
      postalCode: responseLocation.postalcode,
      zipPlusFour: responseLocation.plusfour,
      //description: '', Unknown. Description found in response: "Location is geocoded"
      addressStatus: responseLocation.status.code,
      //createdOn: '', Unknown. activatedtime/updatetime found in response
      //modifiedOn: '', Unknown. activatedtime/updatetime found in response
      endpoint: {
        did: req.body.endpoint.did, // Not found in the Bandwidth response, but was part of the request
        callerName: responseLocation.callername
      }
    };

    res.json(location);
    next();
  })
  .catch(function (err) {
    console.log('Error: ', err);
    res.writeHead(400, { 'Content-Type': 'text/plain' });
    res.end(err);
  })
}

function authCheck(req, res, next) {
  rp.get(config.dash.url + 'authenticationcheck ', options)
    .then(function (response) {
      console.log('Response: ', response);
      // res.writeHead(200, { 'Content-Type': 'text/xml' });
      res.send(response);
      next();
    })
    .catch(function (err) {
      // API call failed... 
      console.log('Error: ', err);
      res.writeHead(400, { 'Content-Type': 'text/plain' });
      res.end(err);
    });
}
