"""Helper functions"""

import glob
import io
import json
import os

import cv2
import numpy as np
from PIL import Image
from potrace import Bitmap
import pytesseract
import requests


def clear_directory(dirname):
    """Function for emptying a directory"""
    dirname = dirname.strip("/")
    file_string = f"{dirname}/*"
    filenames = glob.glob(file_string)
    for fn in filenames:
        if os.path.isfile(fn):
            os.remove(fn)


def add_confidences(chars, words):
    """
    Given characters with bounding boxes, match it with their words' confidences
    """
    for i, char in enumerate(chars):
        confidence = -1
        # First check if the char is contained in a word
        word_matches = [
            word
            for word in words
            if rect_contains(word[2:], char[1:]) and char[0] in word[0]
        ]
        if len(word_matches) > 0:
            confidence = word_matches[0][1]
        # Otherwise, check for the largest overlap
        else:
            word_matches = [
                (word, rect_intersection_area(word[2:], char[1:]))
                for word in words
                if rect_intersection_area(word[2:], char[1:]) > 0 and char[0] in word[0]
            ]
            if len(word_matches) > 0:
                word_matches = sorted(word_matches, key=lambda m: -m[1])
                confidence = word_matches[0][0][1]

        chars[i] = char + tuple([confidence])

    return chars


def extract_letters(im, letters, tesseract_cmd, conf=90):
    """
    Given an image and a list of letters, extract those letters from the image
    """

    pytesseract.pytesseract.tesseract_cmd = tesseract_cmd

    w, h = im.size
    ocr_data = pytesseract.image_to_data(im, output_type="data.frame")
    ocr_data = ocr_data[ocr_data["text"].notnull()]
    ocr_data = ocr_data[ocr_data["conf"] > 0]
    ocr_data = ocr_data.to_dict("records")
    words = [
        (
            d["text"],
            d["conf"],
            d["left"],
            d["top"],
            d["left"] + d["width"],
            d["top"] + d["height"],
        )
        for d in ocr_data
    ]
    # we need to use the legacy engine to get bounding boxes bc the newer one does not do bounding boxes well
    ocr_chars = pytesseract.image_to_boxes(im, config="--oem 0")
    char_data = [tuple(line.split(" ")) for line in ocr_chars.splitlines()]
    chars = [
        (char, int(x0), h - int(y1), int(x1), h - int(y0))
        for char, x0, y0, x1, y1, _ in char_data
        if char in letters
    ]
    chars = add_confidences(chars, words)
    chars = [c for c in chars if c[-1] >= conf]

    return (words, chars)


def get_image_from_url(url):
    """
    Download and open an image from a URL to
    """
    # Download the image to memory
    response = requests.get(url, timeout=60)
    image_filestream = io.BytesIO(response.content)

    # And read the image data
    im = Image.open(image_filestream)

    return im


def get_largest_mask_segment(im):
    """Function to return the image with only the largest segment of the image"""

    np_im = np.array(im.convert("RGB"))
    cv_im = cv2.cvtColor(np_im, cv2.COLOR_RGB2GRAY)
    inv_im = cv2.bitwise_not(cv_im)

    # threshold
    _, thresh = cv2.threshold(inv_im, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)

    # Try to get the largest segment
    nb_components, output, stats, _centroids = cv2.connectedComponentsWithStats(
        thresh, connectivity=4
    )
    sizes = stats[:, -1]
    max_label = 1
    max_size = sizes[1]
    for i in range(1, nb_components):
        if sizes[i] > max_size:
            max_label = i
            max_size = sizes[i]
    im_with_largest_segment = np.zeros(output.shape)
    im_with_largest_segment[output != max_label] = 255
    im_with_largest_segment = Image.fromarray(im_with_largest_segment)

    return im_with_largest_segment


def image_to_svg(im, blacklevel=0.5, turdsize=5):
    """
    Given a PIL image, generate SVG code
    """
    w, h = im.size
    bm = Bitmap(im, blacklevel=blacklevel)
    plist = bm.trace(
        turdsize=turdsize,
        turnpolicy=4,
        alphamax=1,
        opticurve=True,
        opttolerance=0.2,
    )

    parts = []
    for curve in plist:
        fs = curve.start_point
        parts.append(f"M{fs.x},{fs.y}")
        for segment in curve.segments:
            if segment.is_corner:
                a = segment.c
                b = segment.end_point
                parts.append(f"L{a.x},{a.y}L{b.x},{b.y}")
            else:
                a = segment.c1
                b = segment.c2
                c = segment.end_point
                parts.append(f"C{a.x},{a.y} {b.x},{b.y} {c.x},{c.y}")
        parts.append("z")
    svg = f'<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="{w}" height="{h}" viewBox="0 0 {w} {h}">'
    svg += (
        f'<path stroke="none" fill="black" fill-rule="evenodd" d="{"".join(parts)}"/>'
    )
    svg += "</svg>"

    return svg


def make_directories(filenames):
    """Function for creating directories if they do not exist."""
    if not isinstance(filenames, list):
        filenames = [filenames]
    for filename in filenames:
        dirname = os.path.dirname(filename)
        if not os.path.exists(dirname):
            os.makedirs(dirname)


def rect_contains(rect_outer, rect_inner):
    """
    Given two rectangles, return if the first contains the second
    """
    o_x1, o_y1, o_x2, o_y2 = rect_outer
    i_x1, i_y1, i_x2, i_y2 = rect_inner
    return o_x1 <= i_x1 < i_x2 <= o_x2 and o_y1 <= i_y1 < i_y2 <= o_y2


def rect_intersection_area(rect_a, rect_b):
    """
    Given two rectangles, return their area of intersection
    Return 0 if they do not intersect
    """
    a_x1, a_y1, a_x2, a_y2 = rect_a
    b_x1, b_y1, b_x2, b_y2 = rect_b
    dx = min(a_x2, b_x2) - max(a_x1, b_x1)
    dy = min(a_y2, b_y2) - max(a_y1, b_y1)
    if (dx >= 0) and (dy >= 0):
        return dx * dy
    return 0


def write_json(filename, data, pretty=False):
    """Function to write JSON data to file"""
    with open(filename, "w", encoding="utf8") as f:
        if pretty:
            json.dump(data, f, indent=4)
        else:
            json.dump(data, f)
