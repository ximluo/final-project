import { Group, Material, MathUtils, Mesh } from 'three'
import { sheet } from './paper'

const SPEED = 4.5

const BACK = 0.18
const RIDGE = 0.18

// An origami crane facing +x, with the wings hinged on the ridge of its back
const BODY = sheet(
  [
    BACK, RIDGE, 0, -BACK, RIDGE, 0, 0.38, 0, 0, -0.38, 0, 0, 0, -0.06, 0.14, 0, -0.06, -0.14,
    0.24, 0.126, 0.04, 0.24, 0.126, -0.04, 0.82, 0.54, 0, 1.04, 0.4, 0, 0.76, 0.45, 0,
    -0.24, 0.126, 0.04, -0.24, 0.126, -0.04, -0.87, 0.52, 0,
  ],
  [
    2, 0, 4, 0, 1, 4, 1, 3, 4, 2, 5, 0, 0, 5, 1, 1, 5, 3,
    2, 8, 6, 2, 7, 8, 8, 9, 10, 3, 11, 13, 3, 13, 12,
  ],
  () => true,
)

const WING = sheet([BACK, 0, 0, -BACK, 0, 0, 0.2, 0.03, 0.5, -0.02, 0, 1.1], [0, 2, 1, 2, 3, 1], () => true)

export class Crane extends Group {
  heading = 0
  private wings: Mesh[]

  constructor(paper: Material) {
    super()
    this.rotation.order = 'YXZ'
    this.scale.setScalar(1.3)
    this.wings = [1, -1].map((side) => {
      const wing = new Mesh(WING, paper)
      wing.position.y = RIDGE
      wing.scale.z = side
      return wing
    })
    const parts = [new Mesh(BODY, paper), ...this.wings]
    parts.forEach((part) => (part.castShadow = part.receiveShadow = true))
    this.add(...parts)
  }

  fly(dt: number, time: number, turn: number, climb: number, limit: number) {
    if (Math.hypot(this.position.x, this.position.z) > limit) {
      const home = Math.atan2(-this.position.z, -this.position.x)
      turn = Math.sign(Math.sin(home - this.heading))
    }
    this.heading += 1.4 * turn * dt
    this.position.x += SPEED * Math.cos(this.heading) * dt
    this.position.z += SPEED * Math.sin(this.heading) * dt
    this.position.y = MathUtils.clamp(this.position.y + 2 * climb * dt, 0.8, 7)

    this.rotation.set(MathUtils.lerp(this.rotation.x, 0.5 * turn, 3 * dt), -this.heading, 0.25 * climb)
    const flap = 0.2 + 0.6 * Math.sin(8 * time)
    this.wings[0].rotation.x = -flap
    this.wings[1].rotation.x = flap
  }
}
