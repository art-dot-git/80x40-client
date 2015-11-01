import os
import json

CONFIG_FILE = "config.json"

_cd = os.path.dirname(os.path.realpath(__file__))
_root = os.path.join(_cd, os.pardir)

data = None
with open(os.path.join(_root, CONFIG_FILE)) as f:    
    data = json.load(f)

# Number of characters in a lines.
EXPECTED_WIDTH = data['expected_width']

# Number of lines in the block
EXPECTED_HEIGHT = data['expected_height']

# Characters allowed in the block
ALLOWED_CHARS = data['allowed_chars']'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'

REPO_PATH = os.path.join(_root, data['local_repository'])

# Name of file containing block of text
FILE_NAME = data['file_name']

# Full path of file containing block of text
FILE = os.path.join(REPO_PATH, FILE_NAME)
