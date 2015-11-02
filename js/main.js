"use strict";

var REPO_USER = "art-dot-git";

var REPO = "80x40";

var FILE = "README";

var GITHUB = "https://github.com/";
var GITHUB_RAW = "https://raw.githubusercontent.com/";
var GITHUB_API = "https://api.github.com/";


// State
var blockHistory = [];
var blockCache = {};
var currentIndex = 0;

var splitTextBlock = function(text) {
    var lines = text.split('\n');
    // Get rid of trailing newline
    if (lines.length > 0 && lines[lines.length - 1] === '')
        return lines.slice(0, -1);
    return lines;
};

var updateTextBlock = function(block) {
    $('#text-block').empty().append(block.map(function(x) {
        return $('<span></span>').text(x).append('<br/>');
    }));
};

var getTextBlock = function(revision, f) {
    var url = GITHUB_RAW + REPO_USER + '/' + REPO + '/' + revision +'/' + FILE;
    return $.get(url, f)
};

var getblockHistory = function(f) {
    var url = GITHUB_API + 'repos/' + REPO_USER + '/' + REPO + '/commits' + "?path=" + FILE;
    return $.get(url, f)
};

var onblockHistoryChange = function(sha, index) {
    var url = GITHUB + REPO_USER + '/' + REPO + '/commit/' + sha;
    $('#current-label').text(sha).attr('href', url);
    $('#forward-button').prop('disabled', index === 0);
    $('#backward-button').prop('disabled', index === (blockHistory.length - 1));
    $('#latest-button').prop('disabled', index === 0);
};

var viewblockHistory = function(index) {
    var item = blockHistory[index];
    if (!item)
        return;
    
    var sha = item.sha;
    var current = blockCache[sha];
    var label = sha;
    if (current) {
        currentIndex = index;
        updateTextBlock(current);
        onblockHistoryChange(label, index);
    } else {
        getTextBlock(sha, function(text) {
            currentIndex = index;
            var block = splitTextBlock(text);
            blockCache[sha] = block;
            updateTextBlock(block);
            onblockHistoryChange(label, index);
        });
    }
};

$(function() {
    getblockHistory(function(data) {
        blockHistory = data;
        viewblockHistory(0);
    });
    
    $('#latest-button').click(function() {
        viewblockHistory(0);
    });
    
    $('#forward-button').click(function() {
        viewblockHistory(currentIndex - 1);
    });
    
    $('#backward-button').click(function() {
        viewblockHistory(currentIndex + 1);
    });
});
