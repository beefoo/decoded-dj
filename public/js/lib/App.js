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
    this.wasPlayingBeforeBlur = false;
    this.table = new Table();
    this.book = new Book(
      Object.assign(
        {
          onPaginate: () => this.onBookPaginate(),
        },
        this.options,
      ),
    );
    this.sequencer = new Sequencer({
      onStep: (time, note) => this.onSequencerStep(time, note),
    });
    this.synth = new Synth();
    this.generator = new NoteGenerator();
    const pageData = await this.book.init();
    if (!pageData) return;
    this.loadSequence();
    this.pointers = new PointerManager({
      onDrag: (pointer) => {
        this.onGlassDrag(pointer);
      },
      onTap: (pointer) => {
        this.onGlassTap(pointer);
      },
      target: 'glass',
    });
    this.loadListeners();
    this.isReady = true;
  }

  loadListeners() {
    window.addEventListener('resize', (_event) => this.onResize());
    window.addEventListener('blur', (_event) => this.onBlur());
    window.addEventListener('focus', (_event) => this.onFocus());
  }

  loadSequence() {
    const letters = this.book.getActiveLetters();
    const noteSeq = this.generator.getSequenceFromLetters(
      letters,
      this.book.center,
    );
    this.sequencer.setSequences(noteSeq);
  }

  onBlur() {
    if (!this.isReady) return;

    if (this.sequencer.isPlaying) {
      this.wasPlayingBeforeBlur = true;
      this.sequencer.pause();
      return;
    }

    this.wasPlayingBeforeBlur = false;
  }

  onBookPaginate() {
    if (!this.isReady) return;
    this.loadSequence();
  }

  onFocus() {
    const { wasPlayingBeforeBlur } = this;
    this.wasPlayingBeforeBlur = false;
    if (!this.isReady || this.sequencer.isPlaying) return;

    if (wasPlayingBeforeBlur) this.sequencer.play();
  }

  onGlassDrag(pointer) {
    if (!pointer.isPrimary) return;
    this.table.onDrag(pointer);
    this.book.onDrag(this.table.getOffset());
    this.loadSequence();
  }

  onGlassTap(pointer) {
    if (!pointer.isPrimary) return;
    this.sequencer.togglePlay();
  }

  onResize() {
    this.table.onResize();
    this.book.onResize();
  }

  onSequencerStep(time, noteData) {
    const { note, octave, $el, index } = noteData;
    const duration = '16n';
    this.synth.play(`${note}${octave}`, time, duration);
    // add bass every fourth note
    if (index % 4 === 0) {
      const bassOctave = Math.max(octave - 4, 2);
      const bassDuration = '2n';
      this.synth.play(`${note}${bassOctave}`, time, bassDuration, 'bass');
    }
    this.sequencer.scheduleDraw(() => {
      $el.classList.remove('playing');
      setTimeout(() => $el.classList.add('playing'), 1);
    }, time);
  }
}
