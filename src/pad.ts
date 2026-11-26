import { sheet } from './paper'

const SIDES = 10
const NOTCH = 0.6

// A lily pad: a shallow dish with a notch and a lifted rim
export function pad(random: () => number) {
  const points = [0.2 * (random() - 0.5), 0, 0.2 * (random() - 0.5)]
  const triangles: number[] = []
  for (let k = 0; k <= SIDES; k++) {
    const angle = NOTCH / 2 + (k / SIDES) * (2 * Math.PI - NOTCH)
    const radius = 0.93 + 0.07 * random()
    const rib = k % 2
    const curl = k === 0 || k === SIDES ? 0.08 : 0
    points.push(0.55 * radius * Math.cos(angle), 0.03 + 0.03 * rib, 0.55 * radius * Math.sin(angle))
    points.push(radius * Math.cos(angle), 0.12 + 0.05 * rib + curl + 0.03 * random(), radius * Math.sin(angle))
    if (k === SIDES) break
    const inner = 1 + 2 * k
    triangles.push(0, inner, inner + 2, inner, inner + 1, inner + 3, inner, inner + 3, inner + 2)
  }
  return sheet(points, triangles, () => true)
}
