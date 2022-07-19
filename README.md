# Sr TSS Slack to Zendesk

### This app automatically creates a ticket in Zendesk when a specific emoji is applied to a conversation by any Sr TSS.


This app is deployed on Heroku.


---


## Built With

- [NodeJS](https://nodejs.dev/)
- [ExpressJS](https://expressjs.com/)
- [Axios](https://axios-http.com/)

# Starting the app locally

Start by installing dependencies. While in this directory, run the following command:

```
npm install
```

This should install node modules within the server and the client folder.

After both installations complete, run the following command in your terminal:

```
node app.js
```

Your app should now be running on <http://localhost:3000>.

# Running on Heroku

Once you have an application created on Heroku, sync it with your Github repo and deploy.

You will need to add the Slack and Zendesk access tokens. To do this, go to settings then click on Reveal Config Vars.

There, you need to add two variables. The key for the Slack token is:
```
slack_token
```
See below in the 'Setting up the Slack App' section for more information on how to get this.

The key for the Zendesk token is:
```
zendesk_token
```
Make sure to save! You should then redeploy the application to make sure everything is up to date.

# Setting up the Slack App

For this to work, a Slack App needs to be created.

One part of the App is to subscribe to the reaction_added event. The Request URL would be the following:
```
https://{your_heroku_app}.herokuapp.com/hook
```

You will also need the User OAuth Token for the App which is the one that starts with ```xoxp-```

Lastly, you need the App to have the following User Token Scopes:
```
channels:history
reactions:read
users:read
users:read:email
```

# Adding or Removing Sr TSS members

In app.js, look for the emailList variable. It should be an array. There, you can add or remove Sr. TSS Emails.


---

## License

MIT License

Copyright (c) 2022 Paul Vatterott

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

---
## Author

### Paul Vatterott

[Github](https://github.com/pfvatterott) <br>
Email: pfvatterott@gmail.com
