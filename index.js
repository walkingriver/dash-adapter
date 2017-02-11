
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

server.listen(config.port, function () {
  console.log('Listening on ', config.port);
});

function validateAddress(req, res, next) {
  var converter = converters.validateAddress;

  var xml = converter.createXmlString(req.body);
  // bandwidth.post(config.dash.url + 'validatelocation', options, xml)
  // .then(function (response) {
  //   var obj = converter.createJsObject(response);
  //   res.json(obj);
  //   next();
  // })
  // .catch(function (err) {
  //   next(err);
  // });

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
    .then(function (response) {
      // One property is missing from the XML response, but is contained in the original request.
      var location = converter.createJsObject(response, req.body.endpoint.did);
      res.json(location);
      next();
    })
    .catch(function (err) {
      next(err);
    })
}

function provisionAddress(req, res, next) {
  var converter = converters.provisionAddress;

  var xml = converter.createXmlString(req.body);
  bandwidth.post(config.dash.url + 'provisionlocation', options, xml)
    .then(function (response) {
      var status = converter.createJsObject(response);
      res.send(status);
      next();
    })
    .catch(function (err) {
      next(err);
    })
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
