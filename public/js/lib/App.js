import Book from './Book.js';
import NoteGenerator from './NoteGenerator.js';
import PointerManager from './PointerManager.js';
import Sequencer from './Sequencer.js';
import Synth from './Synth.js';
import Table from './Table.js';

export default class App {
  constructor(options = {}) {
    const defaults = {
      debug: false,
    };
    this.options = Object.assign(defaults, options);
    this.init();
  }

  async init() {
    this.table = new Table();
    this.book = new Book(Object.assign({}, this.options));
    this.sequencer = new Sequencer();
    this.synth = new Synth();
    this.generator = new NoteGenerator();
    const pageData = await this.book.init();
    if (!pageData) return;
    this.loadSequence();
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

  loadSequence() {
    const letters = this.book.getActiveLetters();
    const noteSeq = this.generator.getSequenceFromLetters(letters);
    console.log(noteSeq);
  }

  onDragGlass(pointer) {
    if (!pointer.isPrimary) return;
    this.table.onDrag(pointer);
    this.book.onDrag(this.table.getOffset());
    this.loadSequence();
  }

  onResize() {
    this.table.onResize();
    this.book.onResize();
  }
}
