import MathHelper from './MathHelper.js';

export default class Table {
  constructor(options = {}) {
    const defaults = {
      debug: false,
    };
    this.options = Object.assign(defaults, options);
    this.init();
  }

  init() {
    this.$el = document.getElementById('table');
    this.offset = { x: 0, y: 0 };
    this.onResize();
  }

  // get offset in pixels
  getOffset() {
    const { w, h } = this.size;
    const { x, y } = this.offset;
    return {
      x: w * (x / 100.0),
      y: h * (y / 100.0),
    };
  }

  onDrag(pointer) {
    const { w, h } = this.size;
    const [xmin, ymin, xmax, ymax] = [-16, -16, 16, 16];
    const { delta } = pointer;
    this.offset.x = MathHelper.clamp(
      this.offset.x + (delta.x / w) * 100,
      xmin,
      xmax,
    );
    this.offset.y = MathHelper.clamp(
      this.offset.y + (delta.y / h) * 100,
      ymin,
      ymax,
    );
    const { x, y } = this.offset;
    this.$el.style.transform = `translate3d(${x}%, ${y}%, 0)`;
  }

  onResize() {
    const rect = this.$el.getBoundingClientRect();
    this.size = {
      w: rect.width,
      h: rect.height,
    };
  }
}
