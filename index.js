
var config = require('./config/config');
var rp = require('request-promise');
var restify = require('restify');
var parser = require('xml2json');
var converters = require('./converters');
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

server.post({ path: '/ValidateAddress', flags: 'i' }, validateAddress);
server.post({ path: '/AddAddress', flags: 'i' }, addAddress);
server.post({ path: '/ProvisionAddress', flags: 'i' }, provisionAddress);


server.get('/', function (req, res, next) {
  // console.log(req);
  authCheck(req, res, next);
});


server.listen(config.port, function () {
  console.log('Listening on ', config.port);
});

function validateAddress(req, res, next) {
  var converter = converters.validateAddress;

  var xml = converter.createXmlString(req.body);
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
    var obj = converter.createJsObject(response);
    res.json(obj);
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
      addressLine2: responseLocation.address2['xsi:nil'] ? null : responseLocation.address2,
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

function provisionAddress(req, res, next) {
  var locationId = {
    provisionLocation: {
      locationid: { $t: req.body } // Function takes a single int as a request
    }
  };
  rp.post(config.dash.url + 'provisionlocation', {
    auth: options.auth,
    body: parser.toXml(locationId),
    headers: [
        {
          name: 'content-type',
          value: 'application/xml'
        }
      ]
  })
  .then(function (response) {
    var json = parser.toJson(response, { object: true });
    var status = json['ns2:provisionLocationResponse'].LocationStatus; 
    console.log(status);

    res.send(status.code);
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
