# Mongoose-Connection-Pool

This module allows you to maintain an arbitrary number of changing Mongoose 
connections. It was designed for applications in which an unknown number of 
MongoDB databases contain similar collections. In such a case, the application
cannot define the connections up front; on the other hand it doesn't need
to keep inactive connections alive indefinitely.

The `getConnection(host, db)` method returns a connection to the requested 
host and database if one has already been created, otherwise it creates a 
new connection and returns that. When instantiating a `ConnectionPool` an 
options object can be passed in, the defaults for which are:

```javascript
{
  poolSize: 5, //The size of Mongoose's internal pool
  expiryPeriod: 300000, //The number of milliseconds after which a connection expires
  checkPeriod: 60000 //The frequency with which to check for expired connections
}
```

### Example Usage:

In db.js:

```javascript
var ConnectionPool = require('mongoose-connection-pool').ConnectionPool;

exports.connectionPool = ConnectionPool({
  poolSize: 3
});
```

In models.js:

```javascript
var mongoose = require('mongoose'),
  Schema = mongoose.Schema,
  connectionPool = require('./db.js').connectionPool;

var carSchema = new Schema({
  color: String,
  doors: Number,
  horsepower: Number
});

exports.CarFactory = function(host, db) {
  var conn = connectionPool.getConnection(host, db);
  return conn.model('cars', carSchema);
};
```

In file1.js:

```javascript
var CarFactory = require('./models.js').CarFactory,
  Car = CarFactory('localhost', 'my-garage'),
  car = new Car({
    color: 'yellow',
    doors: 2,
    horsepower: 25
  });
```

In file2.js:

```javascript
var CarFactory = require('./models.js').CarFactory,
  Car = CarFactory('mongo.example.com', 'another-garage'),
  car = new Car({
	  color: 'blue',
	  doors: 4,
	  horsepower: 275
  });
```
