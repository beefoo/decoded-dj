import throttle from '../vendor/Throttle.js';
import * as Tone from '../vendor/Tone.js';
import { Midi as ToneMidi } from '../vendor/Tone-midi.js';

export default class Sequencer {
  constructor(options = {}) {
    const defaults = {
      audioContext: false,
      bpm: 120,
      debug: false,
      onStep: (time, note) => {
        console.log(time, note);
      },
      patternDirection: 'up',
      sequences: [],
    };
    this.options = Object.assign(defaults, options);
    this.init();
  }

  init() {
    const { bpm, sequences } = this.options;
    this.$playButton = document.getElementById('play-button');
    this.$download = document.getElementById('download-pattern');

    this.firstPlay = true;
    this.pattern = false;
    this.isPlaying = false;
    this.toneTransport = Tone.getContext().transport;
    this.toneDraw = Tone.getContext().draw;
    this.setBPM(bpm);

    if (sequences.length > 0) {
      this.setSequences(sequences);
    }
    this.loadListeners();
  }

  download() {
    if (!this.isReady()) return;

    const notes = this.pattern.values;
    const { interval } = this.pattern;
    const noteDur = this.pattern.toSeconds('16n');

    const midi = new ToneMidi();
    // add a track
    const track = midi.addTrack();

    // console.log(notes);
    notes.forEach((note, i) => {
      const name = `${note.note}${note.octave}`;
      const time = i * interval;
      track.addNote({
        name,
        time,
        duration: noteDur,
      });
    });

    // convert to data and download
    const midiBuff = midi.toArray();
    const midiBlob = new Blob([midiBuff], {
      type: 'audio/mid',
    });
    const midiURL = window.URL.createObjectURL(midiBlob);
    const $link = document.getElementById('download-midi-link');
    $link.href = midiURL;
    $link.click();
    window.URL.revokeObjectURL(midiURL);
  }

  isReady() {
    return this.pattern !== false;
  }

  loadListeners() {
    this.$playButton &&
      this.$playButton.addEventListener('click', (_event) => this.togglePlay());

    this.$download.addEventListener('click', (_event) => this.download());
  }

  pause() {
    this.isPlaying = false;
    this.$playButton.classList.remove('playing');
    this.toneTransport.pause();
  }

  play() {
    if (this.firstPlay) {
      this.firstPlay = false;
      Tone.start();
    }
    this.isPlaying = true;
    this.$playButton.classList.add('playing');
    this.toneTransport.start();
  }

  resetSequence() {
    if (this.pattern) {
      this.pattern.stop();
      this.pattern.dispose();
    }
    this.pattern = false;
  }

  scheduleDraw(callback, time) {
    this.toneDraw.schedule(callback, time);
  }

  setBPM(bpm) {
    this.toneTransport.bpm.value = bpm;
  }

  setPatternDirection(patternDirection) {
    if (!this.pattern) return;
    this.pattern.set({ pattern: patternDirection });
  }

  setSequence(sequence) {
    const { onStep, patternDirection } = this.options;
    const interval = `${sequence.length}n`;
    const playbackRate = Math.floor(12 / sequence.length);
    this.resetSequence();
    this.pattern = new Tone.Pattern(
      (time, note) => {
        this.options.onStep(time, note);
      },
      sequence,
      patternDirection,
    ).start(0);
    this.pattern.set({ interval, playbackRate });
    // update UI
    document
      .querySelectorAll('.letter')
      .forEach(($el) => $el.classList.remove('active'));
    sequence.forEach((note) => note.$el.classList.add('active'));
  }

  setSequences(sequences) {
    if (!this.throttledSetSequences) {
      this.throttledSetSequences = throttle((s) => {
        this.sequences = s;
        this.currentSequenceIndex = 0;
        if (s.length > 0)
          this.setSequence(this.sequences[this.currentSequenceIndex]);
        else {
          this.resetSequence();
        }
      }, 200);
    }
    this.throttledSetSequences(sequences);
  }

  togglePlay() {
    if (!this.isReady()) return;
    if (!this.throttledTogglePlay) {
      this.throttledTogglePlay = throttle(
        () => {
          const isPlaying = this.$playButton.classList.contains('playing');
          if (isPlaying) this.pause();
          else this.play();
        },
        200,
        { trailing: false },
      );
    }
    this.throttledTogglePlay();
  }
}
