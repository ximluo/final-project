import {
  DirectionalLight,
  Group,
  MathUtils,
  Mesh,
  NeutralToneMapping,
  PerspectiveCamera,
  Scene,
  Vector3,
  WebGLRenderer,
} from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import GUI from 'lil-gui'
import { bloom } from './bloom'
import { Crane } from './crane'
import { Koi } from './fish'
import { Flower } from './flower'
import { pad } from './pad'
import { light, paperMaterial } from './paper'
import { mulberry32 } from './random'
import { land, rock } from './rock'
import { clouds, daylight, scatter, sky } from './sky'
import { pond, Ripples } from './water'

const POND = 18
const SHORE = 26
const ROCKS = 120
const BLUE = 0x2b4fd6
const REACH = 1.7
const SPEED = 5
const SHADOWS = 20

const params = {
  seed: 1,
  flowers: 14,
  petals: 8,
  rings: 2,
  leaves: 36,
  fish: 4,
  foldDepth: 0.9,
  autoBloom: true,
  fold: 0.4,
  bloomDistance: 16,
  time: 16,
  dayCycle: true,
  dayLength: 60,
  fly: false,
  newSeed: () => {
    params.seed = Math.floor(Math.random() * 10000)
    gui.controllersRecursive().forEach((c) => c.updateDisplay())
    generate()
    frame()
  },
}

const renderer = new WebGLRenderer({ antialias: true })
renderer.setPixelRatio(window.devicePixelRatio)
renderer.shadowMap.enabled = true
renderer.toneMapping = NeutralToneMapping
document.body.appendChild(renderer.domElement)

const scene = new Scene()
const camera = new PerspectiveCamera(45, 1, 0.2, 2000)
const controls = new OrbitControls(camera, renderer.domElement)
controls.enablePan = false
controls.minDistance = 1.5
controls.maxDistance = 14
controls.maxPolarAngle = 1.55

const sun = new DirectionalLight()
sun.castShadow = true
sun.shadow.mapSize.set(4096, 4096)
sun.shadow.camera.left = -SHADOWS
sun.shadow.camera.right = SHADOWS
sun.shadow.camera.far = 80
sun.shadow.bias = -0.0004
sun.shadow.radius = 2

const whitePaper = paperMaterial(0xf6f4ee)
const greenPapers = [0x5fa83a, 0x7dbb4a, 0x4b9440].map((color) => paperMaterial(color))
const koiPapers = [0xf26a1b, 0xe5402a, 0xf6f4ee, 0xf4b12e].map((color) => paperMaterial(color))
const greyPapers = [0x8d93a3, 0x7b8294, 0x9aa0ad].map((color) => paperMaterial(color))
const meadowPaper = paperMaterial(0x8cab6b)

const flowers = new Group()
const pads = new Group()
const school = new Group()
const rocks = new Group()
const crane = new Crane(whitePaper)
crane.visible = false
let ripples = new Ripples(params.petals, 0, BLUE)
scene.add(sky, pond(paperMaterial(BLUE)), ripples, flowers, pads, school, rocks, crane, sun, sun.target)

let taken: { x: number; z: number; radius: number }[] = []

function isClear(x: number, z: number, radius: number): boolean {
  return taken.every((spot) => Math.hypot(x - spot.x, z - spot.z) > radius + spot.radius)
}

