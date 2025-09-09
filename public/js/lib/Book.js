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
    return pageData;
  }
}
