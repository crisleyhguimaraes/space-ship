import { Quaternion, Vector3 } from 'three'

export const FLIGHT = {
  accel: 25,
  maxSpeed: 30,
  boostMultiplier: 3,
  drag: 0.8,
  rollRate: 1.8,
}

export type FlightInput = {
  throttle: -1 | 0 | 1
  roll: -1 | 0 | 1
  yaw: number
  pitch: number
  boost: boolean
}

export type FlightState = {
  position: Vector3
  quaternion: Quaternion
  speed: number
}

const AXIS_X = new Vector3(1, 0, 0)
const AXIS_Y = new Vector3(0, 1, 0)
const AXIS_Z = new Vector3(0, 0, 1)
const spin = new Quaternion()
const heading = new Vector3()

export function createFlight(): FlightState {
  return { position: new Vector3(), quaternion: new Quaternion(), speed: 0 }
}

export function forwardOf(s: FlightState, target = new Vector3()): Vector3 {
  return target.set(0, 0, -1).applyQuaternion(s.quaternion)
}

export function stepFlight(s: FlightState, input: FlightInput, dt: number): void {
  const burst = input.boost ? FLIGHT.boostMultiplier : 1
  const cap = FLIGHT.maxSpeed * burst
  if (input.throttle === 0 || s.speed > cap) s.speed *= Math.exp(-FLIGHT.drag * dt)
  else s.speed = clamp(s.speed + input.throttle * FLIGHT.accel * burst * dt, 0, cap)

  s.quaternion.multiply(spin.setFromAxisAngle(AXIS_Y, input.yaw))
  s.quaternion.multiply(spin.setFromAxisAngle(AXIS_X, input.pitch))
  s.quaternion.multiply(spin.setFromAxisAngle(AXIS_Z, input.roll * FLIGHT.rollRate * dt))
  s.quaternion.normalize()

  s.position.addScaledVector(forwardOf(s, heading), s.speed * dt)
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.min(Math.max(v, lo), hi)
}
