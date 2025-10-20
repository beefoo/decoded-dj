import MathHelper from './MathHelper.js';

export default class Book {
  constructor(options = {}) {
    const defaults = {
      debug: false,
      onPaginate: () => {},
    };
    this.options = Object.assign(defaults, options);
  }

  async init() {
    this.$el = document.getElementById('book');
    this.$circle = document.getElementById('circle');
    this.$page = false;
    this.manifest = await this.loadManifest();
    this.pageData = false;
    this.offset = { x: 0, y: 0 };
    this.center = { x: 0.5, y: 0.5 };
    this.pageIndex = 0;
    const pageData = await this.loadPage(this.pageIndex);
    this.loadListeners();
    return pageData;
  }

  getActiveLetters() {
    if (!this.pageData) return [];
    return this.pageData.chars
      .filter((char) => char.isActive)
      .map((char) => {
        return Object.assign({ c: char.c, $el: char.$el }, char.nBbox);
      });
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

  loadListeners() {
    const $pagePrev = document.getElementById('page-prev');
    const $pageNext = document.getElementById('page-next');

    $pagePrev.addEventListener('click', (_event) => this.pagePrev());
    $pageNext.addEventListener('click', (_event) => this.pageNext());
  }

  loadLetters() {
    const { width, height, chars } = this.pageData;
    let html = '<div id="page" class="page">';
    chars.forEach((char, i) => {
      const { c, bbox, svg } = char;
      const [x0, y0, x1, y1] = bbox;
      const x = x0 / width;
      const y = y0 / height;
      const w = (x1 - x0) / width;
      const h = (y1 - y0) / height;
      const style = {};
      style.left = `${x * 100}%`;
      style.top = `${y * 100}%`;
      style.width = `${w * 100}%`;
      style.height = `${h * 100}%`;
      this.pageData.chars[i].nBbox = { x, y, w, h };
      const styleString = Object.entries(style)
        .map((keyVal) => `${keyVal[0]}: ${keyVal[1]};`)
        .join(' ');
      html += `<div id="letter-${i}" class="letter" style="${styleString}" data-index="${i}">`;
      html += `<span class="visually-hidden">${c}</span>`;
      html += svg;
      html += '</div>';
    });
    html += '</div>'; // end page
    this.$el.innerHTML = html;
    // register HTML elements for highlighting
    chars.forEach((_char, i) => {
      this.pageData.chars[i].$el = document.getElementById(`letter-${i}`);
    });
    this.$page = document.getElementById('page');
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
    this.pageIndex = index;
    const { source } = this.options;
    const page = this.manifest.pages[index];
    const dataURL = `data/${source}/${page}.json`;

    const pageData = await this.loadJSON(dataURL);
    if (!pageData) return false;
    console.log('Loaded page data', pageData);
    this.pageData = pageData;
    this.pageData.chars.forEach((_char, i) => {
      this.pageData.chars[i].isActive = false;
    });
    this.$el.style.backgroundImage = `url(data/${source}/${page}.jpg)`;
    this.loadLetters();
    this.onResize();
    this.onDrag(this.offset);
    return pageData;
  }

  onDrag(offset) {
    this.offset = offset;
    const { $circle, $page, pageData } = this;

    if (!$page || !pageData) return;

    // determine which letters are visible within the circle
    const pr = $page.getBoundingClientRect();
    const cr = $circle.getBoundingClientRect();
    const radius = cr.width * 0.5 * 0.9;
    const center = {
      x: pr.width * 0.5 - offset.x,
      y: pr.height * 0.5 - offset.y,
    };
    pageData.chars.forEach((char, i) => {
      const { x, y, w, h } = char.nBbox;
      const bbox = {
        x: x * pr.width,
        y: y * pr.height,
        w: w * pr.width,
        h: h * pr.height,
      };
      const cx = bbox.x + bbox.w * 0.5;
      const cy = bbox.y + bbox.h * 0.5;
      const distance = MathHelper.distance(center.x, center.y, cx, cy);
      const isActive = distance < radius;
      // const $char = document.getElementById(`letter-${i}`);
      // if (isActive) $char.classList.add('active');
      // else $char.classList.remove('active');
      this.pageData.chars[i].isActive = isActive;
    });
    this.center = center;
  }

  onResize() {
    const { $el, $page, pageData } = this;
    if (!$page && !pageData) return;
    const { width, height } = this.pageData;
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

  async pageNext() {
    if (!this.manifest) return;
    let { pageIndex } = this;
    pageIndex += 1;
    if (pageIndex >= this.manifest.pages.length) pageIndex = 0;
    const pageData = await this.loadPage(pageIndex);
    this.options.onPaginate();
    return pageData;
  }

  async pagePrev() {
    if (!this.manifest) return;
    let { pageIndex } = this;
    pageIndex -= 1;
    if (pageIndex < 0) pageIndex = this.manifest.pages.length - 1;
    const pageData = await this.loadPage(pageIndex);
    this.options.onPaginate();
    return pageData;
  }
}
