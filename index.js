
var config = require('./config/config');
var rp = require('request-promise');
var restify = require('restify');
var converters = require('./converters');
var bandwidth = require('./bandwidth');
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

server.get('/', authCheck);
server.get({ path: '/GetEndpoints', flags: 'i' }, getEndpoints);
server.get({ path: '/GetAddressesByDid/:did', flags: 'i' }, getAddressesByDid);
server.get({ path: '/GetProvisionedAddressByDid/:did', flags: 'i' }, getProvisionedAddressByDid);
server.get({ path: '/GetProvisionedAddressHistoryByDid/:did', flags: 'i' }, getProvisionedAddressHistoryByDid);

server.del({ path: '/RemoveAddress/:id', flags: 'i'}, removeAddress);
server.del({ path: '/RemoveEndpoint/:did', flags: 'i' }, removeEndpoint);

server.listen(config.port, function () {
  console.log('Listening on ', config.port);
});

function validateAddress(req, res, next) {
  var converter = converters.validateAddress;

  var xml = converter.createXmlString(req.body);
  bandwidth.post(config.dash.url + 'validatelocation', options, xml)
    .then(response => converter.createJsObject(response))
    .then(address => {
      res.json(address);
      next();
    })
    .catch(err => next(err));
}

function addAddress(req, res, next) {
  var converter = converters.addAddress;

  var xml = converter.createXmlString(req.body);

  bandwidth.post(config.dash.url + 'addlocation', options, xml)
    // One property is missing from the XML response, but is contained in the original request.
    .then(response => converter.createJsObject(response, req.body.endpoint.did))
    .then(address => {
      res.json(address);
      next();
    })
    .catch(err => next(err));
}

function provisionAddress(req, res, next) {
  var converter = converters.provisionAddress;

  var xml = converter.createXmlString(req.body);
  bandwidth.post(config.dash.url + 'provisionlocation', options, xml)
    .then(response => converter.createJsObject(response))
    .then(status => {
      res.send(status);
      next();
    })
    .catch(err => next(err));
}

function authCheck(req, res, next) {
  bandwidth.get(config.dash.url + 'authenticationcheck ', options)
    .then(function (response) {
      res.send(response);
      next();
    })
    .catch(function (err) {
      // API call failed... 
      next(err);
    });
}

function getEndpoints(req, res, next) {
  var converter = converters.getEndpoints;

  bandwidth.get(config.dash.url + 'uris', options)
    .then(response => converter.createJsObject(response))
    .then(endpoints => {
      res.send(endpoints);
      next();
    })
    .catch(err => next(err));
}

function getAddressesByDid(req, res, next) {
  var converter = converters.getAddressesByDid;
  var did = req.params.did;
  bandwidth.get(config.dash.url + 'locationsbyuri/' + did, options)
    // One property is missing from the XML response, but is contained in the original request.
    .then(response => converter.createJsObject(response, did))
    .then(addresses => {
      res.send(addresses);
      next();
    })
    .catch(err => next(err));
}

function getProvisionedAddressByDid(req, res, next) {
  var converter = converters.getProvisionedAddressByDid;
  var did = req.params.did;
  bandwidth.get(config.dash.url + 'provisionedlocationbyuri/' + did, options)
    .then(response => converter.createJsObject(response, did))
    .then(address => {
      res.send(address);
      next();
    })
    .catch(err => next(err));
}

function getProvisionedAddressHistoryByDid(req, res, next) {
  var converter = converters.getProvisionedAddressHistoryByDid;
  var did = req.params.did;
  bandwidth.get(config.dash.url + 'provisionedlocationhistorybyuri/' + did, options)
    .then(response => converter.createJsObject(response, did))
    .then(history => {
      res.send(history);
      next();
    })
    .catch(err => next(err));
}

function removeAddress(req, res, next) {
  var converter = converters.removeAddress;
  var xml = converter.createXmlString(req.params.id);
  bandwidth.post(config.dash.url + 'removelocation', options, xml)
  .then(response => converter.createJsObject(response))
  .then(result => {
    res.send(result);
    next();
  })
  .catch(err => next(err));
}

function removeEndpoint(req, res, next) {
  var converter = converters.removeEndpoint;
  var xml = converter.createXmlString(req.params.did);
  bandwidth.post(config.dash.url + 'removeuri', options, xml)
    .then(response => converter.createJsObject(response))
    .then(result => {
      res.send(result);
      next();
    })
    .catch(err => next(err));
}