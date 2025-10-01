import { Scale } from '../vendor/Tonal.js';

export default class NoteGenerator {
  constructor(options = {}) {
    const defaults = {
      debug: false,
    };
    this.options = Object.assign(defaults, options);
    this.init();
  }

  init() {
    console.log(Scale.get('C major').notes);
  }

  lettersToNotes(letters) {
    const notes = [];
    return notes;
  }
}
