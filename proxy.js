import { join } from 'path';

const request = require(request);
const express = require(express);

require('dotenv').config();

const app = express();




app.listen(process.env.PORT, () => {
  console.info(`Listening on port ${process.env.PORT}`);
});
