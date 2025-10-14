import MusicalScale from '../vendor/MusicalScale.js';

export default class NoteGenerator {
  constructor(options = {}) {
    const defaults = {
      debug: false,
      baseOctave: 3,
      key: 'G',
      maxNotes: 12,
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

  getSequenceFromLetters(letters, center) {
    const { baseOctave, maxNotes } = this.options;
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
        const { note1, rel_octave } = n;
        const matches = pool.filter((item) => item.note === note1);
        if (matches.length <= 0) return;
        matches.forEach((_item, i) => (matches[i].relOctave = rel_octave));
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
      // sort by vertical position (lowest first)
      chordMatches.sort((a, b) => b.y - a.y);
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
        chordMatches.forEach((m, i) => (chordMatches[i].octave += delta));
      }
      // finally, sort by x
      chordMatches.sort((a, b) => a.x - b.x);
      // console.log(chordMatches.map((m) => `${m.note}${m.octave}`));
      sequence.push(chordMatches);
    });
    return sequence;
  }
}
