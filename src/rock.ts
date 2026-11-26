import { sheet } from './paper'

// A faceted dome: a base ring, a shoulder ring and a peak
export function dome(random: () => number, sides: number, width: number, height: number, x = 0, z = 0) {
  const points: number[] = []
  const ring = (radius: number, low: number, high: number) => {
    for (let k = 0; k < sides; k++) {
      const angle = ((k + 0.6 * (random() - 0.5)) / sides) * Math.PI * 2
      const reach = radius * (0.8 + 0.4 * random())
      points.push(x + reach * Math.cos(angle), low + (high - low) * random(), z + reach * Math.sin(angle))
    }
  }
  ring(width / 2, -0.05, -0.05)
  ring(width / 2.6, 0.5 * height, 0.85 * height)
  points.push(x + 0.3 * width * (random() - 0.5), height, z + 0.3 * width * (random() - 0.5))

  const triangles: number[] = []
  for (let k = 0; k < sides; k++) {
    const next = (k + 1) % sides
    triangles.push(k, next, sides + next, k, sides + next, sides + k, sides + k, sides + next, 2 * sides)
  }
  return { points, triangles }
}

export function rock(random: () => number, width: number, height: number) {
  const { points, triangles } = dome(random, 6, width, height)
  return sheet(points, triangles, () => true)
}

const SEGMENTS = 64
const RINGS = [[0, -0.05, -0.05], [0.6, 0.04, 0.04], [10, 0.04, 0.04], [20, 1, 3.5], [48, 1.5, 5], [600, 3, 3]]

// The land: a flat shelf at the waterline, then rings that rise into hills
export function land(random: () => number, coast: (angle: number) => number) {
  const points: number[] = []
  const triangles: number[] = []
  RINGS.forEach(([past, low, high], ring) => {
    for (let k = 0; k < SEGMENTS; k++) {
      const angle = ((k + 0.6 * (random() - 0.5)) / SEGMENTS) * Math.PI * 2
      const reach = coast(angle) + past
      points.push(reach * Math.cos(angle), low + (high - low) * random(), reach * Math.sin(angle))
      if (ring === 0) continue
      const a = (ring - 1) * SEGMENTS + k
      const b = (ring - 1) * SEGMENTS + ((k + 1) % SEGMENTS)
      triangles.push(a, b, b + SEGMENTS, a, b + SEGMENTS, a + SEGMENTS)
    }
  })
  return sheet(points, triangles, () => true)
}
