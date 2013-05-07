var mongoose = require('mongoose');

var ConnectionPool = function(options) {
  var connections = {},
    defaults = {
      poolSize: 5,
      expiryPeriod: 300000,
      checkPeriod: 60000
    },
    opt = {};

  if (typeof options === "undefined" || options === null) {
    opt = defaults;
  } else {
    for (var key in defaults) {
      if (defaults.hasOwnProperty(key)) {  
        opt[key] = (typeof options[key] !== 'undefined' && 
            options[key] !== null) ? options[key] : defaults[key];
      }
    }
  }

  var establishConnection = function(host, db) {
    var conn = mongoose.createConnection(host + '/' + db + '?poolSize=' + 
        opt.poolSize);
    var now = new Date();

    console.log('Creating connection for ' + host + '/' + db + ' at ' + now);

    connections[host] = connections[host] || {};
    connections[host][db] = connections[host][db] || {};

    connections[host][db].created = connections[host][db].created || now;
    connections[host][db].conn = conn;
    connections[host][db].lastUsed = now;

    return conn;
  };

  var cull = function() {
    var now = new Date();
    console.log('Checking for inactive connections at ' + now);
    for(var host in connections) {
      if (connections.hasOwnProperty(host)) {  
        for (var db in connections[host]) {
          if (connections[host].hasOwnProperty(db)) {  
            //Kill any connections that haven't been used in expiryPeriod
            if (typeof connections[host][db].lastUsed === 'undefined' || 
                connections[host][db].lastUsed === null || 
                now - connections[host][db].lastUsed > opt.expiryPeriod) {
              console.log('Killing connection for ' + host + '/' + db + 
                  ' at ' + now);
              delete connections[host][db];
            }
          }
        }
      }
    }
  };

  this.getConnection = function(host, db) {
    if (typeof connections[host] === 'undefined' || 
        connections[host] === null || 
        typeof connections[host][db] === 'undefined' || 
        connections[host][db] === null ||
        typeof connections[host][db].conn === 'undefined' || 
        connections[host][db].conn === null) {
      return establishConnection(host, db);
    }

    var now = new Date();
    console.log('Returning established connection for ' + host + '/' + db + 
        ' at ' + now);
    connections[host][db].lastUsed = now;

    return connections[host][db].conn;
  };

  //Check for any inactive connections once per checkPeriod
  setInterval(cull, opt.checkPeriod);
};

module.exports = ConnectionPool;
