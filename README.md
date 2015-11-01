# 80x40 Client

Simple scripts used to automatically update [80x40](https://github.com/git-dot-art/80x40).

## Components

### Node command line
Simple tool for manually merging individual pull requests.

```sh
$ npm install
$ node index.js \
    --token=YOUR_GITHUB_OAUTH_TOKEN \
    --number=PULL_REQUEST_TO_MERGE
```

### Node Github Webhook Listener
Simple node webserver that listens for Github webhook pull request events and updates the repo whenever a pull request is created or updated.

```sh
$ npm install
$ node server.js \
    --port=3000 \
    --token=YOUR_GITHUB_OAUTH_TOKEN \
    --secret=YOUR_WEBHOOK_SECRET
```

### 80x40 Merger - `merger/merger`
Git merge driver for blocks of text. Written in Python3.

To set this up, in the target 80x40 repo edit the `.git/config` file and add following lines:

```sh
[merge "80x40"]
    name = Custom merge driver for 80x40 blocks of text.
    driver = PATH_TO_80x40_CLIENT_REPO/merger/merger %O %A %B %L
```

## Setting up 80x40
Configuration options are stored in in `config.json`.

For most cases, just change `local_repository` to point at where 80x40 is stored on your local computer. `user` and `repo` can also be changed to target a different repository on Github.

