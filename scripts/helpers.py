"""Helper functions"""

import glob
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
