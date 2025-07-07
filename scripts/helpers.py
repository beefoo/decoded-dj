"""Helper functions"""

import glob
import json
import os


def clear_directory(dirname):
    """Function for emptying a directory"""
    dirname = dirname.strip("/")
    file_string = f"{dirname}/*"
    filenames = glob.glob(file_string)
    for fn in filenames:
        if os.path.isfile(fn):
            os.remove(fn)


def make_directories(filenames):
    """Function for creating directories if they do not exist."""
    if not isinstance(filenames, list):
        filenames = [filenames]
    for filename in filenames:
        dirname = os.path.dirname(filename)
        if not os.path.exists(dirname):
            os.makedirs(dirname)


def write_json(filename, data, pretty=False):
    """Function to write JSON data to file"""
    with open(filename, "w", encoding="utf8") as f:
        if pretty:
            json.dump(data, f, indent=4)
        else:
            json.dump(data, f)
