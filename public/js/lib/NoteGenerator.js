import { MusicalScale } from '../vendor/MusicalScale.js';

export default class NoteGenerator {
  constructor(options = {}) {
    const defaults = {
      debug: false,
      key: 'G',
      mode: 'lydian',
    };
    this.options = Object.assign(defaults, options);
    this.init();
  }

  init() {
    const { key, mode } = this.options;
    this.chordSequence = [0, 2, 6, 3, 4, 2, 5, 1];
    this.scale = new MusicalScale();
    this.scale.load(key, mode);
  }

  getSequenceFromLetters(letters) {
    const { chords } = this.scale;
    const { chordSequence } = this;
    const sequence = [];
    chordSequence.forEach((index) => {
      const { notes } = chords[index].triad;
    });
    return sequence;
  }
}
