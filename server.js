/**
    Webhook listener.
*/
"use strict";
const GitHubApi = require("github");
const program = require("commander");
const http = require('http');
const main = require('./pull_request');
const seqqueue = require('seq-queue');

const config = require('./config');

// Pull request actions to process
const pullRequestActions = ['opened', 'synchronize'];

const taskQueue = seqqueue.createQueue(30000);

program
    .version('0.0.0')
    .option('--port <port>', 'Port to listen on.')

    .option('--token <token>', 'Github user token')
    .option('--secret <secret>', 'Github hook secret')
    .parse(process.argv);

const port = (program.port || 3000);

const github = new GitHubApi({
	version: "3.0.0",
	headers: {
	    "user-agent": "80x40-client"
	}
});

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
    if (pullRequestActions.indexOf(action) === -1) {
        console.log('ignoring action', action);
        return;
    }
    taskQueue.push((task) => {
        main.handlePullRequest(github, config.user, config.repo,
            event.payload.number,
            (err) => {
                if (err) {
                    console.error("ERROR", err);
                } else {
                    console.log("OK");
                }
                task.done();
            })
        },
        () => {
            console.error("Timeout");
        });
});

console.log("Listening for webhook events on port", port);
http.createServer(function (req, res) {
    webhookHandler(req, res, (err) => {
        res.statusCode = 404
        res.end('');
    });
}).listen(port);
