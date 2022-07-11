const axios = require('axios');
const express = require("express")
const bodyParser = require("body-parser");
const app = express()
const PORT = process.env.PORT || 3000;
require('dotenv').config();
app.use(bodyParser.json())
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`))

//webhook listener and validator
app.get("/hook", (req, res) => {
    if (req.query[challenge]) {
        console.log(req)
        let ChallengeId = req.query.challenge
        res.status(200).send(
            {
                'challenge': ChallengeId
            }
        )
    }
    else {
        res.status(200).end()
    }
})