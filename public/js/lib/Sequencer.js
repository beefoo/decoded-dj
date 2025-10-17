import * as Tone from '../vendor/Tone.js';

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

  isReady() {
    return this.pattern !== false;
  }

  loadListeners() {
    this.$playButton &&
      this.$playButton.addEventListener('click', (_event) => this.togglePlay());
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
    if (!this.pattern) {
      this.pattern = new Tone.Pattern(
        (time, note) => {
          this.options.onStep(time, note);
        },
        sequence,
        patternDirection,
      ).start(0);
      this.pattern.set({ interval, playbackRate });
    } else {
      this.pattern.set({
        values: sequence,
        interval,
        playbackRate,
      });
    }
    // update UI
    document
      .querySelectorAll('.letter')
      .forEach(($el) => $el.classList.remove('active'));
    sequence.forEach((note) => note.$el.classList.add('active'));
  }

  setSequences(sequences) {
    this.sequences = sequences;
    this.currentSequenceIndex = 0;
    if (sequences.length > 0)
      this.setSequence(this.sequences[this.currentSequenceIndex]);
    else {
      this.pattern = false;
      this.pause();
    }
  }

  togglePlay() {
    if (!this.isReady()) return;
    const isPlaying = this.$playButton.classList.contains('playing');
    if (isPlaying) this.pause();
    else this.play();
  }
}