function generate() {
  const random = mulberry32(params.seed)
  const pick = <T>(list: T[]) => list[Math.floor(random() * list.length)]
  const anywhere = () => {
    const angle = random() * Math.PI * 2
    const distance = POND * Math.sqrt(random())
    return [distance * Math.cos(angle), distance * Math.sin(angle)]
  }

  taken = []
  school.clear()
  flowers.children.forEach((flower) => (flower as Flower).geometry.dispose())
  flowers.clear()
  const pattern = bloom(params.petals, params.rings)
  for (let tries = 0; tries < 600 && flowers.children.length < params.flowers; tries++) {
    const [x, z] = anywhere()
    const size = 1.05 + 0.9 * random()
    const spin = random() * Math.PI * 2
    const lane = flowers.children.length < params.fish ? 2.4 : 0
    if (!isClear(x, z, size * REACH + lane)) continue

    const flower = new Flower(pattern, whitePaper)
    flower.position.set(x, 0, z)
    flower.rotation.y = spin
    flower.scale.setScalar(size)
    flowers.add(flower)
    taken.push({ x, z, radius: size * REACH + lane })
    if (lane) school.add(new Koi({ x, z, radius: size * REACH + 1.2 }, random, pick(koiPapers), pick(koiPapers)))
  }

  pads.children.forEach((leaf) => (leaf as Mesh).geometry.dispose())
  pads.clear()
  for (let tries = 0; tries < 3000 && pads.children.length < params.leaves; tries++) {
    const size = 0.6 + 0.75 * random()
    const spin = random() * Math.PI * 2
    let [x, z] = anywhere()
    if (random() < 0.75) {
      const home = taken[Math.floor(random() * flowers.children.length)]
      const distance = home.radius + size * (1 + 2 * random())
      x = home.x + distance * Math.cos(spin)
      z = home.z + distance * Math.sin(spin)
    }
    if (!isClear(x, z, 0.9 * size)) continue

    const leaf = new Mesh(pad(random), pick(greenPapers))
    leaf.position.set(x, 0, z)
    leaf.rotation.y = spin
    leaf.scale.setScalar(size)
    leaf.castShadow = leaf.receiveShadow = true
    pads.add(leaf)
    taken.push({ x, z, radius: 0.9 * size })
  }

  rocks.children.forEach((boulder) => (boulder as Mesh).geometry.dispose())
  rocks.clear()
  const bays = [random() * Math.PI * 2, random() * Math.PI * 2]
  const coast = (angle: number) => SHORE + 1.5 * Math.sin(3 * angle + bays[0]) + Math.sin(7 * angle + bays[1])
  rocks.add(new Mesh(land(random, coast), meadowPaper))
  for (let k = 0; k < ROCKS; k++) {
    const small = k % 2 === 1
    const angle = random() * Math.PI * 2
    const distance = coast(angle) + (small ? 2.5 * random() - 0.5 : 3 + 4 * random())
    const width = small ? 0.5 + 1.5 * random() : 2.5 + 4.5 * random()
    const boulder = new Mesh(rock(random, width, width * (0.35 + 0.3 * random())), pick(greyPapers))
    boulder.position.set(distance * Math.cos(angle), 0.05, distance * Math.sin(angle))
    boulder.rotation.y = random() * Math.PI * 2
    rocks.add(boulder)
  }
  rocks.children.forEach((part) => (part.receiveShadow = true))
  scatter(random)

  scene.remove(ripples)
  ripples.geometry.dispose()
  ripples.material.dispose()
  ripples = new Ripples(params.petals, flowers.children.length, BLUE)
  scene.add(ripples)
  sunlight()
}

function frame() {
  const hero = flowers.children.reduce((best, flower) => (flower.position.length() < best.position.length() ? flower : best))
  controls.target.copy(hero.position).add(new Vector3(-1, 1, -1.5))
  camera.position.copy(hero.position).add(new Vector3(1.4, 1.7, 6.5))
}

let sunHeight = 0
function sunlight() {
  sunHeight = daylight(params.time, params.seed)
  sun.shadow.camera.top = SHADOWS * light.lightDirection.value.y + 2
  sun.shadow.camera.bottom = -sun.shadow.camera.top
  sun.shadow.camera.updateProjectionMatrix()
}

const keys = new Set<string>()
window.addEventListener('keydown', (event) => keys.add(event.code))
window.addEventListener('keyup', (event) => keys.delete(event.code))
const held = (...codes: string[]) => Number(codes.some((code) => keys.has(code)))
const forward = new Vector3()
const step = new Vector3()

function glide(dt: number) {
  const ahead = held('KeyW', 'ArrowUp') - held('KeyS', 'ArrowDown')
  const aside = held('KeyD', 'ArrowRight') - held('KeyA', 'ArrowLeft')
  forward.subVectors(controls.target, camera.position).setY(0).normalize()
  step.set(forward.x * ahead - forward.z * aside, 0, forward.z * ahead + forward.x * aside).multiplyScalar(SPEED * dt)
  if (Math.hypot(controls.target.x + step.x, controls.target.z + step.z) > SHORE - 6) return
  controls.target.add(step)
  camera.position.add(step)
}

function takeOff() {
  crane.visible = params.fly
  controls.enabled = !params.fly
  if (params.fly) {
    forward.subVectors(controls.target, camera.position)
    crane.heading = Math.atan2(forward.z, forward.x)
    crane.position.copy(controls.target).setY(2)
  } else controls.target.copy(crane.position).setY(1)
}

