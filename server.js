/**
    Webhook listener.
*/
"use strict";
const GitHubApi = require("github");
const program = require("commander");
const http = require('http');
const main = require('./pull_request');
const config = require('./config');

const github = new GitHubApi({
	version: "3.0.0",
	headers: {
	    "user-agent": "80x40-client"
	}
});

program
    .version('0.0.0')
    .option('--token <token>', 'Github user token')
    .option('--secret <secret>', 'Github hook secret')
    .parse(process.argv);

github.authenticate({
    type: "oauth",
    token: program.token
});

const webhookHandler = require('github-webhook-handler')({
    path: '/',
    secret: program.secret
});

webhookHandler.on('pull_request', (event) => {
    const action = event.payload.action;
    if (action !== 'opened' || action !== 'synchronize') {
        console.log('ignoring action', action);
        return;
    }
	main.handlePullRequest(github, conf.user, conf.repo, event.payload.number,
	    (err) => {
            if (err) {
                console.error(err);
            } else {
                console.log("OK");
            }
        });
});

http.createServer(function (req, res) {
    webhookHandler(req, res, (err) => {
        res.statusCode = 404
        res.end('');
    });
}).listen(3000);
