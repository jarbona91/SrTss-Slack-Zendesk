const axios = require('axios');
const express = require("express")
const bodyParser = require("body-parser");
const app = express()
const PORT = process.env.PORT || 3000;
require('dotenv').config();
app.use(bodyParser.json())
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`))

// List of Sr TSS emails. If adding or removing Sr TSS, do it here
let emailList = ['pvatterott@clickup.com', 'gbarnes@clickup.com', 'ibuthelezi@clickup.com', 'mwester@clickup.com', 'mmontgomery@clickup.com', 'namaral@clickup.com', 'shaq@clickup.com', 'bhoover@clickup.com', 'rkendig@clickup.com', 'mhicks@clickup.com']

// List of all Slack Users. This is used when the Slack post is from a ZD ticket
let allSlackUsers = []


//webhook listener and validator for CU Slack Channel
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

    // checking if webhook includes an event. Then, if the event is the application of the designated emoji
    else if (req.body.event) {
        if (req.body.event.reaction === 'sr-tss-ticket-maker') {
            let channelId = req.body.event.item.channel
            let messageId = req.body.event.item.ts
            let messageIdURL = messageId.split('.').join("")
            let slackURL = `https://click-up.slack.com/archives/${channelId}/p${messageIdURL}`
            let tsEmail
            let userEmail
            let ticketTitle
            let ticketTags

            // if channel is Product Questions
            if (channelId === 'CVBJRC17B') {
                ticketTitle = 'Sr TSS Product Questions - Internal'
                ticketTags = ["no_csat"]
            }

            // if channel is Bugs
            else if (channelId === 'C4UCH54FJ') {
                ticketTitle = 'Sr TSS Bugs Channel - Internal'
                ticketTags = ["no_csat"]
            }

            // if channel is zeb-requests
            else if (channelId === 'C01P7E67TC2') {
                ticketTitle = 'Sr TSS Zeb Requests - Internal'
                ticketTags = ["no_csat"]
            }

            // if channel is ts-team
            else if (channelId === 'C015N6P6S9J') {
                ticketTitle = 'Sr TSS TS Team - Internal'
                ticketTags = ["no_csat"]
            }

            // for any other channel
            else {
                ticketTitle = 'Sr TSS Other - Internal'
                ticketTags = ["no_csat"]
            }

            // get Email for TS member who applied emoji
            getUser(req.body.event.user, process.env.slack_token).then(getTsUserRes => {
                tsEmail = getTsUserRes.user.profile.email

                // checks if the user who set the emoji is a Sr. TSS
                if (emailList.includes(tsEmail)) {

                    // get more info about the message the emoji was applied to
                    getMessage(channelId, messageId, process.env.slack_token).then(getMessageRes => {
                        let textConversation = "<b>REQUESTER</b> " + getMessageRes.messages[0].text + "<br></br>"
                        let notEditedTextConversation = getMessageRes.messages[0].text

                        // retrieving slack messages made by TS member who applied emoji. Then, adding that to the textConversation variable
                        getMessageThread(channelId, messageId, process.env.slack_token).then(threadedReplies => {
                            for (let p = 0; p < threadedReplies.messages.length; p++) {
                                if (threadedReplies.messages[p].user === req.body.event.user) {
                                    textConversation = textConversation + "<b>YOU</b> " + threadedReplies.messages[p].text + "<br></br>"
                                }
                            }

                            // if it's a zendesk post, we need to search through the text for the name of the person who posted it. Then, do list all users in the WS. After that, for loop through the list of all users to find the correct one. From there, pull email address and proceed as normal
                            // if no email address is found, it will recreate a new allSlackUser array to check if it's a new user. If that fails, it will create a ticket with Jake Bowen as requester
                            if (getMessageRes.messages[0].user === 'U02SJ2ZKA4W') {
                                let userName = notEditedTextConversation.substring(0, notEditedTextConversation.indexOf(':')); //get username which is all text before colon
                                let checker = false

                                // if allSlackUsers array is empty (should only occur during first run) then get all slack members
                                if (allSlackUsers.length === 0) {
                                    getAllSlackUsers().then(res => {
                                        // check if username found in zendesk text is found in allSlackUsers array. If not, create a ticket with Jake Bowen as requester
                                        let user = allSlackUsers.find(o => o.real_name === userName);
                                        if (user == null) {
                                            getUser(getMessageRes.messages[0].user, process.env.slack_token).then(getUserRes => {
                                                userEmail = getUserRes.user.profile.email
                                                postTicket(tsEmail, userEmail, textConversation, slackURL, ticketTitle, ticketTags).then(postTicketRes => {
                                                })
                                            })
                                        }
                                        else {
                                            let userEmail = user.profile.email
                                            postTicket(tsEmail, userEmail, textConversation, slackURL, ticketTitle, ticketTags).then(postTicketRes => {
                                            })
                                        }
                                    })
                                }

                                // if all users array is not empty
                                else {
                                    let user = allSlackUsers.find(o => o.real_name === userName);
                                    if (user == null) {
                                        // if not able to find a result, recreate the Slack users array. This is to account if there's a new user of the Slack WS. If that doesnt help, then set Jake Bowen as assignee
                                        getAllSlackUsers().then(getAllSlackUsersRes => {
                                            user = allSlackUsers.find(o => o.real_name === userName);
                                            if (user == null) {
                                                getUser(getMessageRes.messages[0].user, process.env.slack_token).then(getUserRes => {
                                                    userEmail = getUserRes.user.profile.email
                                                    // post ticket to Zendesk
                                                    postTicket(tsEmail, userEmail, textConversation, slackURL, ticketTitle, ticketTags).then(postTicketRes => {
                                                    })
                                                })
                                            }
                                            else {
                                                let userEmail = user.profile.email
                                                postTicket(tsEmail, userEmail, textConversation, slackURL, ticketTitle, ticketTags).then(postTicketRes => {
                                                })
                                            }
                                        })

                                    }
                                    else {
                                        let userEmail = user.profile.email
                                        postTicket(tsEmail, userEmail, textConversation, slackURL, ticketTitle, ticketTags).then(postTicketRes => {
                                        })
                                    }
                                }
                            }

                            // if post is not a zendesk side convo
                            else {
                                // get Email for user who asked question
                                getUser(getMessageRes.messages[0].user, process.env.slack_token).then(getUserRes => {
                                    userEmail = getUserRes.user.profile.email

                                    // post ticket to Zendesk
                                    postTicket(tsEmail, userEmail, textConversation, slackURL, ticketTitle, ticketTags).then(postTicketRes => {

                                    })
                                })
                            }
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


// Flow for the CU Combine
app.post("/combinehook", (req, res) => {

    // initial webhook validator. Only runs when setting up the webhook from Slack
    if (req.body.challenge) {
        let ChallengeId = req.body.challenge
        res.status(200).send(
            {
                'challenge': ChallengeId
            }
        )
    }

    // checking if webhook includes an event. Then, if the event is the application of the designated emoji
    else if (req.body.event) {
        if (req.body.event.reaction === 'white_check_mark') {
            let channelId = req.body.event.item.channel
            let messageId = req.body.event.item.ts
            let messageIdURL = messageId.split('.').join("")
            let slackURL = `https://clickupcombine.slack.com/archives/${channelId}/p${messageIdURL}`
            let tsEmail
            let userEmail
            let ticketTitle = "Sr TSS Combine Channel"
            let ticketTags = ["no_csat"]

            // get Email for TS member who applied emoji
            getUser(req.body.event.user, process.env.combine_slack_token).then(getTsUserRes => {
                tsEmail = getTsUserRes.user.profile.email

                // checks if the user who set the emoji is a Sr. TSS
                if (emailList.includes(tsEmail)) {

                    // get more info about the message the emoji was applied to
                    getMessage(channelId, messageId, process.env.combine_slack_token).then(getMessageRes => {
                        let textConversation = "<b>REQUESTER</b> " + getMessageRes.messages[0].text + "<br></br>"

                        // retrieving slack messages made by TS member who applied emoji. Then, adding that to the textConversation variable
                        getMessageThread(channelId, messageId, process.env.combine_slack_token).then(threadedReplies => {
                            for (let p = 0; p < threadedReplies.messages.length; p++) {
                                if (threadedReplies.messages[p].user === req.body.event.user) {
                                    textConversation = textConversation + "<b>YOU</b> " + threadedReplies.messages[p].text + "<br></br>"
                                }
                            }
                        
                            // get Email for user who asked question
                            getUser(getMessageRes.messages[0].user, process.env.combine_slack_token).then(getUserRes => {
                                userEmail = getUserRes.user.profile.email

                                // post ticket to Zendesk
                                postTicket(tsEmail, userEmail, textConversation, slackURL, ticketTitle, ticketTags).then(postTicketRes => {

                                })
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

async function getAllSlackUsers() {
    let getFirstUsers = await getAllUsers("")
    allSlackUsers = allSlackUsers.concat(getFirstUsers.members)
    // each next page code includes an equal sign and you must change it to regex. Stupid tbh
    let nextPage = getFirstUsers.response_metadata.next_cursor.replace(/\=/g, "%3D")
    let pagination = "&cursor=" + nextPage
    while (pagination != "") {
        let getMoreUsers = await getAllUsers(pagination)
        allSlackUsers = allSlackUsers.concat(getMoreUsers.members)
        if (getMoreUsers.response_metadata.next_cursor === "") {
            pagination = ""
            console.log('success')
        }
        else {
            nextPage = getMoreUsers.response_metadata.next_cursor.replace(/\=/g, "%3D")
            pagination = "&cursor=" + nextPage
        }
    }
}


async function getMessage(channelId, messageId, token) {
    try {
        let res = await axios({
            url: `https://slack.com/api/conversations.history?channel=${channelId}&latest=${messageId}&limit=1&inclusive=true`,
            method: 'get',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': "Bearer " + token
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

async function getMessageThread(channelId, messageId, token) {
    try {
        let res = await axios({
            url: `https://slack.com/api/conversations.replies?channel=${channelId}&ts=${messageId}`,
            method: 'get',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': "Bearer " + token
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

async function getUser(userId, token) {
    try {
        let res = await axios({
            url: `https://slack.com/api/users.info?user=${userId}`,
            method: 'get',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': "Bearer " + token
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

async function getAllUsers(pagination) {
    try {
        let res = await axios({
            url: `https://slack.com/api/users.list?limit=200${pagination}`,
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

async function postTicket(tsEmail, userEmail, textConversation, slackURL, ticketTitle, ticketTags) {
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
                        "html_body": textConversation + " " + slackURL,
                        "public": "false",
                    },
                    "priority": "normal",
                    "subject": ticketTitle,
                    "tags": ticketTags,
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