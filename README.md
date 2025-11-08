# Music For Mystics

## Running scripts

Install [Tesseract](https://github.com/tesseract-ocr/tesseract) to do the OCR. Also download [eng.traineddata](https://github.com/tesseract-ocr/tessdata/blob/main/eng.traineddata) and place in `path/to/Tesseract-OCR/tessdata/` to support running legacy Tesseract engine.

Then install Python libraries:

```
pip install -r requirements.txt
```

Try the `./scripts/extract.ipynb` Jupyter notebook to see if everything works properly with a test image.

To download images in bulk, find a source that uses the [IIIF](https://en.wikipedia.org/wiki/International_Image_Interoperability_Framework) standard Image API. For example, for [this item](https://www.loc.gov/item/15004720/) on the Library of Congress website, you can download the IIIF data file [by just adding manifest.json](https://www.loc.gov/item/15004720/manifest.json).

Now you can run the extraction script on multiple pages (e.g. 426-436) of the above item like this:

```
python scripts/extract.py --input "data/theatrum_chemicum_britannicum_15004720_iiif_manifest.json" --pages "426-436" --out "public/data/theatrum_chemicum_britannicum_15004720/"
```

The output would be a mix of .json files (representing the OCR data) and .jpg image files which are images of the pages resized for the web.

Then you can indicate which output files are activated in the UI by editing `./public/js/config.js`

Finally run the web app locally by running (assuming you have Node.js installed):

```
npm install
npm start
```
