"""Script for extracting pages from PDF as image and text data"""

import argparse
import os
from pprint import pprint
import pymupdf
from tqdm import tqdm

from helpers import *

parser = argparse.ArgumentParser()
parser.add_argument(
    "-in",
    "--input",
    default="data/theatrum_chemicum_britannicum_15004720.pdf",
    help="Path to PDF file",
)
parser.add_argument(
    "-pp",
    "--pages",
    default="426-436",
    help="A range, a list, or a list of ranges, e.g. 4,6-10,20,25-40; 'all' for all pages",
)
parser.add_argument(
    "-m",
    "--match",
    default="a,b,c,d,e,f,g,A,B,C,D,E,F,G",
    help="A list of characters to match",
)
parser.add_argument(
    "-tess",
    "--tessdata",
    default="C:/Program Files/Tesseract-OCR/tessdata",
    help="Location of tesseract for OCR",
)
parser.add_argument(
    "-dpi",
    "--dpi",
    default=150,
    type=int,
    help="Resolution of image",
)
parser.add_argument(
    "-out",
    "--outputdir",
    default="public/data/theatrum_chemicum_britannicum_15004720/",
    help="Path to output directory",
)
parser.add_argument(
    "-c",
    "--clean",
    action="store_true",
    help="Clear the output directory before running",
)


def extract_image(page, page_number, args):
    """Output page as an image"""
    image_filename = f"{args.outputdir}{page_number}.jpg"
    if os.path.isfile(image_filename):
        return

    pix = page.get_pixmap(dpi=args.dpi)  # render page to an image
    pix.save(image_filename)


def extract_text(page, page_number, args):
    """Perform OCR on a page and output char list"""
    data_filename = f"{args.outputdir}{page_number}.json"
    if os.path.isfile(data_filename):
        return

    # Extract text via OCR (Tesseract)
    tp = page.get_textpage_ocr(tessdata=args.tessdata)
    data = tp.extractRAWDICT()
    w, h = (data["width"], data["height"])
    match_chars = set([char.strip() for char in args.match.split(",")])

    # Retrieve just the chars we need
    chars = []
    for block in data["blocks"]:
        for line in block["lines"]:
            for span in line["spans"]:
                for char in span["chars"]:
                    if char["c"] in match_chars:
                        chars.append({"c": char["c"], "bbox": char["bbox"]})
    # print(" ".join([char["c"] for char in chars]))
    # break

    # Write data to file
    page_data = {"width": w, "height": h, "chars": chars}
    write_json(data_filename, page_data)


def main(args):
    # Create output directories
    make_directories(args.outputdir)

    # Clear output directory if desired
    if args.clean:
        clear_directory(args.outputdir)

    # Read PDF
    doc = pymupdf.open(args.input)
    print(f"Opened {args.input} with {doc.page_count} pages")

    # parse pages
    pages = []

    if args.pages == "all":
        pages = range(1, doc.page_count + 1)

    else:
        parts = [part.strip().split("-") for part in args.pages.split(",")]
        for range_string in parts:
            if len(range_string) == 1:
                pages.append(int(range_string[0]))
            elif len(range_string) == 2:
                start, end = tuple(range_string)
                for page in range(int(start), int(end) + 1):
                    pages.append(page)

    page_count = len(pages)
    pbar = tqdm(total=page_count)
    pages = set(pages)
    for i, page in enumerate(doc):  # iterate the document pages
        page_number = i + 1
        if not (page_number in pages):
            continue

        extract_text(page, page_number, args)
        extract_image(page, page_number, args)
        pbar.update(1)

    pbar.close()
    doc.close()

    manifest = {"pages": list(pages)}
    manifest_filename = f"{args.outputdir}manifest.json"
    write_json(manifest_filename, manifest)


main(parser.parse_args())
