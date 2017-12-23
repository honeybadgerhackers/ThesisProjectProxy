require('dotenv').config();
const express = require('express');
const proxy = require('express-http-proxy');
const axios = require('axios');

const { PORT, API_URL, AUTH_URL, REACT_NATIVE_PACKAGER_HOSTNAME } = process.env;

const app = express();

app.use(express.static("client"));

// app.all('/', (req, res) => {
//   res.send('Hello');
// })

app.post('/authorize', (req, res) => {
  req.on('data', async (chunk) => {
    const authorized = await axios({
      method: 'POST',
      url: AUTH_URL + '/authorize',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      data: chunk,
    }).then((response) => {
      const userData = response.data;

      if (userData.type !== 'success!') {
        return 'failed';
      }

      const {
        id, email, first_name, last_name,
        picture: { data: { url: picture } },
        accessToken: { access_token, expires_in },
      } = userData; 

      return JSON.stringify({
        social_media_id: id,
        social_media_token: access_token,
        first_name,
        last_name,
        email,
        picture,
      })
    }).catch((err) => {
      console.log(err);
      return res.status(401).send('something went wrong!');
    })

    if (authorized === 'failed') {
      console.log('authorize failed');
      return res.send(409);
    }

    return axios({
      method: 'POST',
      url: API_URL + '/user_account',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      data: authorized,
    }).then((response) => {
      res.send(response.data);
    }).catch((err) => {
      console.log(err);
      return res.status(401).send('something went wrong!');
    });
  })
});

app.all('/*', proxy(API_URL, {
  filter: () => {
    return true;
  }
}));

const serverParams = {
  port: PORT,
};

if (REACT_NATIVE_PACKAGER_HOSTNAME) {
  serverParams.host = REACT_NATIVE_PACKAGER_HOSTNAME;
}

app.listen(serverParams, () => {
  // eslint-disable-next-line
  console.log(`Listening on ${PORT}`);
});
