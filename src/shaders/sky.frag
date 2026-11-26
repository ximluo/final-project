#include <paper>

uniform vec3 zenithColor;
uniform vec3 middleColor;
uniform float seed;

varying vec3 vDirection;

const float BANDS = 8.0;

// Strips of paper from the horizon up, each shading the strip behind it
void main() {
  vec3 direction = normalize(vDirection);
  vec2 at = vec2(atan(direction.x, direction.z), direction.y);

  float strip = sqrt(clamp(2.0 * at.y, 0.0, 1.0)) * BANDS + 0.3 * noise(2.0 * vec2(cos(at.x), sin(at.x)) + seed);
  float up = min(floor(strip) / (BANDS - 1.0), 1.0);
  vec3 color = mix(mix(hazeColor, middleColor, min(2.0 * up, 1.0)), zenithColor, max(2.0 * up - 1.0, 0.0));
  color *= 1.0 - 0.08 * step(1.0, strip) * (1.0 - smoothstep(0.0, 0.2, fract(strip)));

  color *= 0.97 + 0.06 * noise(at * 900.0);
  gl_FragColor = vec4(color, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
