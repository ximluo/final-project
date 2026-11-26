import { BackSide, BufferGeometry, Color, DoubleSide, Group, MathUtils, Mesh, ShaderMaterial, SphereGeometry, Vector3 } from 'three'
import { light, sheet } from './paper'
import { dome } from './rock'
import craftVertex from './shaders/craft.vert?raw'
import craftFragment from './shaders/craft.frag?raw'
import skyVertex from './shaders/sky.vert?raw'
import skyFragment from './shaders/sky.frag?raw'

const FAR = 400
const CLOUDS = 22
const MOONLIGHT = new Color(0xcdd4e6)
const STARLIGHT = new Color(0xe6dcc0)
const WHITE = new Color(0xffffff)
const sunColor = new Color()
const cloudColor = new Color()
const solid = { value: 1 }
const starlight = { value: 0 }

const uniforms = {
  ...light,
  zenithColor: { value: new Color() },
  middleColor: { value: new Color() },
  seed: { value: 0 },
}
const backdrop = new Mesh(
  new SphereGeometry(900, 48, 24),
  new ShaderMaterial({ uniforms, vertexShader: skyVertex, fragmentShader: skyFragment, side: BackSide, depthWrite: false }),
)

function craft(color: Color, opacity = solid) {
  return new ShaderMaterial({
    uniforms: { color: { value: color }, opacity },
    vertexShader: craftVertex,
    fragmentShader: craftFragment,
    side: DoubleSide,
    transparent: opacity !== solid,
    depthWrite: opacity === solid,
  })
}

const SHADOW = craft(new Color(0x000000), { value: 0.2 })
function shadowed(model: Mesh): Mesh {
  const shadow = new Mesh(model.geometry, SHADOW)
  shadow.position.set(0.09, -0.12, -0.5)
  shadow.frustumCulled = false
  return model.add(shadow)
}

// A pleated disc with a ring of folded rays
function sunburst(): BufferGeometry {
  const RAYS = 16
  const points = [0, 0, 0.18]
  const triangles: number[] = []
  for (let k = 0; k < 2 * RAYS; k++) {
    const angle = (k / RAYS) * Math.PI
    points.push(0.6 * Math.cos(angle), 0.6 * Math.sin(angle), k % 2 ? 0.1 : 0)
    triangles.push(0, 1 + k, 1 + ((k + 1) % (2 * RAYS)))
  }
  for (let ray = 0; ray < RAYS; ray++) {
    const angle = ((2 * ray + 1) / RAYS) * Math.PI
    const reach = ray % 2 ? 0.8 : 1
    const tip = points.length / 3
    points.push(reach * Math.cos(angle), reach * Math.sin(angle), 0)
    triangles.push(1 + 2 * ray, tip, 2 + 2 * ray, 2 + 2 * ray, tip, 1 + ((2 * ray + 2) % (2 * RAYS)))
  }
  return sheet(points, triangles, () => true)
}

// A crescent in segments with a ridge down its middle
function crescent(): BufferGeometry {
  const SEGMENTS = 9
  const points: number[] = []
  const triangles: number[] = []
  for (let i = 0; i <= SEGMENTS; i++) {
    const angle = (0.28 + (1.44 * i) / SEGMENTS) * Math.PI
    const width = 0.5 * Math.sin(Math.PI * (0.04 + (0.92 * i) / SEGMENTS))
    for (const [reach, lift] of [[1, 0], [1 - 0.35 * width, 0.4 * width], [1 - width, 0]]) {
      points.push(reach * Math.cos(angle), reach * Math.sin(angle), lift)
    }
    const a = 3 * i
    if (i < SEGMENTS) triangles.push(a, a + 3, a + 4, a, a + 4, a + 1, a + 1, a + 4, a + 5, a + 1, a + 5, a + 2)
  }
  return sheet(points, triangles, () => true)
}

// A four point star, each point folded down its middle
function star(): BufferGeometry {
  const points = [0, 0, 0.22]
  const triangles: number[] = []
  for (let k = 0; k < 8; k++) {
    const angle = (k / 4) * Math.PI
    const reach = k % 2 ? 0.26 : 1
    points.push(reach * Math.cos(angle), reach * Math.sin(angle), 0)
    triangles.push(0, 1 + k, 1 + ((k + 1) % 8))
  }
  return sheet(points, triangles, () => true)
}

// A cloud is a row of faceted puffs
function cloud(random: () => number): BufferGeometry {
  const points: number[] = []
  const triangles: number[] = []
  const puffs = 4 + Math.floor(3 * random())
  for (let i = 0; i < puffs; i++) {
    const across = i / (puffs - 1) - 0.5
    const size = 0.6 - 0.5 * Math.abs(across) + 0.2 * random()
    const puff = dome(random, 8, size, 0.3 * size, 1.1 * across, -0.4 * size)
    triangles.push(...puff.triangles.map((vertex) => vertex + points.length / 3))
    points.push(...puff.points)
  }
  return sheet(points, triangles, () => true).rotateX(Math.PI / 2)
}

