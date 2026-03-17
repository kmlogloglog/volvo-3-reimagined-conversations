import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Points, PointMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { useThemeStore } from '@/store/themeStore';

// ── Aurora shader material ──────────────────────────────────────────────────

const auroraVertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const auroraFragmentShader = `
  uniform float uTime;
  uniform float uDark;
  varying vec2 vUv;

  // Simple 2D noise
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }

  void main() {
    vec2 uv = vUv;
    float t = uTime * 0.15;

    float n1 = noise(uv * 3.0 + t);
    float n2 = noise(uv * 5.0 - t * 0.7);
    float n3 = noise(uv * 2.0 + vec2(t * 0.5, -t * 0.3));

    float wave = sin(uv.x * 6.2831 + t * 2.0 + n1 * 3.0) * 0.5 + 0.5;
    wave *= sin(uv.y * 3.1415 + t + n2 * 2.0) * 0.5 + 0.5;

    // Dark mode: amber + blue-purple aurora
    vec3 darkColor1 = vec3(0.98, 0.75, 0.14);  // amber
    vec3 darkColor2 = vec3(0.47, 0.44, 0.71);  // purple
    vec3 darkColor3 = vec3(0.22, 0.74, 0.91);  // sky blue

    // Light mode: warm golden tones
    vec3 lightColor1 = vec3(0.98, 0.82, 0.35);
    vec3 lightColor2 = vec3(0.92, 0.68, 0.20);
    vec3 lightColor3 = vec3(0.85, 0.75, 0.55);

    vec3 c1 = mix(lightColor1, darkColor1, uDark);
    vec3 c2 = mix(lightColor2, darkColor2, uDark);
    vec3 c3 = mix(lightColor3, darkColor3, uDark);

    vec3 color = mix(c1, c2, n1);
    color = mix(color, c3, n3 * wave);

    float alpha = wave * n2 * mix(0.06, 0.12, uDark);
    alpha = clamp(alpha, 0.0, 0.15);

    gl_FragColor = vec4(color, alpha);
  }
`;

function AuroraPlane({ isDark }: { isDark: boolean }): React.JSX.Element {
  const meshRef = useRef<THREE.Mesh>(null);
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uDark: { value: isDark ? 1.0 : 0.0 },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  useFrame((state) => {
    uniforms.uTime.value = state.clock.elapsedTime;
    uniforms.uDark.value = THREE.MathUtils.lerp(
      uniforms.uDark.value,
      isDark ? 1.0 : 0.0,
      0.02,
    );
  });

  return (
    <mesh ref={meshRef} position={[0, 0, -1]}>
      <planeGeometry args={[12, 8, 1, 1]} />
      <shaderMaterial
        vertexShader={auroraVertexShader}
        fragmentShader={auroraFragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
      />
    </mesh>
  );
}

// ── Floating particles ──────────────────────────────────────────────────────

function FloatingParticles({ isDark }: { isDark: boolean }): React.JSX.Element {
  const pointsRef = useRef<THREE.Points>(null);
  const count = 120;

  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 14;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 10;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 4;
    }
    return pos;
  }, []);

  useFrame((state) => {
    if (!pointsRef.current) return;
    pointsRef.current.rotation.y = state.clock.elapsedTime * 0.015;
    pointsRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.01) * 0.05;
  });

  return (
    <Points ref={pointsRef} positions={positions} stride={3}>
      <PointMaterial
        transparent
        color={isDark ? '#fbbf24' : '#d4a017'}
        size={0.03}
        sizeAttenuation
        depthWrite={false}
        opacity={isDark ? 0.4 : 0.25}
      />
    </Points>
  );
}

// ── Glowing orbs ────────────────────────────────────────────────────────────