function chase(dt: number, time: number) {
  const climb = held('KeyW', 'ArrowUp') - held('KeyS', 'ArrowDown')
  const turn = held('KeyD', 'ArrowRight') - held('KeyA', 'ArrowLeft')
  crane.fly(dt, time, turn, climb, SHORE - 10)
  step.set(-6 * Math.cos(crane.heading), 2.2, -6 * Math.sin(crane.heading)).add(crane.position)
  camera.position.lerp(step, 1 - Math.exp(-3 * dt))
  camera.lookAt(crane.position)
}

// Flowers near the viewer ease open, far ones shut, and all of them close at night
function bloomNearby(dt: number, viewer: Vector3) {
  flowers.children.forEach((child, i) => {
    const flower = child as Flower
    const away = Math.hypot(flower.position.x - viewer.x, flower.position.z - viewer.z)
    const awake = MathUtils.smoothstep(sunHeight, -2, 6)
    const target = params.autoBloom ? awake * (1 - MathUtils.smoothstep(away, 0.5 * params.bloomDistance, params.bloomDistance)) : 1
    flower.open += (target - flower.open) * (1 - Math.exp(-3 * dt))
    flower.fold(params.foldDepth * MathUtils.lerp(1, params.fold, flower.open))

    const size = flower.scale.x
    const outer = MathUtils.lerp(0.8, REACH, flower.open) * size
    ripples.set(i, flower.position.x, flower.position.z, flower.rotation.y, 0.8 * size, outer, 0.022 * size * flower.open)
  })
}

const gui = new GUI()
gui.add(params, 'seed', 0, 9999, 1).onChange(() => {
  generate()
  frame()
})
gui.add(params, 'newSeed').name('new seed')
gui.add(params, 'flowers', 1, 30, 1).onChange(generate)
gui.add(params, 'petals', 5, 12, 1).onFinishChange(generate)
gui.add(params, 'rings', 1, 3, 1).onFinishChange(generate)
gui.add(params, 'leaves', 0, 80, 1).onChange(generate)
gui.add(params, 'fish', 0, 8, 1).onChange(generate)
gui.add(params, 'foldDepth', 0.1, 1).name('fold depth')
gui.add(params, 'autoBloom').name('auto bloom')
gui.add(params, 'fold', 0, 1)
gui.add(params, 'bloomDistance', 4, 24).name('bloom distance')
gui.add(params, 'time', 0, 24, 0.1).decimals(1).listen().onChange(sunlight)
gui.add(params, 'dayCycle').name('day cycle')
gui.add(params, 'dayLength', 10, 300, 1).name('day length')
gui.add(params, 'fly').onChange(takeOff)
gui.add(light.weight, 'value', 0, 1).name('paper weight')

function resize() {
  renderer.setSize(window.innerWidth, window.innerHeight)
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
}
window.addEventListener('resize', resize)
resize()

generate()
frame()
let last = 0
let nextWake = 0
renderer.setAnimationLoop((ms) => {
  const time = ms / 1000
  const dt = Math.min(time - last, 0.1)
  last = time
  light.time.value = time
  if (params.dayCycle) {
    params.time = (params.time + ((sunHeight < 0 ? 48 : 16) * dt) / params.dayLength) % 24
    sunlight()
  }

  if (params.fly) chase(dt, time)
  else {
    glide(dt)
    controls.update()
  }
  const focus = params.fly ? crane.position : controls.target
  const out = Math.hypot(camera.position.x, camera.position.z) / (SHORE - 4.5)
  if (out > 1) {
    camera.position.x /= out
    camera.position.z /= out
    camera.lookAt(focus)
  }
  sky.position.copy(camera.position)
  clouds.rotation.y = 0.004 * time
  sun.target.position.copy(focus)
  sun.position.copy(focus).addScaledVector(light.lightDirection.value, 40)

  bloomNearby(dt, params.fly ? crane.position : camera.position)
  school.children.forEach((koi) => (koi as Koi).swim(time))
  if (time > nextWake) {
    nextWake = time + 1.2
    school.children.forEach((koi) => ripples.wake(koi.position.x, koi.position.z, koi.rotation.y, time))
  }
  ripples.spread(time)
  renderer.render(scene, camera)
})
