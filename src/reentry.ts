import { Effect } from 'postprocessing'
import { Uniform } from 'three'

const fragment = /* glsl */ `
uniform float uProgress;
uniform float uTime;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
}

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  float p = uProgress;
  float heat = smoothstep(0.0, 0.35, p) * (1.0 - smoothstep(0.5, 0.75, p));
  float white = smoothstep(0.3, 0.5, p) * (1.0 - smoothstep(0.5, 0.85, p));
  float blur = smoothstep(0.15, 0.5, p) * (1.0 - smoothstep(0.5, 0.95, p));

  vec3 color = inputColor.rgb;
  if (blur > 0.001) {
    vec2 toCenter = (0.5 - uv) * 0.14 * blur;
    color = vec3(0.0);
    for (int i = 0; i < 8; i++) color += texture2D(inputBuffer, uv + toCenter * (float(i) / 7.0)).rgb;
    color /= 8.0;
  }

  float edge = smoothstep(0.22, 0.8, length(uv - 0.5));
  float streaks = vnoise(vec2(uv.x * 48.0, uv.y * 3.0 - uTime * 7.0));
  vec3 fire = mix(vec3(1.0, 0.3, 0.04), vec3(1.0, 0.8, 0.45), streaks);
  color += fire * edge * heat * (0.4 + streaks) * 1.4;
  color = mix(color, vec3(1.0, 0.96, 0.9), white);
  outputColor = vec4(color, inputColor.a);
}
`

export class ReentryEffect extends Effect {
  constructor() {
    super('ReentryEffect', fragment, {
      uniforms: new Map([
        ['uProgress', new Uniform(0)],
        ['uTime', new Uniform(0)],
      ]),
    })
  }

  set progress(value: number) {
    this.uniforms.get('uProgress')!.value = value
  }

  set time(value: number) {
    this.uniforms.get('uTime')!.value = value
  }
}
