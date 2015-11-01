/**
    Simple command line pull request processor 
*/
"use strict";
const GitHubApi = require("github");
const program = require("commander");
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
    .option('--number <number>', 'Pull request to process')
    .option('--token <token>', 'Github user token')
    .parse(process.argv);

github.authenticate({
    type: "oauth",
    token: program.token
});

if (program.number) {
    main.handlePullRequest(github, config.user, config.repo, program.number,
        (err) => {
            if (err) {
                console.error(err);
            } else {
                console.log("OK");
            }
        });
    return;
}

main.handlePullRequests(github, config.user, config.repo, (err) => {
    if (err) {
        console.error(err);
    } else {
        console.log("OK");
    }
});
