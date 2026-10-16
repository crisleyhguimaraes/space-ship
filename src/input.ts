import type { FlightInput } from './flight.ts'

const SENSITIVITY = 0.0022
const MAX_TURN_PER_FRAME = 0.08
const KEY_TURN_RATE = 1.4

export type Commands = { flight: FlightInput; land: boolean }

export function createInput(canvas: HTMLCanvasElement) {
  const keys = new Set<string>()
  let yaw = 0
  let pitch = 0
  let landPressed = false

  window.addEventListener('keydown', (e) => {
    keys.add(e.code)
    if (e.code === 'KeyE') landPressed = true
  })
  window.addEventListener('keyup', (e) => keys.delete(e.code))
  window.addEventListener('blur', () => keys.clear())
  window.addEventListener('mousemove', (e) => {
    if (document.pointerLockElement !== canvas) return
    yaw -= e.movementX * SENSITIVITY
    pitch -= e.movementY * SENSITIVITY
  })

  canvas.addEventListener('click', () => canvas.requestPointerLock())

  return {
    lock: () => canvas.requestPointerLock(),
    get locked() {
      return document.pointerLockElement === canvas
    },
    consume(dt: number): Commands {
      const keyTurn = KEY_TURN_RATE * dt
      yaw += axis(keys, 'ArrowLeft', 'ArrowRight') * keyTurn
      pitch += axis(keys, 'ArrowUp', 'ArrowDown') * keyTurn
      const flight: FlightInput = {
        throttle: keys.has('KeyW') ? 1 : keys.has('KeyS') ? -1 : 0,
        roll: keys.has('KeyA') ? 1 : keys.has('KeyD') ? -1 : 0,
        yaw: clamp(yaw, -MAX_TURN_PER_FRAME, MAX_TURN_PER_FRAME),
        pitch: clamp(pitch, -MAX_TURN_PER_FRAME, MAX_TURN_PER_FRAME),
        boost: keys.has('ShiftLeft') || keys.has('ShiftRight'),
      }
      const land = landPressed
      yaw = 0
      pitch = 0
      landPressed = false
      return { flight, land }
    },
  }
}

export const IDLE: FlightInput = { throttle: 0, roll: 0, yaw: 0, pitch: 0, boost: false }

function axis(keys: Set<string>, positive: string, negative: string): number {
  return (keys.has(positive) ? 1 : 0) - (keys.has(negative) ? 1 : 0)
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.min(Math.max(v, lo), hi)
}
