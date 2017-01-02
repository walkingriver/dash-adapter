
var config = require('./config/config');
var rp = require('request-promise');
var restify = require('restify');
var options = {
  'auth': {
    'sendImmediately': true
  }
};

var server = restify.createServer();

server.use(restify.authorizationParser());
server.use(restify.acceptParser(server.acceptable));

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

server.get('/', function (req, res, next) {
  // console.log(req);
  authCheck(req, res, next);
});


server.listen(config.port, function () {
  console.log('Listening on ', config.port);
});

function validateAddress(req, res, next) {
  res.send('Not Yet Implemented.');
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
