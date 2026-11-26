#include <common>
#include <shadowmap_pars_vertex>

attribute vec2 sheet;
attribute vec3 folds;
attribute vec3 cuts;

varying vec3 vWorld;
varying vec2 vSheet;
varying vec3 vFolds;
varying vec3 vCuts;

void main() {
  vec4 worldPosition = modelMatrix * vec4(position, 1.0);
  vec4 mvPosition = viewMatrix * worldPosition;
  gl_Position = projectionMatrix * mvPosition;
  #include <shadowmap_vertex>

  vWorld = worldPosition.xyz;
  vSheet = sheet;
  vFolds = folds;
  vCuts = cuts;
}
