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

    // initial webhook validator. Only runs when setting up the webhook from Slack
    if (req.body.challenge) {
        let ChallengeId = req.body.challenge
        res.status(200).send(
            {
                'challenge': ChallengeId
            }
        )
    }

    // checking if webhook includes an event. Then, if the event is the application of the key emoji
    else if (req.body.event) {
        if (req.body.event.reaction === 'sr-tss-ticket-maker') {
            let channelId = req.body.event.item.channel
            let messageId = req.body.event.item.ts
            let messageIdURL = messageId.split('.').join("")
            let slackURL = `https://click-up.slack.com/archives/${channelId}/p${messageIdURL}`
            let tsEmail
            let userEmail

            // get Email for TS member who applied emoji
            getUser(req.body.event.user).then(getTsUserRes => {

                // List of Sr TSS emails. If adding or removing Sr TSS, do it here
                let emailList = ['pvatterott@clickup.com', 'gbarnes@clickup.com', 'ibuthelezi@clickup.com', 'mwester@clickup.com', 'mmontgomery@clickup.com', 'namaral@clickup.com', 'shaq@clickup.com', 'pvatt256@gmail.com']
                tsEmail = getTsUserRes.user.profile.email

                // checks if the user who set the emoji is a Sr. TSS
                if (emailList.includes(tsEmail)) {

                    // get more info about the message the emoji was applied to
                    getMessage(channelId, messageId).then(getMessageRes => {
                        console.log(getMessageRes)
                        console.log(getMessageRes.messages[0])
                        let textConversation = getMessageRes.messages[0].text

                        // get Email for user who asked question
                        getUser(getMessageRes.messages[0].user).then(getUserRes => {
                            userEmail = getUserRes.user.profile.email

                            // post ticket to Zendesk
                            postTicket(tsEmail, userEmail, textConversation, slackURL).then(postTicketRes => {
                                
                            })
                        })
                    })
                }
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
        if (res.status == 200) {
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
                'Authorization': "Bearer " + process.env.slack_token
            }
        })
        if (res.status == 200) {
            console.log(res.status)
        }
        return res.data
    }
    catch (err) {
        console.error(err);
    }
}

async function postTicket(tsEmail, userEmail, textConversation, slackURL) {
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
                        "body": textConversation + " " + slackURL,
                        "public": "false",
                    },
                    "priority": "normal",
                    "subject": "Sr TSS Slack - Internal",
                    "tags": ["no_csat"],
                    "status": "open",
                    "assignee_email": tsEmail,
                    "requester": userEmail,
                }
            }
        })
        if (res.status == 200) {
            console.log(res.status)
        }
        return res.data
    }
    catch (err) {
        console.error(err);
    }
}