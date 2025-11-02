import MathHelper from './MathHelper.js';
import MusicalScale from '../vendor/MusicalScale.js';

export default class NoteGenerator {
  constructor(options = {}) {
    const defaults = {
      debug: false,
      baseOctave: 5,
      maxNotes: 12,
      onChange: () => {},
      roundToNearest: 4,
    };
    this.options = Object.assign(defaults, options);
    this.init();
  }

  init() {
    this.$key = document.getElementById('music-key');
    this.$mode = document.getElementById('music-mode');
    this.key = this.$key.value;
    this.mode = this.$mode.value;
    this.chordSequence = [0, 2, 6, 3, 4, 2, 5, 1];
    this.scale = new MusicalScale();
    this.scale.load(this.key, this.mode);
    this.loadListeners();
  }

  getSequenceFromLetters(letters, center) {
    const { baseOctave, maxNotes, roundToNearest } = this.options;
    const pool = letters.map((letter, i) => {
      const { c, x, y, $el } = letter;
      return {
        x,
        y,
        $el,
        note: c.toUpperCase(),
      };
    });
    // build a chord sequence based on letters
    const { chords } = this.scale;
    const { chordSequence } = this;
    const sequence = [];
    chordSequence.forEach((index) => {
      const { notes } = chords[index].triad;
      let chordMatches = [];
      // first, get the letters that match the notes in this chord
      notes.forEach((n) => {
        const { note, note1, rel_octave } = n;
        const matches = pool.filter((item) => item.note === note1);
        if (matches.length <= 0) return;
        matches.forEach((_item, i) => {
          matches[i].note = note;
          matches[i].relOctave = rel_octave;
        });
        chordMatches = chordMatches.concat(matches);
      });
      if (chordMatches.length <= 0) return;

      // if too many notes, get rid of the notes far from the vertical center
      if (chordMatches.length > maxNotes) {
        // sort by distance from vertical center
        chordMatches.sort(
          (a, b) => Math.abs(a.y - center.y) - Math.abs(b.y - center.y),
        );
        chordMatches = chordMatches.slice(0, maxNotes);
      }
      // round to nearest # of notes
      if (
        chordMatches.length >= 2 &&
        chordMatches.length % roundToNearest > 0
      ) {
        const newLength = MathHelper.floorToNearest(
          chordMatches.length,
          roundToNearest,
        );
        chordMatches = chordMatches.slice(0, newLength);
      }
      // sort by vertical position (lowest first)
      chordMatches.sort((a, b) => b.y - a.y);
      if (chordMatches.length <= 0) return;
      // assign octaves to the notes
      // console.log(notes.map((n) => n.note1));
      // console.log(chordMatches.map((m) => m.note));
      let currentNote = chordMatches[0].note;
      let currentNoteIndex = notes.findIndex((n) => n.note1 === currentNote);
      let currentOctave = 0;
      chordMatches.forEach((m, i) => {
        const { note } = m;
        if (note === currentNote) {
          chordMatches[i].octave = currentOctave;
          return;
        }
        const noteIndex = notes.findIndex((n) => n.note1 === note);
        if (noteIndex < currentNoteIndex) currentOctave += 1;
        chordMatches[i].octave = currentOctave + m.relOctave;
        currentNote = note;
        currentNoteIndex = noteIndex;
      });
      // adjust octaves based on baseOcave
      const centerOctave = Math.ceil(currentOctave / 2);
      if (centerOctave < baseOctave) {
        const delta = baseOctave - centerOctave;
        chordMatches.forEach((_m, i) => (chordMatches[i].octave += delta));
      }
      // sort by x
      chordMatches.sort((a, b) => a.x - b.x);
      // assign indices
      chordMatches.forEach((_m, i) => (chordMatches[i].index = i));
      // console.log(chordMatches.map((m) => `${m.note}${m.octave}`));
      sequence.push(chordMatches);
    });
    return sequence;
  }

  loadListeners() {
    this.$key.addEventListener('change', (_event) => this.onChange());
    this.$mode.addEventListener('change', (_event) => this.onChange());
  }

  onChange() {
    this.key = this.$key.value;
    this.mode = this.$mode.value;
    this.scale.load(this.key, this.mode);
    this.options.onChange();
  }
}
