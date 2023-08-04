const express = require('express');
const { MongoClient, MongoRuntimeError } = require('mongodb');
const mongodb = require('mongodb');

const fs = require('fs');
const app = express();
const path = require('path');
const multer = require('multer');
const port = 3000;
const url = 'mongodb://localhost:27017';
let db;

// Connect to MongoDB at the start of the application
MongoClient.connect(url)
  .then((client) => {
    console.log('Connected successfully to MongoDB');
    db = client.db('videos');
  })
  .catch((error) => {
    console.error('Error connecting to MongoDB:', error);
    process.exit(1); // Exit the application if there's an error connecting to the database
  });

app.get('/', (req, res) => {
  const indexPath = path.join(__dirname, './index.html');
  res.sendFile(indexPath);
});

const upload = multer({ dest: 'uploads/' });

app.post('/init-video', upload.single('video'), (req, res) => {
  const originalFilename = req.file.originalname;
  const bucket = new mongodb.GridFSBucket(db);
  const videoUploadStream = bucket.openUploadStream(originalFilename);

  const videoReadStream = fs.createReadStream(req.file.path);

  videoReadStream.pipe(videoUploadStream);

  videoUploadStream.on('error', (error) => {
    console.error('Error during video upload:', error);
    res.sendStatus(500);
  });

  videoUploadStream.on('finish', () => {
    console.log('Upload done');
    fs.unlinkSync(req.file.path);
    res.sendStatus(200);
  });
});

app.get('/video/:filename', (req, res) => {
  const filename = req.params.filename;

  const bucket = new mongodb.GridFSBucket(db);
  const downloadStream = bucket.openDownloadStreamByName(filename);

  downloadStream.on('error', (error) => {
    if (error instanceof MongoRuntimeError && error.code === 'FileNotFound') {
      console.error(`File not found in GridFS: ${filename}`, error);
      res.sendStatus(404);
    } else {
      console.error(`Error during video streaming for ${filename}:`, error);
      res.sendStatus(500);
    }
  });

  res.set('Content-Type', 'video/mp4');
  res.set('Content-Disposition', `inline; filename=${filename}`);
  downloadStream.pipe(res);
});


app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
