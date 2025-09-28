export default class Book {
  constructor(options = {}) {
    const defaults = {
      debug: false,
    };
    this.options = Object.assign(defaults, options);
    this.init();
  }

  async init() {
    this.$el = document.getElementById('book');
    this.manifest = await this.loadManifest();
    this.pageData = false;
    this.loadPage(0);
  }

  async loadJSON(url) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        console.log(`Response status: ${response.status}`);
        return false;
      }
      const result = await response.json();
      return result;
    } catch (error) {
      console.error(error.message);
      return false;
    }
  }

  loadLetters() {
    const { width, height, chars } = this.pageData;
    let html = '<div id="page" class="page">';
    chars.forEach((char, i) => {
      const { c, bbox, svg } = char;
      const [x0, y0, x1, y1] = bbox;
      const style = {};
      style.left = `${(x0 / width) * 100}%`;
      style.top = `${(y0 / height) * 100}%`;
      style.width = `${((x1 - x0) / width) * 100}%`;
      style.height = `${((y1 - y0) / height) * 100}%`;
      const styleString = Object.entries(style)
        .map((keyVal) => `${keyVal[0]}: ${keyVal[1]};`)
        .join(' ');
      html += `<div class="letter" style="${styleString}" data-index="${i}">`;
      html += `<span class="visually-hidden">${c}</span>`;
      html += svg;
      html += '</div>';
    });
    html += '</div>'; // end page
    this.$el.innerHTML = html;
  }

  async loadManifest() {
    const url = `data/${this.options.source}/manifest.json`;
    const manifest = await this.loadJSON(url);
    if (manifest) {
      console.log(
        `Loaded manifest with ${manifest.pages.length.toLocaleString()} pages.`,
      );
    }
    return manifest;
  }

  async loadPage(index) {
    if (!this.manifest) return;
    const { source } = this.options;
    const page = this.manifest.pages[index];
    const dataURL = `data/${source}/${page}.json`;

    const pageData = await this.loadJSON(dataURL);
    if (!pageData) return false;
    console.log('Loaded page data', pageData);
    this.pageData = pageData;
    this.$el.style.backgroundImage = `url(data/${source}/${page}.jpg)`;
    this.loadLetters();
    this.onResize();
    return pageData;
  }

  onResize() {
    const $page = document.getElementById('page');
    const { pageData, $el } = this;
    if (!$page && !pageData) return;
    const { width, height, chars } = this.pageData;
    const outer = $el.getBoundingClientRect();
    if (outer.height <= 0) return;
    const outerRatio = outer.width / outer.height;
    const innerRatio = width / height;
    const style = {
      width: 100,
      height: 100,
      left: 0,
      top: 0,
    };
    if (outerRatio > innerRatio) {
      const scale = outer.height / height;
      const newWidth = width * scale;
      style.width = (newWidth / outer.width) * 100;
      style.left = (100 - style.width) * 0.5;
    } else {
      const scale = outer.width / width;
      const newHeight = height * scale;
      style.height = (newHeight / outer.height) * 100;
      style.top = (100 - style.height) * 0.5;
    }
    const styleString = Object.entries(style)
      .map((keyVal) => `${keyVal[0]}: ${keyVal[1]}%;`)
      .join(' ');
    $page.style.cssText = styleString;
  }
}