function GlowingOrb({
  position,
  color,
  scale,
  speed,
}: {
  position: [number, number, number];
  color: string;
  scale: number;
  speed: number;
}): React.JSX.Element {
  const meshRef = useRef<THREE.Mesh>(null);
  const startPos = useMemo(() => [...position] as [number, number, number], [position]);

  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.elapsedTime * speed;
    meshRef.current.position.x = startPos[0] + Math.sin(t) * 0.5;
    meshRef.current.position.y = startPos[1] + Math.cos(t * 0.7) * 0.3;
    const pulse = 1 + Math.sin(t * 1.5) * 0.15;
    meshRef.current.scale.setScalar(scale * pulse);
  });

  return (
    <mesh ref={meshRef} position={position}>
      <sphereGeometry args={[1, 16, 16]} />
      <meshBasicMaterial color={color} transparent opacity={0.08} />
    </mesh>
  );
}

// ── Scene ───────────────────────────────────────────────────────────────────

function AuroraScene({ isDark }: { isDark: boolean }): React.JSX.Element {
  return (
    <>
      <AuroraPlane isDark={isDark} />
      <FloatingParticles isDark={isDark} />
      <GlowingOrb position={[-3, 1.5, -2]} color={isDark ? '#fbbf24' : '#e6a800'} scale={0.8} speed={0.3} />
      <GlowingOrb position={[3, -1, -2]} color={isDark ? '#7871b4' : '#c4a35a'} scale={0.6} speed={0.25} />
      <GlowingOrb position={[0, 2, -3]} color={isDark ? '#38bdf8' : '#d4a017'} scale={0.5} speed={0.35} />
    </>
  );
}

// ── Main component ──────────────────────────────────────────────────────────

interface AnimatedBackgroundProps {
  fallbackOnly?: boolean;
}

export default function AnimatedBackground({
  fallbackOnly = false,
}: AnimatedBackgroundProps): React.JSX.Element {
  const theme = useThemeStore((s) => s.theme);
  const isDark = theme === 'dark';

  const projectId =
    import.meta.env.VITE_UNICORN_PROJECT_ID ?? 'X0ErZR3QhPzMHfKgBbJJ';

  const srcDoc = `<!DOCTYPE html>
<html><head></head><body style="margin:0;overflow:hidden;background:transparent">
<div data-us-project="${String(projectId)}" style="position:absolute;top:0;left:0;width:100%;height:100%"></div>
<script>
!function(){if(!window.UnicornStudio){window.UnicornStudio={isInitialized:false};
var i=document.createElement("script");
i.src="https://cdn.jsdelivr.net/gh/hiunicornstudio/unicornstudio.js@v1.4.29/dist/unicornStudio.umd.js";
i.onload=function(){window.UnicornStudio.isInitialized||(UnicornStudio.init(),window.UnicornStudio.isInitialized=true)};
(document.head||document.body).appendChild(i)}}();
</script>
</body></html>`;

  return (
    <>
      {/* CSS fallback — always rendered as ambient base layer */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        {/* Theme-aware blurred orbs — colors driven by CSS vars */}
        <div
          className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full blur-[120px] transition-colors duration-700"
          style={{ background: 'var(--van-orb-a)' }}
        />
        <div
          className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full blur-[120px] transition-colors duration-700"
          style={{ background: 'var(--van-orb-b)' }}
        />
        {/* Noise overlay — lighter in light mode */}
        <div className="absolute inset-0 bg-noise opacity-[0.03]" />
      </div>

      {/* 3D Aurora + Particles layer */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{ zIndex: -9, mixBlendMode: isDark ? 'screen' : 'multiply' }}
      >
        <Canvas
          dpr={[1, 1.5]}
          camera={{ position: [0, 0, 5], fov: 50 }}
          style={{ background: 'transparent' }}
          gl={{ alpha: true, antialias: false }}
        >
          <AuroraScene isDark={isDark} />
        </Canvas>
      </div>

      {/* Primary: Unicorn Studio iframe embed */}
      {!fallbackOnly && (
        <iframe
          title="Background Animation"
          srcDoc={srcDoc}
          className="fixed inset-0 w-full h-full border-0 -z-10 pointer-events-none"
          sandbox="allow-scripts"
        />
      )}
    </>
  );
}