const STAR = star()
const sun = shadowed(new Mesh(sunburst(), craft(sunColor)))
const moon = shadowed(new Mesh(crescent(), craft(MOONLIGHT)))
sun.scale.setScalar(34)
moon.scale.setScalar(26)
const stars = new Group()
export const clouds = new Group()
export const sky = new Group()
sky.add(backdrop, sun, moon, stars, clouds)
sky.traverse((part) => (part.frustumCulled = false))

function hang(model: Mesh, random: () => number, turn: number, low: number, high: number, size: number, distance: number) {
  const bearing = turn * Math.PI * 2
  const height = MathUtils.degToRad(low + (high - low) * random())
  model.position.set(Math.cos(height) * Math.cos(bearing), Math.sin(height), Math.cos(height) * Math.sin(bearing)).multiplyScalar(distance)
  model.lookAt(0, 0, 0)
  model.scale.setScalar(size)
  model.frustumCulled = false
}

export function scatter(random: () => number) {
  clouds.children.forEach((model) => (model as Mesh).geometry.dispose())
  clouds.clear()
  stars.clear()
  for (let i = 0; i < CLOUDS; i++) {
    const model = new Mesh(cloud(random), craft(cloudColor))
    hang(model, random, (i + random()) / CLOUDS, 5, 18, 20 + 15 * random(), 0.75 * FAR)
    const shadow = new Mesh(model.geometry, SHADOW)
    shadow.position.copy(model.position).multiplyScalar(2)
    shadow.quaternion.copy(model.quaternion)
    shadow.scale.copy(model.scale).multiplyScalar(2)
    shadow.translateX(0.09 * shadow.scale.x).translateY(-0.12 * shadow.scale.x)
    shadow.frustumCulled = false
    clouds.add(model, shadow)
  }
  for (let i = 0; i < 320; i++) {
    const model = new Mesh(STAR, craft(STARLIGHT, starlight))
    hang(model, random, random(), 4, 80, 1.2 + 2.6 * random(), 1.1 * FAR)
    model.rotateZ(random() * Math.PI)
    stars.add(model)
  }
}

const WEST = new Vector3(-0.4, 0, -0.92).normalize()
const other = new Color()
const toSun = new Vector3()

// Sun and moon position and every sky and light color for an hour of the day
export function daylight(hour: number, seed: number): number {
  const turn = ((hour - 6) / 12) * Math.PI
  toSun.copy(WEST).multiplyScalar(-Math.cos(turn)).setY(Math.sin(turn))
  const height = MathUtils.radToDeg(Math.asin(toSun.y))

  sun.position.copy(toSun).multiplyScalar(FAR)
  moon.position.copy(toSun).multiplyScalar(-FAR)
  sun.lookAt(sky.position)
  moon.lookAt(sky.position)

  const noon = MathUtils.smoothstep(height, 8, 50)
  const night = MathUtils.smoothstep(-height, 0, 12)
  const blend = (color: Color, dark: number, golden: number, bright: number, strength = 1) =>
    color.set(golden).lerp(other.set(bright), noon).lerp(other.set(dark), night).multiplyScalar(strength)

  const risen = MathUtils.smoothstep(Math.abs(height), 0, 5)
  light.lightDirection.value.copy(toSun).multiplyScalar(height > 0 ? 1 : -1)
  if (height > 0) light.lightColor.value.set(0xffdba8).lerp(other.set(0xfff4e2), noon).multiplyScalar(risen * (2.2 - 1.1 * noon))
  else light.lightColor.value.set(0xb9c8ff).multiplyScalar(0.45 * risen)

  blend(light.skyColor.value, 0x3d4f9c, 0xa9b8e0, 0xc4d8ff, 0.7 - 0.15 * noon - 0.35 * night)
  blend(light.bounceColor.value, 0x1c2c6e, 0x3558c8, 0x5f86e0, 0.4)
  blend(light.hazeColor.value, 0x1b2552, 0xf7d3ae, 0xd3e6f4)
  blend(uniforms.zenithColor.value, 0x0a1034, 0x5b86cf, 0x3d84e0)
  blend(uniforms.middleColor.value, 0x141d4a, 0xeeb4a4, 0x9cc4ee)
  cloudColor.copy(uniforms.middleColor.value).lerp(other.set(0x8fa6ff).lerp(WHITE, 1 - night), 0.6 - 0.3 * night)
  sunColor.set(0xffe6cf).lerp(other.set(0xffffff), noon)
  starlight.value = night
  stars.visible = night > 0
  uniforms.seed.value = seed % 100
  return height
}
