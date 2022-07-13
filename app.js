const axios = require('axios');
const express = require("express")
const bodyParser = require("body-parser");
const app = express()
const PORT = process.env.PORT || 3000;
require('dotenv').config();
app.use(bodyParser.json())
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`))

//webhook listener and validator
app.post("/hook", (req, res) => {
    if (req.body.challenge) {
        let ChallengeId = req.body.challenge
        res.status(200).send(
            {
                'challenge': ChallengeId
            }
        )
    }
    else if (req.body.event) {
        if (req.body.event.reaction === 'white_check_mark') {
            let channelId = req.body.event.item.channel
            let messageId = req.body.event.item.ts
            let tsEmail
            let userEmail

            // get Email for TS member who applied emoji
            getUser(req.body.event.user).then(getTsUserRes => {
                console.log(getTsUserRes)
                tsEmail = getTsUserRes.user.profile.email
            })

            // get more info about the message the emoji was applied to
            getMessage(channelId, messageId).then(getMessageRes => {
                console.log(getMessageRes)
                // get Email for user who asked question
                getUser(getMessageRes.messages[0].user).then(getUserRes => {
                    userEmail = getUserRes.user.profile.email
                    // postTicket(tsEmail, userEmail)
                })

            })
        }
        res.status(200).end()

    }
    else {
        res.status(200).end()
    }
})

async function getMessage(channelId, messageId) {
    try {
        let res = await axios({
             url: `https://slack.com/api/conversations.history?channel=${channelId}&latest=${messageId}&limit=1&inclusive=true`,
             method: 'get',
             headers: {
                 'Content-Type': 'application/json',
                 'Authorization': "Bearer " + process.env.slack_token
             }
         })
         if(res.status == 200){
             console.log(res.status)
         }     
         return res.data
     }
     catch (err) {
         console.error(err);
     }
}

async function getUser(userId) {
    try {
        let res = await axios({
             url: `https://slack.com/api/users.info?user=${userId}`,
             method: 'get',
             headers: {
                 'Content-Type': 'application/json',
                 'Authorization': process.env.slack_token
             }
         })
         if(res.status == 200){
             console.log(res.status)
         }     
         return res.data
     }
     catch (err) {
         console.error(err);
     }
}

async function postTicket(tsEmail, userEmail) {
    try {
        let res = await axios({
             url: `https://clickup.zendesk.com/api/v2/tickets`,
             method: 'post',
             headers: {
                 'Content-Type': 'application/json',
                 'Authorization': "Bearer " + process.env.zendesk_token
             },
             data: {
                "ticket": {
                    "comment": {
                        "body": "The smoke is very colorful.",
                        "public": "false",
                    },
                    "priority": "normal",
                    "subject": "Product Questions - Internal",
                    "tags": ["no_csat"],
                    "status": "open",
                    "assignee_email": tsEmail,
                    "requester": userEmail,
                }
            }
         })
         if(res.status == 200){
             console.log(res.status)
         }     
         return res.data
     }
     catch (err) {
         console.error(err);
     }
}