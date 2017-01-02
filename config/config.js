var path = require('path'),
  rootPath = path.normalize(__dirname + '/..'),
  env = process.env.NODE_ENV || 'development';

var config = {
  development: {
    root: rootPath,
    app: {
      name: 'dashtest'
    },
    port: process.env.PORT || 3000,
    dash: {
      url: 'https://service.dashcs.com/dash-api/xml/emergencyprovisioning/v1/'
    },
  },

  test: {
    root: rootPath,
    app: {
      name: 'dashtest'
    },
    dash: {
      url: 'https://service.dashcs.com/dash-api/xml/emergencyprovisioning/v1/'
    },
    port: process.env.PORT || 3000,
  },

  production: {
    root: rootPath,
    app: {
      name: 'dashtest'
    },
    dash: {
      url: 'https://service.dashcs.com/dash-api/xml/emergencyprovisioning/v1/'
    },
    port: process.env.PORT || 3000,
  }
};

module.exports = config[env];
