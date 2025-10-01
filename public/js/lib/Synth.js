import * as Tone from '../vendor/Tone.js';

export default class Synth {
  constructor(options = {}) {
    const defaults = {
      debug: false,
      localStorageKey: 'synth',
    };
    this.options = Object.assign(defaults, options);
    this.init();
  }

  init() {
    const ctx = Tone.getContext();
    console.log(ctx);
  }
}
