const TWO_PI = Math.PI * 2

export function turnToward(heading: number, desired: number, maxTurn: number): number {
  const diff = ((((desired - heading + Math.PI) % TWO_PI) + TWO_PI) % TWO_PI) - Math.PI
  return heading + Math.min(Math.max(diff, -maxTurn), maxTurn)
}
