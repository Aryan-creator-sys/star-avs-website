import { useEffect, useRef } from "react";
import * as THREE from "three";

/**
 * HexSurface — a dense field of hexagonal "scale" prisms rendered as a single
 * InstancedMesh, displaced entirely on the GPU (one draw call, no per-frame
 * matrix updates). A low-angle perspective camera + exponential fog give the
 * cinematic depth of the reference; heights follow layered waves + smooth
 * noise so the surface flows and breathes. The pointer disturbs the surface
 * through smoothed uniforms (inertia on enter/leave), raising and reddening the
 * scales around it with a soft radial falloff and a gentle travelling ripple.
 *
 * Palette is locked to charcoal + deep red. Tunables are grouped in CONFIG.
 *
 * This is a background layer only — it renders behind the hero content and
 * never captures pointer events (listeners are on window).
 */

const CONFIG = {
  radius: { desktop: 0.4, mobile: 0.52 }, // hex radius (also sets packing)
  halfWidth: { desktop: 46, mobile: 26 }, // field half-extent in x
  zNear: 14, // nearest row (in front of camera)
  zFar: { desktop: -92, mobile: -56 }, // farthest row
  heightAmp: 0.85, // overall wave/noise height multiplier
  bumpAmp: 2.2, // how much the cursor lifts nearby scales
  bumpRadius: 6.0, // world-units radius of cursor influence
  timeScale: 1.0, // global animation speed
  charcoal: 0x0b0b0e,
  red: 0xbe141b,
  redLow: 0.55, // wave-height at which red starts appearing
  redHigh: 2.1, // wave-height at which red is fullest
};

