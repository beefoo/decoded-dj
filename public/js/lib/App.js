import Book from './Book.js';
import PointerManager from './PointerManager.js';
import Table from './Table.js';

export default class App {
  constructor(options = {}) {
    const defaults = {
      debug: false,
    };
    this.options = Object.assign(defaults, options);
    this.init();
  }

  init() {
    this.table = new Table();
    this.book = new Book(Object.assign({}, this.options));
    this.pointers = new PointerManager({
      onDrag: (pointer) => {
        this.onDragGlass(pointer);
      },
      target: 'glass',
    });
    this.loadListeners();
  }

  loadListeners() {
    window.addEventListener('resize', (_event) => this.onResize());
  }

  onDragGlass(pointer) {
    if (!pointer.isPrimary) return;
    this.table.onDrag(pointer);
    this.book.onDrag(this.table.getOffset());
  }

  onResize() {
    this.table.onResize();
    this.book.onResize();
  }
}
