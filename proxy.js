require('dotenv').config();
const request = require('request-promise');
const express = require('express');
const proxy = require('express-http-proxy');

const { PORT, API_URL, AUTH_URL, REACT_NATIVE_PACKAGER_HOSTNAME } = process.env;

const app = express();

app.all('/', (req, res) => {
  res.send('Hello');
})

app.post('/authorize', (req, res) => {
  req.on('data', async (chunk) => {
    const authorized = await request({
      method: 'POST',
      uri: AUTH_URL + '/authorize',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: chunk,
    }, (err, response, body) => {
      if (err) {
        res.sendStatus(400)
      }
    }).then((body) => {
      const userData = JSON.parse(body)
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
      res.status(401).send('something went wrong!');
    })
    if (authorized === 'failed') {
      res.send(409);
      return;
    }
    request({
      method: 'POST',
      uri: API_URL + '/user_account',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: authorized,
    }, (err, response, body) => {
      if (err) {
        res.sendStatus(400)
      } else {
        console.log(body, typeof body);
        res.send(body);
      }
    }).catch((err) => {
      res.status(401).send('something went wrong!');
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
