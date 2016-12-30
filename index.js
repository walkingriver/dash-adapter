
var rp = require('request-promise');
var http = require('http');
var options = {
  'auth': {
    'user': 'development',
    'pass': 'b5@3b2d2D29',
    'sendImmediately': true
  }
};

http.createServer(function (req, res) {
  console.log('Got request for ' + req.url);
  authCheck(req, res);
}).listen(process.env.PORT || 80);

function authCheck(req, res) {
  rp.get('https://service.dashcs.com/dash-api/xml/emergencyprovisioning/v1/authenticationcheck ', options)
    .then(function (response) {
      console.log('Response: ', response);
      res.writeHead(200, { 'Content-Type': 'text/xml' });
      res.end(response);
    })
    .catch(function (err) {
      // API call failed... 
      console.log('Error: ', err);
      res.writeHead(400, { 'Content-Type': 'text/plain' });
      res.end(err);
    });
}
