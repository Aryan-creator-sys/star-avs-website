import { useEffect, useRef } from "react";
import * as THREE from "three";
import { gsap } from "../lib/gsap";

/**
 * InteractiveParticles — a cursor-reactive particle field for the hero, adapted
 * from Bruno Imbrizi's "interactive-particles" technique
 * (github.com/brunoimbrizi/interactive-particles, MIT):
 *   • a source image is sampled pixel-by-pixel; bright pixels become particles
 *   • an instanced RawShaderMaterial displaces + sizes each particle, with an
 *     intro "assemble" animation (uSize / uRandom / uDepth tween in)
 *   • a TouchTexture (a small canvas trail of soft radial blobs) is fed to the
 *     shader so particles scatter away from the pointer
 * Themed for Star AV: the field reads as cool silver on the dark stage and
 * ignites RED where the cursor moves (and in the bright central node).
 *
 * Swap the look by dropping a different image at `src` (any bright-on-black
 * artwork works — e.g. the teal soundwave). Sampling keeps pixels whose
 * luminance clears a threshold; `step` controls particle density.
 */

const VERT = /* glsl */ `
precision highp float;
attribute float pindex;
attribute vec3 position;
attribute vec3 offset;
attribute vec2 uv;
attribute float angle;
uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform float uTime;
uniform float uRandom;
uniform float uDepth;
uniform float uSize;
uniform vec2 uTextureSize;
uniform sampler2D uTexture;
uniform sampler2D uTouch;
varying vec2 vPUv;
varying vec2 vUv;
varying float vTouch;
varying float vGrey;

vec3 mod289(vec3 x){return x - floor(x*(1.0/289.0))*289.0;}
vec2 mod289(vec2 x){return x - floor(x*(1.0/289.0))*289.0;}
vec3 permute(vec3 x){return mod289(((x*34.0)+1.0)*x);}
float snoise2(vec2 v){
  const vec4 C = vec4(0.211324865405187,0.366025403784439,-0.577350269189626,0.024390243902439);
  vec2 i  = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0,0.0) : vec2(0.0,1.0);
  vec4 x12 = x0.xyxy + C.xxzz; x12.xy -= i1;
  i = mod289(i);
  vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
  m = m*m; m = m*m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
  vec3 g;
  g.x  = a0.x  * x0.x  + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}
float random(float n){ return fract(sin(n) * 43758.5453123); }

void main(){
  vUv = uv;
  vec2 puv = offset.xy / uTextureSize;
  vPUv = puv;

  vec4 colA = texture2D(uTexture, puv);
  float grey = colA.r*0.21 + colA.g*0.71 + colA.b*0.07;
  vGrey = grey;

  vec3 displaced = offset;
  displaced.xy += vec2(random(pindex) - 0.5, random(offset.x + pindex) - 0.5) * uRandom;
  float rndz = (random(pindex) + snoise2(vec2(pindex * 0.1, uTime * 0.1)));
  displaced.z += rndz * (random(pindex) * 2.0 * uDepth);
  displaced.xy -= uTextureSize * 0.5;

  float t = texture2D(uTouch, puv).r;
  vTouch = t;
  displaced.z += t * 20.0 * rndz;
  displaced.x += cos(angle) * t * 20.0 * rndz;
  displaced.y += sin(angle) * t * 20.0 * rndz;

  float psize = (snoise2(vec2(uTime, pindex) * 0.5) + 2.0);
  psize *= max(grey, 0.2);
  psize *= uSize;

  vec4 mvPosition = modelViewMatrix * vec4(displaced, 1.0);
  mvPosition.xyz += position * psize;
  gl_Position = projectionMatrix * mvPosition;
}
`;

const FRAG = /* glsl */ `
precision highp float;
uniform vec3 uColor;
uniform vec3 uColorHot;
varying vec2 vUv;
varying float vTouch;
varying float vGrey;

void main(){
  // circular sprite mask
  float border = 0.3;
  float radius = 0.5;
  float dist = radius - distance(vUv, vec2(0.5));
  float a = smoothstep(0.0, border, dist);

  // red where touched or where the source is brightest (the core node)
  float redMix = clamp(vTouch * 1.4 + pow(vGrey, 3.0) * 0.6, 0.0, 1.0);
  vec3 col = mix(uColor, uColorHot, redMix);
  col *= (0.55 + 0.8 * vGrey);        // intensity carried by the source
  col += uColorHot * vTouch * 0.55;   // extra ignite on touch

  gl_FragColor = vec4(col, a);
}
`;

