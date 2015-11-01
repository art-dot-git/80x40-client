"use strict";
const GitHubApi = require("github");
const program = require("commander")
const escapeRegexp = require('escape-string-regexp');
const express = require('express');


const config = require('./config');
const pathToRepo = require("path").resolve(config.local_repository);

const simpleGit = require('simple-git')(pathToRepo);

const github = new GitHubApi({
	version: "3.0.0",
	headers: {
	    "user-agent": "80x40-client"
	}
});

/// Should error attempt to post error comments back to github.
const POST_COMMENTS = false;

const LINE_REGEXP = new RegExp('^[' + escapeRegexp(config.allowed_chars) +']{' + config.expected_width + '}$');

/**
    Validate that a block of text is correctly formatted.  
*/
const isBlockGood = block =>
    block.length === config.expected_height && block.every(line =>
        line.match(LINE_REGEXP));

const isTextBlockGood = text => {
    let lines = text.split('\n');
    // get rid of trailing newline
    if (lines.length > 0 && lines[lines.length - 1] === '')
        lines = lines.slice(0, -1);
    return isBlockGood(lines);
}

/**
    Handle pull request merge error.
*/
const onMergeError = (pullRequest, err, f) => {
    if (POST_COMMENTS) {
        github.issues.createComment({
            user: config.user,
            repo: config.repo,
            number: pullRequest.number,
            body: "**AUTO MERGE ERROR**\nPlease try correcting the error below and updating the pull request.\n---------------------\n\n" + err,
            }, f);
    }
    f && f(err);
}

/**
*/
const deleteBranch = (name, f) =>
    simpleGit._run(['branch', '-D', name], f);

/**
*/
const verifyBranchMerge = (instance, branchName, f) =>
    instance._run(['diff', '--name-only', branchName], function(err, data) {
        if (err) return f(err);
        
        const files = data.trim();
        if (files !== config.file_name && files.length !== 0) {
            return f("Invalid file change.", null);
        }
        simpleGit.show([branchName + ':' + config.file_name], (err, data) => {
            if (isTextBlockGood(data)) {
                return f(null)
            } else {
                return f("Block is not valid");
            }
        });
    });

const processRequest = (request, f) => {
    const otherCloneUrl = request.head.repo.clone_url;
    const otherBranch = request.head.ref;    
    const sha = request.head.sha;
    const branchName = 'auto-branch+' + sha;
    
    console.log('Processing ' + sha);
    
    return verifyBranchMerge(
        simpleGit.checkoutLocalBranch(branchName)
            .pull(otherCloneUrl, otherBranch)
            .checkout('master'),
        branchName,
        function(err, data) {
            if (err) {
                return deleteBranch(branchName, _ => f(err));
            }
            
            return simpleGit._run(['merge', '-m "Automerge: ' + sha + '"', 'master', branchName], function(err, data) {
            
            return deleteBranch(branchName, _ => {
                if (err) {
                    return f(err);
                }
                return simpleGit.push('origin', 'master', f)
            });
        });
    });
};

/**
    Process a set of pull requests in order.
*/
const processRequests = (requests, f) => {
    requests.forEach(request =>
        processRequest(request, (err, data) => {
            if (err) {
                return onMergeError(request, err, f);
            } else {
                return f(err, data);
            }
        }));
};


const processAllPullRequests = repo => {
    github.pullRequests.getAll({
        user: config.user,
        repo: config.repo,
        sort: 'updated',
        direction: 'desc'
    }, function(err, response) {
        if (err)
            console.error(err);
        processRequests(response, (err) => {
            if (err) {
               console.error(err);
            } else {
                console.log('OK')
            }
        });
    });
};

process.chdir(pathToRepo);

program
    .version('0.0.0')
    .option('--token <token>', 'Github user token')
    .option('--secret <secret>', 'Github hook secret')
    .parse(process.argv);



github.authenticate({
    type: "oauth",
    token: program.token
});

processAllPullRequests();

var app = express();
app.get('/80x40-client', (req, res) => {
    console.log(req);
    res.send('');
});

var server = app.listen(3000, function () {
    var host = server.address().address;
    var port = server.address().port;

    console.log('Example app listening at http://%s:%s', host, port);
});