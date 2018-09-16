'use strict';

const express = require('express');
const app = express();
const bodyParser = require('body-parser');

const PORT = process.env.PORT || 8888;

const config = require('./config').FB;
const FbApi = require('./app');
const fbApi = new FbApi(config);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', (req, res, next) => {
    fbApi.registerWebhook(req, res);
    next();
})

app.use('/', (req, res, next) => fbApi.verifySignature(req, res, next));

app.post('/', (req, res, next) => {

    // send status code 200 back to facebook
    res.status(200).send();

    // retrieve message and sender information
    const { message, sender } = fbApi.extractMessage(req);

    // prepare text data to send
    const payload = fbApi.prepTextData(sender, `You said ${message.text}`);

    // call to send data
    fbApi.sendMessage(payload).then((response) => {
        console.log(response);
    });

    return next();
});

app.listen(PORT, () => {
    console.log(`Movie Bot listening on the ${PORT}`);
});