export default function HexSurface({ className = "" }) {
  const mount = useRef(null);

  useEffect(() => {
    const el = mount.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const mobile = window.matchMedia("(max-width: 767px)").matches;

    let W = el.clientWidth || window.innerWidth;
    let H = el.clientHeight || window.innerHeight;

    // ---- renderer ----
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: !mobile, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobile ? 2 : 2));
    renderer.setSize(W, H);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    renderer.domElement.style.display = "block";
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    el.appendChild(renderer.domElement);

    // ---- scene / camera / fog ----
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x09090f, mobile ? 0.015 : 0.016);

    const camera = new THREE.PerspectiveCamera(52, W / H, 0.1, 400);
    camera.position.set(0, 6.2, 18);
    camera.lookAt(0, 0.6, -34);

    // ---- lighting (charcoal + red only) ----
    scene.add(new THREE.AmbientLight(0x160a0c, 0.7));
    const hemi = new THREE.HemisphereLight(0x2a0b0d, 0x000000, 0.5);
    scene.add(hemi);
    const key = new THREE.DirectionalLight(0xfff2f0, 1.05);
    key.position.set(6, 10, 5);
    scene.add(key);
    const redFill = new THREE.DirectionalLight(0x7c0f14, 0.55);
    redFill.position.set(-7, 4, -3);
    scene.add(redFill);

    // ---- geometry (hex prism, base at y=0, top at y=1) ----
    const R = mobile ? CONFIG.radius.mobile : CONFIG.radius.desktop;
    const geo = new THREE.CylinderGeometry(R * 0.94, R * 0.94, 1, 6, 1);
    geo.rotateY(Math.PI / 6); // flat-top hexes
    geo.translate(0, 0.5, 0); // anchor base at y=0

    // ---- hex-packed instance grid ----
    const dx = R * Math.sqrt(3);
    const dz = R * 1.5;
    const halfW = mobile ? CONFIG.halfWidth.mobile : CONFIG.halfWidth.desktop;
    const zFar = mobile ? CONFIG.zFar.mobile : CONFIG.zFar.desktop;

    const positions = [];
    let row = 0;
    for (let z = CONFIG.zNear; z >= zFar; z -= dz, row++) {
      const off = (row % 2) * (dx / 2);
      for (let x = -halfW; x <= halfW; x += dx) positions.push(x + off, z);
    }
    const count = positions.length / 2;

    const mesh = new THREE.InstancedMesh(geo, null, count);
    mesh.frustumCulled = false; // single big field; fog handles the distance
    const rand = new Float32Array(count);
    const dummy = new THREE.Object3D();
    for (let i = 0; i < count; i++) {
      const x = positions[i * 2];
      const z = positions[i * 2 + 1];
      dummy.position.set(x, 0, z);
      dummy.rotation.y = (Math.random() - 0.5) * 0.25;
      const s = 0.9 + Math.random() * 0.14;
      dummy.scale.set(s, 1, s);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      rand[i] = Math.random();
    }
    geo.setAttribute("aRand", new THREE.InstancedBufferAttribute(rand, 1));

    // ---- shared uniforms (injected into MeshStandardMaterial) ----
    const uniforms = {
      uTime: { value: 0 },
      uMouse: { value: new THREE.Vector3(0, 0, -9999) },
      uMouseStrength: { value: 0 },
      uBumpRadius: { value: CONFIG.bumpRadius },
      uBumpAmp: { value: CONFIG.bumpAmp },
      uHeightAmp: { value: CONFIG.heightAmp },
      uCharcoal: { value: new THREE.Color(CONFIG.charcoal) },
      uRed: { value: new THREE.Color(CONFIG.red) },
      uRedLow: { value: CONFIG.redLow },
      uRedHigh: { value: CONFIG.redHigh },
    };

    const material = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      metalness: 0.18,
      roughness: 0.56,
      emissive: 0x000000,
    });
    material.onBeforeCompile = (shader) => {
      Object.assign(shader.uniforms, uniforms);
      shader.vertexShader = shader.vertexShader
        .replace(
          "#include <common>",
          /* glsl */ `#include <common>
          uniform float uTime;
          uniform vec3 uMouse;
          uniform float uMouseStrength;
          uniform float uBumpRadius;
          uniform float uBumpAmp;
          uniform float uHeightAmp;
          uniform float uRedLow;
          uniform float uRedHigh;
          attribute float aRand;
          varying float vRed;
          varying float vRand;
          vec3 mod289(vec3 x){return x - floor(x*(1.0/289.0))*289.0;}
          vec2 mod289(vec2 x){return x - floor(x*(1.0/289.0))*289.0;}
          vec3 permute(vec3 x){return mod289(((x*34.0)+1.0)*x);}
          float snoise2(vec2 v){
            const vec4 C = vec4(0.211324865405187,0.366025403784439,-0.577350269189626,0.024390243902439);
            vec2 i = floor(v + dot(v, C.yy));
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
            g.x = a0.x * x0.x + h.x * x0.y;
            g.yz = a0.yz * x12.xz + h.yz * x12.yw;
            return 130.0 * dot(m, g);
          }
          float surfaceHeight(vec2 c){
            float h = 0.9;
            h += (sin(c.x*0.17 + uTime*0.22) + sin(c.y*0.14 - uTime*0.18 + c.x*0.05)) * 0.32 * uHeightAmp;
            h += snoise2(c*0.055 + vec2(uTime*0.045, -uTime*0.03)) * 0.85 * uHeightAmp;
            h += snoise2(c*0.15 - vec2(uTime*0.02)) * 0.28 * uHeightAmp;
            h += sin(uTime*0.55) * 0.035; // breathing
            return h;
          }`
        )
        .replace(
          "#include <begin_vertex>",
          /* glsl */ `#include <begin_vertex>
          vec2 cellPos = vec2(instanceMatrix[3][0], instanceMatrix[3][2]);
          float h = surfaceHeight(cellPos);
          float d = distance(cellPos, uMouse.xz);
          float bump = exp(-(d*d) / (2.0 * uBumpRadius * uBumpRadius)) * uMouseStrength;
          float ring = sin(d * 1.05 - uTime * 3.0) * exp(-d * 0.16) * uMouseStrength * 0.3;
          h += bump * uBumpAmp + ring;
          float hh = max(h, 0.04);
          transformed.y *= hh;
          transformed.xz *= 1.0 + bump * 0.22; // subtle enlarge near cursor
          vRand = aRand;
          vRed = clamp(smoothstep(uRedLow, uRedHigh, h) * (0.5 + 0.5 * aRand) + bump * 0.6, 0.0, 1.0);`
        );

      shader.fragmentShader = shader.fragmentShader
        .replace(
          "#include <common>",
          /* glsl */ `#include <common>
          uniform vec3 uCharcoal;
          uniform vec3 uRed;
          varying float vRed;
          varying float vRand;`
        )
        .replace(
          "#include <color_fragment>",
          /* glsl */ `#include <color_fragment>
          diffuseColor.rgb = mix(uCharcoal, uRed, vRed);`
        )
        .replace(
          "#include <emissivemap_fragment>",
          /* glsl */ `#include <emissivemap_fragment>
          totalEmissiveRadiance += uRed * pow(vRed, 2.6) * 0.32;`
        );
    };
    material.customProgramCacheKey = () => "hexsurface-v1";
    mesh.material = material;
    scene.add(mesh);

    // ---- pointer -> surface (ray/plane intersect; robust to scroll/resize) ----
    const ray = new THREE.Raycaster();
    const ndc = new THREE.Vector2();
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const hit = new THREE.Vector3();
    const target = new THREE.Vector3(0, 0, -9999);
    let targetStrength = 0;

    function pointer(e) {
      const r = renderer.domElement.getBoundingClientRect();
      const cx = e.clientX, cy = e.clientY;
      const inside = cx >= r.left && cx <= r.right && cy >= r.top && cy <= r.bottom;
      targetStrength = inside ? 1 : 0;
      if (!inside) return;
      ndc.x = ((cx - r.left) / r.width) * 2 - 1;
      ndc.y = -((cy - r.top) / r.height) * 2 + 1;
      ray.setFromCamera(ndc, camera);
      if (ray.ray.intersectPlane(plane, hit)) target.set(hit.x, 0, hit.z);
    }
    window.addEventListener("pointermove", pointer, { passive: true });
    window.addEventListener("pointerdown", pointer, { passive: true });

    // ---- animation loop ----
    const clock = new THREE.Clock();
    let raf = 0;
    function tick() {
      raf = requestAnimationFrame(tick);
      const dt = Math.min(clock.getDelta(), 0.05);
      uniforms.uTime.value += dt * CONFIG.timeScale;
      // inertia: ease cursor position + strength toward targets
      const m = uniforms.uMouse.value;
      const lp = 1 - Math.pow(0.0015, dt); // ~smooth follow
      if (target.z > -9000) { m.x += (target.x - m.x) * lp; m.z += (target.z - m.z) * lp; }
      uniforms.uMouseStrength.value += (targetStrength - uniforms.uMouseStrength.value) * (1 - Math.pow(0.02, dt));
      renderer.render(scene, camera);
    }
    tick();

    // ---- resize ----
    const ro = new ResizeObserver(() => {
      const w = el.clientWidth, h = el.clientHeight;
      if (!w || !h || (w === W && h === H)) return;
      W = w; H = h;
      camera.aspect = W / H;
      camera.updateProjectionMatrix();
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(W, H);
    });
    ro.observe(el);

    // ---- cleanup ----
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("pointermove", pointer);
      window.removeEventListener("pointerdown", pointer);
      geo.dispose();
      material.dispose();
      mesh.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === el) el.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={mount} className={`h-full w-full ${className}`} />;
}