function makeTouch() {
  const size = 64, maxAge = 120, radius = 0.15;
  let trail = [];
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, size, size);
  const texture = new THREE.Texture(canvas);

  function addTouch(p) {
    let force = 0;
    const last = trail[trail.length - 1];
    if (last) {
      const dx = last.x - p.x, dy = last.y - p.y;
      force = Math.min((dx * dx + dy * dy) * 10000, 1);
    }
    trail.push({ x: p.x, y: p.y, age: 0, force });
  }
  function drawTouch(pt) {
    const x = pt.x * size, y = (1 - pt.y) * size;
    let intensity;
    if (pt.age < maxAge * 0.3) intensity = Math.sin((pt.age / (maxAge * 0.3)) * (Math.PI / 2));
    else intensity = Math.sin((1 - (pt.age - maxAge * 0.3) / (maxAge * 0.7)) * (Math.PI / 2));
    intensity *= pt.force;
    const r = size * radius * Math.max(intensity, 0);
    if (r <= 0) return;
    const grd = ctx.createRadialGradient(x, y, r * 0.25, x, y, r);
    grd.addColorStop(0, "rgba(255,255,255,0.2)");
    grd.addColorStop(1, "rgba(0,0,0,0.0)");
    ctx.beginPath();
    ctx.fillStyle = grd;
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  function update() {
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, size, size);
    trail.forEach((p) => p.age++);
    trail = trail.filter((p) => p.age <= maxAge);
    trail.forEach(drawTouch);
    texture.needsUpdate = true;
  }
  return { texture, addTouch, update };
}

