#include <common>
#include <shadowmap_pars_vertex>

attribute vec3 folds;
attribute vec3 place;
attribute vec3 wave;

varying vec3 vWorld;
varying vec2 vSheet;
varying vec3 vFolds;
varying vec3 vCuts;

// position holds a polygon corner in xz and the ring number in y
void main() {
  float ring = position.y;
  float radius = mix(wave.x, wave.y, ring / RINGS);
  float height = wave.z * mod(ring, 2.0) * sin(PI * ring / RINGS);
  float c = cos(place.z);
  float s = sin(place.z);
  vec2 corner = mat2(c, -s, s, c) * position.xz * radius;

  vec4 worldPosition = vec4(place.x + corner.x, height, place.y + corner.y, 1.0);
  vec4 mvPosition = viewMatrix * worldPosition;
  gl_Position = projectionMatrix * mvPosition;
  #include <shadowmap_vertex>

  vWorld = worldPosition.xyz;
  vSheet = worldPosition.xz;
  vFolds = folds * (wave.y - wave.x) / RINGS * max(1.0, 0.02 / (wave.z + 1e-5));
  vCuts = vec3(1000.0);
}
