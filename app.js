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
            console.log(req.body.event.user)
            console.log(req.body.event.item)
            getMessage().then(res => {
                console.log(res)
            })
        }
        res.status(200).end()

    }
    else {
        res.status(200).end()
    }
})


async function getMessage() {
    try {
        let res = await axios({
             url: `https://slack.com/api/conversations.list`,
             method: 'get',
             headers: {
                 'Content-Type': 'application/json',
                 'Authorization': process.env.slack_token
             },
             data: {
                "channel": 'C03CHEJAQ3Y',
                "latest": '1657556477.035489',
                "limit": 1,
                "inclusive": true
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