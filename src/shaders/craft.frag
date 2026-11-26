uniform vec3 color;
uniform float opacity;

varying vec3 vView;

void main() {
  vec3 normal = normalize(cross(dFdx(vView), dFdy(vView)));
  float lit = max(dot(normal, normalize(vec3(-0.45, 0.6, 0.66))), 0.0);
  gl_FragColor = vec4(color * (0.62 + 0.5 * lit), opacity);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
