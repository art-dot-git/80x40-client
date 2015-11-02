"use strict";
const program = require("commander");
const escapeRegexp = require('escape-string-regexp');

const config = require('./config');
const pathToRepo = require("path").resolve(config.local_repository);

const simpleGit = require('simple-git')(pathToRepo);

/// Should error attempt to post error comments back to github.
const POST_COMMENTS = true;

const LINE_REGEXP = new RegExp('^[' + escapeRegexp(config.allowed_chars) +']{' + config.expected_width + '}$');

const REPO_URL = `https://github.com/${config.user}/${config.repo}`;

/**
    Validate that a block of text is correctly formatted.  
*/
const isBlockGood = (block) =>
    block.length === config.expected_height && block.every(line =>
        line.match(LINE_REGEXP));

const isTextBlockGood = (text) => {
    let lines = text.split('\n');
    // Get rid of trailing newline
    if (lines.length > 0 && lines[lines.length - 1] === '')
        lines = lines.slice(0, -1);
    return isBlockGood(lines);
};

/**
    Handle pull request merge error.
*/
const onMergeError = (github, pullRequest, err, f) => {
    if (POST_COMMENTS) {
        return github.issues.createComment({
            user: config.user,
            repo: config.repo,
            number: pullRequest.number,
            body: `**AUTO MERGE ERROR**\nPlease try correcting the error below and updating the pull request\n\nIf this appears to be a system issue, [please open a bug](${REPO_URL}/issues).\n\n---------------------\n\n${err}`,
            }, f);
    } else {
        f(err);
    }
};

/**
*/
const deleteBranch = (name, k) =>
    simpleGit._run(['branch', '-D', name], k);

/**
*/
const verifyBranchMerge = (instance, branchName, f) =>
    instance._run(['diff', '--name-only', branchName], function(err, data) {
        if (err) return f(err);
        
        const files = data.trim();
        if (files !== config.file_name && files.length !== 0) {
            return f("Change must only touch README. [See guidelines](https://github.com/art-dot-git/80x40/blob/master/about.md)", null);
        }
        simpleGit.show([branchName + ':' + config.file_name], (err, data) => {
            if (isTextBlockGood(data)) {
                return f(null)
            } else {
                return f("Text block is invalid. [See guidelines](https://github.com/art-dot-git/80x40/blob/master/about.md)");
            }
        });
    });

/**
*/
const tryMergePullRequest = (request, f) => {
    const otherCloneUrl = request.head.repo.clone_url;
    const otherBranch = request.head.ref;    
    const sha = request.head.sha;
    const branchName = 'auto-branch+' + sha;
    
    console.log('Processing ' + sha);
    
    if (!otherBranch.match(/[a-z0-9\-_]/i)) {
        return f("Invalid branch name");
    }
    
    return verifyBranchMerge(
        simpleGit
            .checkoutLocalBranch(branchName)
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
    Process a single pull request
*/
const processPullRequest = (github, request, k) =>
    tryMergePullRequest(request, (err, data) => {
        if (err)
            return onMergeError(github, request, err, _ => k(err));
        return k(null);
    });

/**
    Process a set of pull requests in order.
*/
const processPullRequests = (github, requests, k) => {
    if (requests.length === 0)
        return k(null);
    
    processPullRequest(github, requests[0], (err, data) => {
        const rest = requests.slice(1);
        return processRequests(github, rest, err ? _ => k(err) : k);
    });
};

/**
    Attempt to handle all pull requests in a repo in order.
*/
const handleAllPullRequests = (github, user, repo, k) =>
    github.pullRequests.getAll({
        user: user,
        repo: repo,
        sort: 'updated',
        direction: 'desc'
    }, function(err, response) {
        if (err)
            return k(err);
        return processPullRequests(github, response, k);
    });

/**
    Attempt to handle a single pull request.
*/
const handlePullRequest = (github, user, repo, number, k) =>
    github.pullRequests.get({
        user: user,
        repo: repo,
        number: number
    }, (err, pullRequest) => {
        if (err)
            return k(err);
        return processPullRequest(github, pullRequest, k);
    });


module.exports = {
    handleAllPullRequests: handleAllPullRequests,
    
    handlePullRequest: handlePullRequest
};
