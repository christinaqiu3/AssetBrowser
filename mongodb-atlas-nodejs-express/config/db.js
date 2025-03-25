const mongodb = require('mongodb');

function connect() {
 mongodb.connect(process.env.MONGODB_URI, {
   useNewUrlParser: true,
   useUnifiedTopology: true,
 })
   .then((client) => {
     console.log('Connected to MongoDB');
     // Do something with the MongoDB client
   })
   .catch((error) => {
     console.error('Failed to connect to MongoDB', error);
     process.exit(1);
   });
}

module.exports = { connect };