export default function InteractiveParticles({
  src = "/images/hero-particles.png",
  step = 2,
  color = "#ccd0da",
  hotColor = "#ff2e2e",
  className = "",
}) {
  const mount = useRef(null);

  useEffect(() => {
    const el = mount.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let W = el.clientWidth || window.innerWidth;
    let H = el.clientHeight || window.innerHeight;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(W, H);
    renderer.domElement.style.display = "block";
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    el.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const fov = 50;
    const camera = new THREE.PerspectiveCamera(fov, W / H, 1, 10000);
    camera.position.z = 300;
    const container = new THREE.Object3D();
    scene.add(container);

    const touch = makeTouch();
    const ray = new THREE.Raycaster();
    const ndc = new THREE.Vector2();

    let object3D = null, hitArea = null, uniforms = null;
    let imgW = 0, imgH = 0;
    let raf = 0, disposed = false;
    const clock = new THREE.Clock();

    function fovHeight() {
      return 2 * Math.tan((fov * Math.PI) / 180 / 2) * camera.position.z;
    }
    function applyScale() {
      if (!object3D) return;
      const fh = fovHeight();
      const fw = fh * (W / H);
      const scale = Math.max(fh / imgH, fw / imgW) * 1.05; // cover the hero
      object3D.scale.set(scale, scale, 1);
      hitArea.scale.set(scale, scale, 1);
    }

    const loader = new THREE.TextureLoader();
    loader.load(
      src,
      (texture) => {
        if (disposed) return;
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        const img = texture.image;
        imgW = img.width;
        imgH = img.height;

        // sample pixels above a luminance threshold -> particle offsets
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        canvas.width = imgW;
        canvas.height = imgH;
        ctx.scale(1, -1);
        ctx.drawImage(img, 0, 0, imgW, -imgH);
        const data = ctx.getImageData(0, 0, imgW, imgH).data;

        const threshold = 34;
        const offs = [], inds = [];
        for (let i = 0; i < imgW * imgH; i++) {
          const x = i % imgW, y = (i / imgW) | 0;
          if (step > 1 && (x % step !== 0 || y % step !== 0)) continue;
          const lum = data[i * 4] * 0.21 + data[i * 4 + 1] * 0.71 + data[i * 4 + 2] * 0.07;
          if (lum > threshold) { offs.push(x, y, 0); inds.push(i); }
        }
        const numVisible = inds.length;
        const angles = new Float32Array(numVisible);
        for (let k = 0; k < numVisible; k++) angles[k] = Math.random() * Math.PI;

        uniforms = {
          uTime: { value: 0 },
          uRandom: { value: 1.0 },
          uDepth: { value: 2.0 },
          uSize: { value: 0.0 },
          uTextureSize: { value: new THREE.Vector2(imgW, imgH) },
          uTexture: { value: texture },
          uTouch: { value: touch.texture },
          uColor: { value: new THREE.Color(color) },
          uColorHot: { value: new THREE.Color(hotColor) },
        };
        const material = new THREE.RawShaderMaterial({
          uniforms,
          vertexShader: VERT,
          fragmentShader: FRAG,
          depthTest: false,
          transparent: true,
        });

        const geometry = new THREE.InstancedBufferGeometry();
        const positions = new THREE.BufferAttribute(new Float32Array(4 * 3), 3);
        positions.setXYZ(0, -0.5, 0.5, 0);
        positions.setXYZ(1, 0.5, 0.5, 0);
        positions.setXYZ(2, -0.5, -0.5, 0);
        positions.setXYZ(3, 0.5, -0.5, 0);
        geometry.setAttribute("position", positions);
        const uvs = new THREE.BufferAttribute(new Float32Array(4 * 2), 2);
        uvs.setXY(0, 0, 0);
        uvs.setXY(1, 1, 0);
        uvs.setXY(2, 0, 1);
        uvs.setXY(3, 1, 1);
        geometry.setAttribute("uv", uvs);
        geometry.setIndex(new THREE.BufferAttribute(new Uint16Array([0, 2, 1, 2, 3, 1]), 1));
        geometry.setAttribute("pindex", new THREE.InstancedBufferAttribute(new Float32Array(inds), 1, false));
        geometry.setAttribute("offset", new THREE.InstancedBufferAttribute(new Float32Array(offs), 3, false));
        geometry.setAttribute("angle", new THREE.InstancedBufferAttribute(angles, 1, false));

        object3D = new THREE.Mesh(geometry, material);
        container.add(object3D);

        hitArea = new THREE.Mesh(
          new THREE.PlaneGeometry(imgW, imgH, 1, 1),
          new THREE.MeshBasicMaterial({ color: 0xffffff, depthTest: false })
        );
        hitArea.material.visible = false;
        container.add(hitArea);

        applyScale();

        if (reduce) {
          uniforms.uSize.value = 1.3;
          uniforms.uRandom.value = 2.0;
          uniforms.uDepth.value = 4.0;
          renderer.render(scene, camera);
        } else {
          gsap.fromTo(uniforms.uSize, { value: 0.5 }, { value: 1.4, duration: 2.2, ease: "power2.out" });
          gsap.to(uniforms.uRandom, { value: 2.0, duration: 2.2 });
          gsap.fromTo(uniforms.uDepth, { value: 40.0 }, { value: 4.0, duration: 3.2, ease: "power2.out" });
        }
      },
      undefined,
      () => { /* image missing — hero simply shows the dark stage + gradient */ }
    );

    function onMove(e) {
      if (!hitArea) return;
      const r = renderer.domElement.getBoundingClientRect();
      ndc.x = ((e.clientX - r.left) / r.width) * 2 - 1;
      ndc.y = -((e.clientY - r.top) / r.height) * 2 + 1;
      ray.setFromCamera(ndc, camera);
      const hits = ray.intersectObject(hitArea);
      if (hits.length && hits[0].uv) touch.addTouch(hits[0].uv);
    }
    window.addEventListener("pointermove", onMove, { passive: true });

    function tick() {
      raf = requestAnimationFrame(tick);
      const delta = clock.getDelta();
      touch.update();
      if (uniforms) uniforms.uTime.value += delta;
      renderer.render(scene, camera);
    }
    if (!reduce) tick();

    const ro = new ResizeObserver(() => {
      const w = el.clientWidth, h = el.clientHeight;
      if (!w || !h || (w === W && h === H)) return;
      W = w; H = h;
      camera.aspect = W / H;
      camera.updateProjectionMatrix();
      renderer.setSize(W, H);
      applyScale();
      if (reduce) renderer.render(scene, camera);
    });
    ro.observe(el);

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("pointermove", onMove);
      if (object3D) {
        object3D.geometry.dispose();
        object3D.material.dispose();
      }
      if (hitArea) hitArea.geometry.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === el) el.removeChild(renderer.domElement);
    };
  }, [src, step, color, hotColor]);

  return <div ref={mount} className={`h-full w-full ${className}`} />;
}
