const mongodb = require('mongodb')

const connectionURL = 'mongodb+srv://fernc:spring25cs7000@cis7000-database.fdliv.mongodb.net/ '
const databaseName = 'task-manager'
const MongoClient = new mongodb.MongoClient(connectionURL, { useNewUrlParser: true })

function connect() {
  MongoClient.connect(process.env.MONGODB_URI, {
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


const AWS = require('aws-sdk');

const s3 = new AWS.S3();

(async () => {
await s3
    .putObject({
    Body: "hello world",
    Bucket: "production-pipelines-spring2025",
    Key: "my_file.txt",
    })
  .promise();
})();