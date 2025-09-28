"""Script for extracting pages from PDF as image and text data"""

import argparse
import os
from PIL import Image
from tqdm import tqdm

from helpers import *

parser = argparse.ArgumentParser()
parser.add_argument(
    "-in",
    "--input",
    default="data/theatrum_chemicum_britannicum_15004720_iiif_manifest.json",
    help="Path to IIIF manifest file",
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
    "-contain",
    "--contain",
    default=1200,
    type=int,
    help="Target output max dimension of image",
)
parser.add_argument(
    "-conf",
    "--confidence",
    default=90,
    type=int,
    help="Minimum OCR confidence",
)
parser.add_argument(
    "-tess",
    "--tesscmd",
    default="C:/Program Files/Tesseract-OCR/tesseract.exe",
    help="Location of tesseract for OCR",
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


def main(args):
    """The main and only function"""

    tmpdir = f"tmp/{args.outputdir}"
    # Create output directories
    make_directories([args.outputdir, tmpdir])

    # Clear output directory if desired
    if args.clean:
        clear_directory(args.outputdir)

    manifest = read_json(args.input)
    canvases = manifest["sequences"][0]["canvases"]

    # parse pages
    pages = []

    if args.pages == "all":
        pages = range(1, len(canvases) + 1)

    else:
        parts = [part.strip().split("-") for part in args.pages.split(",")]
        for range_string in parts:
            if len(range_string) == 1:
                pages.append(int(range_string[0]))
            elif len(range_string) == 2:
                start, end = tuple(range_string)
                for page in range(int(start), int(end) + 1):
                    pages.append(page)

    match_chars = [char.strip() for char in args.match.split(",")]

    for page in tqdm(pages):
        canvas = canvases[page - 1]
        img_url = canvas["images"][0]["resource"]["@id"]

        # Download and read image
        tmp_fn = f"{tmpdir}{page}.jpg"
        if not os.path.isfile(tmp_fn):
            download_file(img_url, tmp_fn)
        im = Image.open(tmp_fn)

        # Process image
        im_fn = f"{args.outputdir}{page}.jpg"
        if not os.path.isfile(im_fn):
            resized = contain_image(im, args.contain)
            resized.save(im_fn)

        # Process text
        data_fn = f"{args.outputdir}{page}.json"
        if not os.path.isfile(data_fn):
            w, h = im.size
            data = {"width": w, "height": h, "chars": []}
            _words, chars = extract_letters(
                im, match_chars, args.tesscmd, args.confidence
            )
            for char, x0, y0, x1, y1, _conf in chars:
                clip = im.crop((x0, y0, x1, y1))
                clip_largest_segment = get_largest_mask_segment(clip)
                svg = image_to_svg(clip_largest_segment, turdsize=5)
                data["chars"].append({"c": char, "bbox": [x0, y0, x1, y1], "svg": svg})
            write_json(data_fn, data)

    manifest = {"pages": list(pages)}
    manifest_filename = f"{args.outputdir}manifest.json"
    write_json(manifest_filename, manifest)


main(parser.parse_args())
