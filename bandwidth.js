var rp = require('request-promise');

var client = {};
client.get = function(url, options) {
    var promise = rp.get(url, options)
    .then(function (response) {
        console.log('Response: ', response);
        return response;
    })
    .catch(function (err) {
        // API call failed... 
        console.log('Error: ', err);
        throw err;
    });

    return promise;
}

module.exports = client;