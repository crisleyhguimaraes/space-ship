export type Tone = { rumble: number; sub: number; crackle: number; gain: number }

// thrust 0..1 → a rocket roar: the low-pass opens, the sub-bass swells, crackle only shows up under real power
export function engineTone(thrust: number): Tone {
  const t = Math.min(Math.max(thrust, 0), 1)
  return { rumble: 90 + t * 190, sub: 0.25 + t * 0.55, crackle: t * t * 0.9, gain: 0.05 + t * 0.32 }
}

// everything is synthesized: no audio files to download
export function createAudio() {
  let ctx: AudioContext | null = null
  let master: GainNode | null = null
  let engine: Engine | null = null
  let reentryGain: GainNode | null = null
  let noise: AudioBuffer | null = null
  let muted = false

  function start() {
    if (ctx) {
      void ctx.resume()
      return
    }
    ctx = new AudioContext()
    master = ctx.createGain()
    master.gain.value = muted ? 0 : 1
    master.connect(ctx.destination)
    noise = noiseBuffer(ctx)
    engine = buildEngine(ctx, master, noise)
    buildAmbient(ctx, master, noise)
    reentryGain = buildReentry(ctx, master, noise)
  }

  return {
    start,
    update(thrust: number, reentry: number) {
      if (!ctx || !engine || !reentryGain) return
      const tone = engineTone(thrust)
      const now = ctx.currentTime
      engine.rumble.frequency.setTargetAtTime(tone.rumble, now, 0.3)
      engine.rumbleGain.gain.setTargetAtTime(0.5 + thrust * 0.5, now, 0.2)
      engine.subGain.gain.setTargetAtTime(tone.sub, now, 0.3)
      engine.crackleGain.gain.setTargetAtTime(tone.crackle, now, 0.15)
      engine.gain.gain.setTargetAtTime(tone.gain, now, 0.12)
      reentryGain.gain.setTargetAtTime(Math.sin(Math.min(reentry, 1) * Math.PI) * 0.5, now, 0.08)
    },
    thunder() {
      if (!ctx || !master || !noise) return
      const source = ctx.createBufferSource()
      source.buffer = noise
      const filter = ctx.createBiquadFilter()
      filter.type = 'lowpass'
      filter.frequency.value = 180
      const gain = ctx.createGain()
      const now = ctx.currentTime
      gain.gain.setValueAtTime(0.0001, now)
      gain.gain.exponentialRampToValueAtTime(0.9, now + 0.08)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 3.5)
      source.connect(filter).connect(gain).connect(master)
      source.start(now)
      source.stop(now + 3.6)
    },
    toggleMute(): boolean {
      muted = !muted
      if (master && ctx) master.gain.setTargetAtTime(muted ? 0 : 1, ctx.currentTime, 0.05)
      return muted
    },
  }
}

function noiseBuffer(ctx: AudioContext): AudioBuffer {
  const seconds = 2
  const buffer = ctx.createBuffer(1, ctx.sampleRate * seconds, ctx.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
  return buffer
}

type Engine = { rumble: BiquadFilterNode; rumbleGain: GainNode; subGain: GainNode; crackleGain: GainNode; gain: GainNode }

function buildEngine(ctx: AudioContext, out: AudioNode, noise: AudioBuffer): Engine {
  const gain = ctx.createGain()
  gain.gain.value = 0.05
  const limiter = ctx.createDynamicsCompressor()
  limiter.threshold.value = -12
  limiter.ratio.value = 6
  gain.connect(limiter).connect(out)

  const looped = () => {
    const source = ctx.createBufferSource()
    source.buffer = noise
    source.loop = true
    source.start()
    return source
  }

  // body of the roar: noise with everything above ~100 Hz shaved off, shaking slowly in volume
  const rumble = ctx.createBiquadFilter()
  rumble.type = 'lowpass'
  rumble.frequency.value = 90
  rumble.Q.value = 1.2
  const rumbleGain = ctx.createGain()
  rumbleGain.gain.value = 0.5
  looped().connect(rumble).connect(rumbleGain).connect(gain)
  for (const [rate, depth] of [[0.6, 0.18], [2.3, 0.1], [7.1, 0.05]]) {
    const lfo = ctx.createOscillator()
    lfo.frequency.value = rate
    const lfoDepth = ctx.createGain()
    lfoDepth.gain.value = depth
    lfo.connect(lfoDepth).connect(rumbleGain.gain)
    lfo.start()
  }

  // sub-bass you feel more than hear, two tones beating slowly
  const subGain = ctx.createGain()
  subGain.gain.value = 0.25
  for (const frequency of [38, 46]) {
    const osc = ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.value = frequency
    osc.connect(subGain)
    osc.start()
  }
  subGain.connect(gain)

  // crackle: only the loudest peaks of the noise get through the shaper, so it pops instead of hissing
  const shaper = ctx.createWaveShaper()
  shaper.curve = crackleCurve()
  const crackleTone = ctx.createBiquadFilter()
  crackleTone.type = 'lowpass'
  crackleTone.frequency.value = 1600
  const crackleGain = ctx.createGain()
  crackleGain.gain.value = 0
  looped().connect(shaper).connect(crackleTone).connect(crackleGain).connect(gain)

  return { rumble, rumbleGain, subGain, crackleGain, gain }
}

function crackleCurve(): Float32Array<ArrayBuffer> {
  const samples = 1024
  const curve = new Float32Array(samples)
  const threshold = 0.9
  for (let i = 0; i < samples; i++) {
    const x = (i / (samples - 1)) * 2 - 1
    const over = Math.max(0, Math.abs(x) - threshold) / (1 - threshold)
    curve[i] = Math.sign(x) * over
  }
  return curve
}

function buildAmbient(ctx: AudioContext, out: AudioNode, noise: AudioBuffer) {
  const source = ctx.createBufferSource()
  source.buffer = noise
  source.loop = true
  const filter = ctx.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.value = 240
  const gain = ctx.createGain()
  gain.gain.value = 0.06
  const lfo = ctx.createOscillator()
  lfo.frequency.value = 0.07
  const depth = ctx.createGain()
  depth.gain.value = 0.03
  lfo.connect(depth).connect(gain.gain)
  source.connect(filter).connect(gain).connect(out)
  source.start()
  lfo.start()
}

function buildReentry(ctx: AudioContext, out: AudioNode, noise: AudioBuffer): GainNode {
  const source = ctx.createBufferSource()
  source.buffer = noise
  source.loop = true
  const filter = ctx.createBiquadFilter()
  filter.type = 'bandpass'
  filter.frequency.value = 900
  filter.Q.value = 0.6
  const gain = ctx.createGain()
  gain.gain.value = 0
  source.connect(filter).connect(gain).connect(out)
  source.start()
  return gain
}
