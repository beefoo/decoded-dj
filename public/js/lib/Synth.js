import StringHelper from './StringHelper.js';
import Throttler from './Throttler.js';
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
    this.loaded = false;
    this.lastScheduled = -1;
    this.setDefaults();
    this.loadFromStorage();
    this.load();
    this.loadListeners();
  }

  getInputProperties() {
    const props = {
      effects: {
        reverb: {
          decay: 2,
        },
      },
      synth: {
        envelope: {},
        oscillator: {
          modulationType: 'square',
        },
        modulation: {
          type: 'square',
        },
      },
    };
    // set reverb
    props.effects.reverb.wet = parseFloat(
      document.getElementById('effects-reverb-wet').value,
    );
    // set oscillator type
    props.synth.oscillator.type = document.querySelector(
      '.oscillator-type:checked',
    ).value;
    // set envelope
    ['attack', 'decay', 'sustain', 'release'].forEach((prop) => {
      const value = parseFloat(
        document.getElementById(`synth-envelope-${prop}`).value,
      );
      props.synth.envelope[prop] = value;
    });
    return props;
  }

  getPropsFromURLParams() {
    if (!('oscillator' in this.options)) return false;
    const { options } = this;
    const props = structuredClone(this.defaults);

    if ('oscillator' in options)
      props.synth.oscillator.type = options.oscillator;
    if ('reverb' in options) props.effects.reverb.wet = options.reverb;
    ['attack', 'decay', 'sustain', 'release'].forEach((prop) => {
      if (prop in options) props.synth.envelope[prop] = options[prop];
    });
    return props;
  }

  getURLParams() {
    const props = this.getInputProperties();
    const params = {};
    params.oscillator = props.synth.oscillator.type;
    params.reverb = props.effects.reverb.wet;
    ['attack', 'decay', 'sustain', 'release'].forEach((prop) => {
      params[prop] = props.synth.envelope[prop];
    });
    return params;
  }

  load() {
    if (this.loaded) return;
    const props = this.getInputProperties();
    const effects = {};
    // add distortion
    // effects.distortion = new Tone.Distortion({ distortion: 0.5, wet: 0.5 });
    // add reverb
    effects.reverb = new Tone.Reverb(props.effects.reverb);
    // attenuate high notes
    effects.lowpass = new Tone.Filter({ frequency: 'C6', type: 'lowpass' });
    // boost low notes
    effects.lowshelf = new Tone.Filter({
      frequency: 'C4',
      type: 'lowshelf',
      gain: 6.0,
    });
    // avoid blowing out the audio
    effects.limiter = new Tone.Limiter(-6);
    // avoid being too loud
    effects.gain = new Tone.Gain(0.8).toDestination();
    const effectChain = [
      // effects.distortion,
      effects.reverb,
      effects.lowpass,
      effects.lowshelf,
      effects.limiter,
      effects.gain,
    ];
    this.synth = new Tone.PolySynth(Tone.AMSynth, props.synth).chain(
      ...effectChain,
    );
    this.effects = effects;
    Tone.start();
    this.loaded = true;
  }

  loadFromStorage() {
    let props = false;
    const urlProps = this.getPropsFromURLParams();
    if (urlProps) props = urlProps;
    else {
      props = StringHelper.loadStorageData(this.options.localStorageKey, false);
    }

    if (!props) return;

    // set oscillator type
    document.getElementById(
      `synth-oscillator-type-${props.synth.oscillator.type}`,
    ).checked = true;

    // set envelope values in UI
    ['attack', 'decay', 'sustain', 'release'].forEach((prop) => {
      const value = props.synth.envelope[prop];
      document.getElementById(`synth-envelope-${prop}`).value = value;
    });

    // set reverb in UI
    const reverb = props.effects.reverb.wet;
    document.getElementById(`effects-reverb-wet`).value = reverb;

    this.update();
  }

  loadListeners() {
    const throttled = () => this.update();
    const throttler = new Throttler({
      throttled,
      seconds: 0.3,
    });
    const $options = document.querySelectorAll('.synth-option');
    $options.forEach(($option) => {
      $option.addEventListener('input', (_event) => {
        throttler.queue();
      });
    });
    const $types = document.querySelectorAll('.oscillator-type');
    $types.forEach(($option) => {
      $option.addEventListener('click', (_event) => {
        throttler.queue();
      });
    });
    const $reset = document.getElementById('reset-settings-button');
    $reset.addEventListener('click', (_event) => {
      this.resetSettings();
    });
  }

  pause() {
    this.synth.releaseAll();
  }

  play(note, time, duration = '8n') {
    const ctx = Tone.getContext();
    if (ctx.state !== 'running') return;
    this.synth.triggerAttackRelease(note, duration, time);
  }

  resetSettings() {
    const { defaults } = this;

    document.getElementById(
      `synth-oscillator-type-${defaults.synth.oscillator.type}`,
    ).checked = true;

    ['attack', 'decay', 'sustain', 'release'].forEach((prop) => {
      const value = defaults.synth.envelope[prop];
      document.getElementById(`synth-envelope-${prop}`).value = value;
    });

    document.getElementById(`effects-reverb-wet`).value =
      defaults.effects.reverb.wet;

    this.update();
  }

  setDefaults() {
    const defaults = {
      synth: {
        oscillator: {
          type: 'amsquare',
        },
        envelope: {},
      },
      effects: {
        reverb: {},
      },
    };

    ['attack', 'decay', 'sustain', 'release'].forEach((prop) => {
      const value = document.getElementById(
        `synth-envelope-${prop}-value`,
      ).innerText;
      defaults.synth.envelope[prop] = parseFloat(value);
    });

    defaults.effects.reverb.wet = parseFloat(
      document.getElementById(`effects-reverb-wet-value`).innerText,
    );

    this.defaults = defaults;
  }

  update() {
    const props = this.getInputProperties();

    // set envelope values in UI
    ['attack', 'decay', 'sustain', 'release'].forEach((prop) => {
      const value = props.synth.envelope[prop];
      document.getElementById(`synth-envelope-${prop}-value`).innerText = value;
    });

    // set reverb in UI
    const reverb = props.effects.reverb.wet;
    document.getElementById(`effects-reverb-wet-value`).innerText = reverb;

    this.updateStorage();

    if (!this.loaded) return;

    // update synth
    this.synth.set(props.synth);
    // update reverb
    this.effects.reverb.set(props.effects.reverb);
  }

  updateStorage() {
    const props = this.getInputProperties();
    StringHelper.saveStorageData(this.options.localStorageKey, props);
  }
}
