const express = require('express');//for routing
const { MongoClient } = require('mongodb');//for mongodb
const mongodb = require('mongodb');
const fs = require('fs');//for vedio streaming
const app = express();
const path = require('path');
const port = 3000;
const url = 'mongodb://localhost:27017';
let db; // Define a global variable to hold the database connection
 
// Connect to MongoDB at the start of the application
MongoClient.connect(url)
  .then((client) => {
    console.log('Connected successfully to MongoDB');
    db = client.db('videos'); // Store the database connection in the global variable
  })
  .catch((error) => {
    console.error('Error connecting to MongoDB:', error);
  });

app.get('/', (req, res) => {
  // This renders the home page
  console.log('cat');

  // Use the path module to get the absolute path to the index.html file
  const indexPath = path.join(__dirname, './index.html');
  // Send the index.html file as a response
  res.sendFile(indexPath);
});

app.get('/init-video', (req, res) => {
  // This renders the upload video page and uploads the bigbuck.mp4
  console.log('init-video');


  // Perform upload operations with the database
  const bucket = new mongodb.GridFSBucket(db);
  const videoUploadStream = bucket.openUploadStream('bigbuck');
  const videoReadStream = fs.createReadStream('./bigbuck.mp4');
  videoReadStream.pipe(videoUploadStream);
  console.log('upload done');  
  res.redirect('/');
    res.end();

});

app.get('/video', (req, res) => {
  console.log('videos');

  // Perform operations with the connected client
  const bucket = new mongodb.GridFSBucket(db);
  const downloadStream = bucket.openDownloadStreamByName('bigbuck');

  // Set the appropriate response headers for video streaming
  res.set('Content-Type', 'video/mp4');
  res.set('Content-Disposition', 'inline; filename=bigbuck.mp4');

  // Pipe the video data from MongoDB to the response object
  downloadStream.pipe(res);
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

