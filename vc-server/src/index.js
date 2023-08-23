import express from 'express'; 
import bodyParser from 'body-parser';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import multer from 'multer';

// defining the Express app
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// adding Helmet to enhance your Rest API's security
app.use(helmet());

// using bodyParser to parse JSON bodies into JS objects
// app.use(json());
// app.use(bodyParser.json());
app.use(bodyParser.json({ extended: true }));

// enabling CORS for all requests
app.use(cors());

// adding morgan to log HTTP requests
app.use(morgan('combined'));

// starting the server
app.listen(3001, () => {
  console.log('listening on port 3001');
});
 
import { upload } from '../users/controllers/controller.js';
 
const uploadMulter = multer({ dest: "uploads/" });
app.put('/upload', uploadMulter.single("file"), [
	upload
]); 
 
 