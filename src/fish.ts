import { Group, Material, Mesh } from 'three'
import { sheet } from './paper'

export type Lane = { x: number; z: number; radius: number }

// A koi facing +x: a tent folded along the spine with a fin on each side
const BODY = sheet(
  [
    0.6, 0.03, 0, 0.38, 0.12, 0, 0.08, 0.16, 0, -0.4, 0.07, 0,
    0.44, 0, 0.09, 0.14, 0, 0.14, -0.16, 0.02, 0.08, -0.14, 0, 0.27,
    0.44, 0, -0.09, 0.14, 0, -0.14, -0.16, 0.02, -0.08, -0.14, 0, -0.27,
  ],
  [
    0, 1, 4, 1, 5, 4, 1, 2, 5, 2, 6, 5, 2, 3, 6, 5, 6, 7,
    0, 8, 1, 1, 8, 9, 1, 9, 2, 2, 9, 10, 2, 10, 3, 9, 11, 10,
  ],
  () => true,
)

const TAIL = sheet([0, 0.07, 0, -0.32, 0.1, 0, -0.46, 0.12, 0.24, -0.46, 0.12, -0.24], [0, 1, 2, 0, 3, 1], () => true)

export class Koi extends Group {
  private tail: Mesh
  private phase: number
  private speed: number

  constructor(private lane: Lane, random: () => number, body: Material, tail: Material) {
    super()
    this.phase = random() * Math.PI * 2
    this.speed = (0.6 + 0.5 * random()) * (random() < 0.5 ? 1 : -1)
    this.scale.setScalar(0.9 + 0.45 * random())

    this.tail = new Mesh(TAIL, tail)
    this.tail.position.x = -0.4
    const parts = [new Mesh(BODY, body), this.tail]
    parts.forEach((part) => (part.castShadow = part.receiveShadow = true))
    this.add(...parts)
  }

  swim(time: number) {
    const angle = this.phase + (this.speed * time) / this.lane.radius
    const beat = time * 5 + this.phase
    this.position.set(this.lane.x + this.lane.radius * Math.cos(angle), 0, this.lane.z + this.lane.radius * Math.sin(angle))
    const turn = Math.sign(this.speed)
    this.rotation.y = Math.atan2(-turn * Math.cos(angle), -turn * Math.sin(angle)) + 0.1 * Math.sin(beat)
    this.tail.rotation.y = 0.5 * Math.sin(beat - 1)
  }
}
