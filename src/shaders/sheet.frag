#include <common>
#include <bsdfs>
#include <lights_pars_begin>
#include <shadowmap_pars_fragment>
#include <shadowmask_pars_fragment>
#include <paper>

uniform vec3 color;

varying vec3 vWorld;
varying vec2 vSheet;
varying vec3 vFolds;
varying vec3 vCuts;

float line(vec3 edges, float width) {
  vec3 close = (1.0 - smoothstep(0.0, width, edges)) * min(width / (fwidth(edges) + 1e-6), 1.0);
  return max(close.x, max(close.y, close.z));
}

void main() {
  vec3 view = normalize(cameraPosition - vWorld);
  vec3 normal = normalize(cross(dFdx(vWorld), dFdy(vWorld)));
  if (dot(normal, view) < 0.0) normal = -normal;

  float width = mix(0.008, 0.024, weight);
  vec3 result = paper(color, normal, view, vSheet, line(vFolds, width), line(vCuts, width), getShadowMask());

  float reach = length(cameraPosition.xz - vWorld.xz);
  result = mix(result, hazeColor, 1.0 - exp(-pow(reach / 80.0, 1.6)));

  gl_FragColor = vec4(result, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
