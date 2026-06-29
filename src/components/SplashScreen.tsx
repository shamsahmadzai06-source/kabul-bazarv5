import { useEffect, useRef } from 'react';
import * as THREE from 'three';

const vertexShader = `
varying vec2 v_uv;
void main() {
  v_uv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const fragmentShader = `
precision mediump float;
varying vec2 v_uv;
uniform float u_time;
uniform vec2 u_resolution;
uniform float u_waveSpeed;
uniform float u_waveHeight;
uniform float u_density;

#define NUM_BLUE_SHADES 5

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

vec3 getBlueColor(int index, float brightness) {
  if (index == 0) return mix(vec3(0.2, 0.4, 0.8), vec3(0.3, 0.55, 0.9), brightness);
  if (index == 1) return mix(vec3(0.25, 0.55, 0.85), vec3(0.4, 0.7, 1.0), brightness);
  if (index == 2) return mix(vec3(0.15, 0.35, 0.75), vec3(0.25, 0.5, 0.85), brightness);
  if (index == 3) return mix(vec3(0.3, 0.6, 0.9), vec3(0.45, 0.75, 1.0), brightness);
  if (index == 4) return mix(vec3(0.1, 0.3, 0.7), vec3(0.2, 0.45, 0.8), brightness);
  return mix(vec3(0.2, 0.4, 0.8), vec3(0.35, 0.6, 0.95), brightness);
}

void main() {
  vec2 fragCoord = v_uv * u_resolution;
  vec2 uv = fragCoord / u_resolution.y;
  float animationTime = u_time * u_waveSpeed;
  float waveHeight = 0.25 * u_waveHeight;
  float waveFreq = 3.0 * u_density;
  float waveX = sin(uv.y * waveFreq + animationTime * 1.2) * waveHeight;
  float waveX2 = sin(uv.y * waveFreq * 1.3 + animationTime * 0.8 + 1.0) * waveHeight * 0.7;
  float totalWave = waveX + waveX2;
  vec2 shardCoord = vec2(uv.x + totalWave, uv.y) * vec2(4.0, 8.0) * u_density;
  float shardX = fract(shardCoord.x) - 0.5;
  float shardY = fract(shardCoord.y) - 0.5;
  vec2 shardId = floor(shardCoord);
  float skewedX = shardX + shardY * 0.3;
  float dist = abs(skewedX) + abs(shardY * 0.8);
  float rnd = hash(shardId);
  float rnd2 = hash(shardId + 100.0);
  float phase = hash(shardId + 200.0);
  float anim = sin(animationTime * (0.3 + phase * 0.2) + phase * 6.28) * 0.06 * u_waveHeight;
  float shardSize = (0.3 + rnd * 0.2) + anim;
  float shardEdge = smoothstep(shardSize, shardSize - 0.08, dist);
  int colorIndex = int(mod(floor(rnd * float(NUM_BLUE_SHADES)), float(NUM_BLUE_SHADES)));
  float colorPhase = animationTime * 0.4 + rnd2 * 6.28;
  float brightness = 0.5 + 0.5 * sin(colorPhase);
  vec3 waveColor = getBlueColor(colorIndex, brightness);
  float border = smoothstep(0.0, 0.06, dist) * smoothstep(shardSize, shardSize - 0.02, dist);
  waveColor *= (0.7 + 0.3 * border);
  shardId.y = floor(shardId.y / 2.0);
  vec3 normal = normalize(vec3(hash(shardId) * 0.5 - 0.25, hash(shardId + 1.0) * 0.5 - 0.25, 1.0));
  vec3 lightDir = normalize(vec3(0.3, 0.5, 0.8));
  float diffuse = max(dot(normal, lightDir), 0.0);
  waveColor *= (0.6 + 0.4 * diffuse);
  vec3 finalColor = mix(vec3(0.05, 0.15, 0.25), waveColor, shardEdge);
  float flowY = sin(animationTime * 0.3) * 0.4;
  float flowBand = exp(-pow((v_uv.y - (0.5 + flowY)) * 3.0, 2.0));
  finalColor += vec3(0.15, 0.3, 0.5) * flowBand * shardEdge;
  gl_FragColor = vec4(finalColor, 1.0);
}
`;

interface SplashScreenProps {
  onComplete: () => void;
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    const { width, height } = container.getBoundingClientRect();
    renderer.setSize(width, height);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const clock = new THREE.Clock();

    const isMobile = width < 768;
    const subdivisions = isMobile ? 128 : 256;
    const geometry = new THREE.PlaneGeometry(2, 2, subdivisions, subdivisions);

    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        u_time: { value: 0 },
        u_resolution: { value: new THREE.Vector2(width * Math.min(window.devicePixelRatio, 2), height * Math.min(window.devicePixelRatio, 2)) },
        u_waveSpeed: { value: 0.5 },
        u_waveHeight: { value: 1.0 },
        u_density: { value: 1.0 },
      },
    });

    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    let animationId: number;
    const animate = () => {
      animationId = requestAnimationFrame(animate);
      material.uniforms.u_time.value = clock.getElapsedTime();
      renderer.render(scene, camera);
    };
    animate();

    const timer = setTimeout(() => {
      cancelAnimationFrame(animationId);
      onComplete();
    }, 2500);

    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(animationId);
      renderer.dispose();
      geometry.dispose();
      material.dispose();
    };
  }, [onComplete]);

  return (
    <div ref={containerRef} className="fixed inset-0 z-[100] bg-[#0a1f3d]">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <img
          src="/icons/logo.png"
          alt="Kabul Bazar"
          className="w-[120px] h-[120px] rounded-full object-cover animate-pulse"
        />
        <h1 className="mt-6 text-white text-[28px] font-bold tracking-[-0.5px]">
          Kabul Bazar
        </h1>
      </div>
    </div>
  );
}
