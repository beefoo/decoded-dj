"""Script for extracting pages from PDF as image and text data"""

import argparse
from pprint import pprint
import pymupdf

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
    default="28",
    help="A range, a list, or a list of ranges, e.g. 4,6-10,20,25-40; 'all' for all pages",
)
parser.add_argument(
    "-tess",
    "--tessdata",
    default="C:/Program Files/Tesseract-OCR/tessdata",
    help="Location of tesseract for OCR",
)
parser.add_argument(
    "-out",
    "--outputdir",
    default="public/data/theatrum_chemicum_britannicum_15004720",
    help="Path to output directory",
)
parser.add_argument(
    "-c",
    "--clean",
    action="store_true",
    help="Clear the output directory before running",
)


def main(args):
    # Create output directories
    make_directories(args.outputdir)

    # Clear output directory if desired
    if args.clean:
        clear_directory(args.output)

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

    pages = set(pages)
    for i, page in enumerate(doc):  # iterate the document pages
        page_number = i + 1
        if not (page_number in pages):
            continue
        tp = page.get_textpage_ocr(tessdata=args.tessdata)
        data = tp.extractRAWDICT()
        w, h = (data["width"], data["height"])
        print(f"W: {w}, H: {h}")
        chars = []
        for block in data["blocks"]:
            for line in block["lines"]:
                for span in line["spans"]:
                    for char in span["chars"]:
                        chars.append(char)
        print(" ".join([char["c"] for char in chars]))
        break

    doc.close()


main(parser.parse_args())
