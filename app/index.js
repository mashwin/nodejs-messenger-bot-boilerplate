'use strict';

const request = require('request');
const crypto = require('crypto');

class FbApi {

    constructor({ PAGE_ACCESS_TOKEN, VERIFY_TOKEN, APP_SECRET }) {
        this.PAGE_ACCESS_TOKEN = PAGE_ACCESS_TOKEN;
        this.VERIFY_TOKEN = VERIFY_TOKEN;
        this.APP_SECRET = APP_SECRET;
    }

    registerWebhook(req, res) {

        const params = req.query;
        const mode = params['hub.mode'];
        const verify_token = params['hub.verify_token'];
        const challenge = params['hub.challenge'];

        if (mode === 'subscribe' && verify_token === this.VERIFY_TOKEN) {
            return res.end(challenge);
        } else {
            console.log("Could not register webhook!");
            return res.status(403).end();
        }

    }

    verifySignature(req, res, next) {
        if (req.method === 'POST') {
            let signature = req.headers['x-hub-signature'];
            try {
                if (!signature) {
                    throw new Error("Signature missing!");
                } else {
                    let hash = crypto.createHmac('sha1', this.APP_SECRET).update(JSON.stringify(req.body)).digest('hex');
                    if (hash !== signature.split("=")[1]) {
                        throw new Error("Invalid signature");
                    }
                }
            } catch (e) {
                res.send(500, e);
            }
        }

        return next();
    }

    extractMessage(req) {

        let data = req.body;
        let messageObj;
        if (data.object === 'page') {

            // Iterate through the page entry Array
            data.entry.forEach(pageObj => {

                // Iterate through the messaging Array
                pageObj.messaging.forEach(msgEvent => {
                    messageObj = {
                        sender: msgEvent.sender.id,
                        timeOfMessage: msgEvent.timestamp,
                        message: msgEvent.message
                    }
                });
            });
        }

        return messageObj;
    }


    // incoming(req, res, cb) {
    //     // Extract the body of the POST request
    //     let data = req.body;

    //     if (data.object === 'page') {
    //         // Iterate through the page entry Array
    //         data.entry.forEach(pageObj => {
    //             // Iterate through the messaging Array
    //             pageObj.messaging.forEach(msgEvent => {
    //                 let messageObj = {
    //                     sender: msgEvent.sender.id,
    //                     timeOfMessage: msgEvent.timestamp,
    //                     message: msgEvent.message
    //                 }
    //                 cb(messageObj);
    //             });
    //         });
    //     }
    //     res.status(200).send();
    // }

    sendMessage(payload) {
        return new Promise((resolve, reject) => {
            // Create an HTTP POST request
            request({
                uri: 'https://graph.facebook.com/v2.6/me/messages',
                qs: {
                    access_token: this.PAGE_ACCESS_TOKEN
                },
                method: 'POST',
                json: payload
            }, (error, response, body) => {
                if (!error && response.statusCode === 200) {
                    resolve({
                        messageId: body.message_id
                    });
                } else {
                    reject(error);
                }
            });
        });
    }

    prepTextData(id, text, messaging_type = 'RESPONSE') {

        let obj = {
            messaging_type,
            recipient: {
                id
            },
            message: {
                text
            }
        }

        return obj;
    }

}

module.exports = FbApi;