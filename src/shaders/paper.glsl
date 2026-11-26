uniform vec3 lightDirection;
uniform vec3 lightColor;
uniform vec3 skyColor;
uniform vec3 bounceColor;
uniform vec3 hazeColor;
uniform float weight;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
    f.y
  );
}

float grain(vec2 sheet) {
  return 0.6 * noise(sheet * vec2(44.0, 9.0)) + 0.4 * noise(sheet * 120.0);
}

// A thin sheet: the side facing the light reflects, the other side glows with what gets through
vec3 paper(vec3 color, vec3 normal, vec3 view, vec2 sheet, float fold, float cut, float shadow) {
  float fiber = grain(sheet);
  float through = mix(0.6, 0.05, weight);
  float facing = dot(normal, lightDirection);

  shadow = mix(shadow, 1.0, 0.5 * through);
  vec3 lit = lightColor * max(facing, 0.0) * (0.9 + 0.2 * noise(sheet * 2.5));
  vec3 glow = lightColor * vec3(1.0, 0.9, 0.75) * max(-facing, 0.0) * through * (0.75 + 0.5 * fiber);
  vec3 ambient = mix(bounceColor, skyColor, 0.5 + 0.5 * normal.y);
  vec3 total = (lit + glow) * shadow + ambient;

  vec3 result = color * (0.88 + 0.12 * fiber) * total * (1.0 - 0.28 * fold);
  result = mix(result, 0.85 * (ambient + 0.5 * (lit + glow) * shadow), 0.6 * cut);
  float sheen = pow(1.0 - abs(dot(normal, view)), 5.0);
  return result + 0.12 * sheen * hazeColor;
}
