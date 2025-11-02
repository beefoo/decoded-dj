import * as Tone from '../vendor/Tone.js';

export default class Synth {
  constructor(options = {}) {
    const defaults = {
      bass: {
        vibratoAmount: 0.1,
        harmonicity: 1.5,
        voice0: {
          oscillator: { type: 'triangle' },
          envelope: { attack: 0.05 },
        },
        voice1: {
          oscillator: { type: 'triangle' },
          envelope: { attack: 0.05 },
        },
      },
      debug: false,
      delay: {
        delayTime: '16n',
        feedback: 0.1,
        wet: 0.3,
      },
      distortion: {
        distortion: 0.8,
        wet: 0.2,
      },
      reverb: {
        decay: 2,
        wet: 0.2,
      },
    };
    this.options = Object.assign(defaults, options);
    this.init();
  }

  init() {
    this.loaded = false;
    this.load();
  }

  load() {
    if (this.loaded) return;
    const { bass, delay, distortion, reverb } = this.options;
    const effects = {};
    // add delay
    effects.delay = new Tone.PingPongDelay(delay);
    // add distortion
    effects.distortion = new Tone.Distortion(distortion);
    // add reverb
    effects.reverb = new Tone.Reverb(reverb);
    // attenuate high notes
    effects.lowpass = new Tone.Filter({ frequency: 'C6', type: 'lowpass' });
    // boost low notes
    effects.lowshelf = new Tone.Filter({
      frequency: 'C4',
      type: 'lowshelf',
      gain: 6.0,
    });
    // avoid being too loud
    effects.gain = new Tone.Gain(0.7).toDestination();
    effects.trebGAin = new Tone.Gain(0.8);
    effects.bassGain = new Tone.Gain(0.2);
    // create treble effect chain
    const trebEffectChain = [
      effects.delay,
      effects.reverb,
      effects.trebGAin,
      effects.gain,
    ];
    // create bass effect chain
    const bassEffectChain = [
      effects.distortion,
      effects.lowpass,
      effects.lowshelf,
      effects.bassGain,
      effects.gain,
    ];
    this.synth = {};
    this.synth.treb = new Tone.PolySynth(Tone.AMSynth).chain(
      ...trebEffectChain,
    );
    this.synth.bass = new Tone.DuoSynth(bass).chain(...bassEffectChain);
    this.loaded = true;
  }

  pause() {
    this.synth.releaseAll();
  }

  play(note, time, duration = '8n', instrument = 'treb') {
    const ctx = Tone.getContext();
    if (ctx.state !== 'running') return;
    try {
      this.synth[instrument].triggerAttackRelease(note, duration, time);
    } catch (error) {
      console.log('Tone.js error', error);
    }
  }
}
