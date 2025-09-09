import Book from './Book.js';
import MathHelper from './MathHelper.js';
import PointerManager from './PointerManager.js';

export default class App {
  constructor(options = {}) {
    const defaults = {
      debug: false,
    };
    this.options = Object.assign(defaults, options);
    this.init();
  }

  init() {
    this.$table = document.getElementById('table');
    this.offset = {
      x: 0,
      y: 0,
    };
    this.book = new Book(Object.assign({}, this.options));
    this.pointers = new PointerManager({
      onDrag: (pointer) => {
        this.onDragGlass(pointer);
      },
      target: 'glass',
    });
    this.onResize();
  }

  loadListeners() {
    window.addEventListener('resize', (_event) => this.onResize());
  }

  onDragGlass(pointer) {
    if (!pointer.isPrimary) return;
    const { w, h } = this.tableSize;
    const [xmin, ymin, xmax, ymax] = [-25, -25, 25, 25];
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
    this.$table.style.transform = `translate3d(${x}%, ${y}%, 0)`;
  }

  onResize() {
    const rect = this.$table.getBoundingClientRect();
    this.tableSize = {
      w: rect.width,
      h: rect.height,
    };
  }
}
