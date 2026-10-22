"use client";

import { Suspense, useMemo, useRef } from "react";
import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei";
import * as THREE from "three";
import { EARTH_R, ORBITS, PPIS } from "@/lib/game/data";
import { craftAnomaly, latLonToXyz, rotateY, satEci, satRadius } from "@/lib/game/orbit";
import type { Contract, Craft, HullId, OrbitId, SimRef } from "@/lib/game/types";

class KeplerCurve extends THREE.Curve<THREE.Vector3> {
  orbitId: OrbitId;
  constructor(orbitId: OrbitId) {
    super();
    this.orbitId = orbitId;
  }
  getPoint(t: number, target = new THREE.Vector3()) {
    const p = satEci(t * Math.PI * 2, this.orbitId);
    return target.set(p.x, p.y, p.z);
  }
}

function Earth({ simRef }: { simRef: SimRef }) {
  const group = useRef<THREE.Group>(null);
  const map = useLoader(THREE.TextureLoader, "/game/earth-map.jpg");
  useFrame(() => {
    if (group.current) group.current.rotation.y = simRef.current.earthAngle;
  });
  return (
    <group ref={group}>
      <mesh>
        <sphereGeometry args={[EARTH_R, 64, 48]} />
        <meshPhongMaterial map={map} shininess={8} specular="#224466" toneMapped={false} />
      </mesh>
      <mesh>
        <sphereGeometry args={[EARTH_R * 1.03, 32, 24]} />
        <meshBasicMaterial color="#9ad4e0" transparent opacity={0.1} side={THREE.BackSide} toneMapped={false} />
      </mesh>
    </group>
  );
}

function OrbitRing({ orbitId }: { orbitId: OrbitId }) {
  const curve = useMemo(() => new KeplerCurve(orbitId), [orbitId]);
  return (
    <mesh>
      <tubeGeometry args={[curve, 192, 0.01, 8, true]} />
      <meshBasicMaterial color={ORBITS[orbitId].ring} transparent opacity={0.85} toneMapped={false} />
    </mesh>
  );
}

function hullTint(id: string) {
  const n = id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const hues = ["#e8edf2", "#d7e3f2", "#f0e6d4", "#e3f0e6", "#efe4f0", "#f2ece0"];
  return hues[n % hues.length];
}

function CraftMesh({ hull, tint }: { hull: HullId; tint: string }) {
  const body = tint;
  if (hull === "irbus") {
    return (
      <group>
        <mesh>
          <boxGeometry args={[0.055, 0.055, 0.2]} />
          <meshStandardMaterial color="#c9a227" metalness={0.4} roughness={0.35} />
        </mesh>
        <mesh position={[0, 0, 0.13]}>
          <cylinderGeometry args={[0.018, 0.022, 0.05, 10]} />
          <meshStandardMaterial color="#2a2a2a" />
        </mesh>
        <mesh position={[0.13, 0, 0]}>
          <boxGeometry args={[0.18, 0.004, 0.06]} />
          <meshStandardMaterial color="#3a1a0a" emissive="#8a4a12" emissiveIntensity={0.35} />
        </mesh>
        <mesh position={[-0.13, 0, 0]}>
          <boxGeometry args={[0.18, 0.004, 0.06]} />
          <meshStandardMaterial color="#3a1a0a" emissive="#8a4a12" emissiveIntensity={0.35} />
        </mesh>
      </group>
    );
  }
  if (hull === "msbus") {
    return (
      <group>
        <mesh>
          <boxGeometry args={[0.07, 0.07, 0.16]} />
          <meshStandardMaterial color="#b7d4a8" metalness={0.2} roughness={0.4} />
        </mesh>
        <mesh position={[0.03, 0.02, 0.1]}>
          <cylinderGeometry args={[0.012, 0.014, 0.03, 8]} />
          <meshStandardMaterial color="#1c2a18" />
        </mesh>
        <mesh position={[-0.02, -0.01, 0.1]}>
          <cylinderGeometry args={[0.01, 0.012, 0.028, 8]} />
          <meshStandardMaterial color="#243018" />
        </mesh>
        <mesh position={[0.14, 0, 0]}>
          <boxGeometry args={[0.2, 0.004, 0.08]} />
          <meshStandardMaterial color="#1b4a32" emissive="#2f8a55" emissiveIntensity={0.4} />
        </mesh>
        <mesh position={[-0.14, 0, 0]}>
          <boxGeometry args={[0.2, 0.004, 0.08]} />
          <meshStandardMaterial color="#1b4a32" emissive="#2f8a55" emissiveIntensity={0.4} />
        </mesh>
      </group>
    );
  }
  if (hull === "combo") {
    return (
      <group>
        <mesh>
          <boxGeometry args={[0.08, 0.08, 0.18]} />
          <meshStandardMaterial color={body} metalness={0.25} roughness={0.35} />
        </mesh>
        <mesh position={[0.025, 0.01, 0.12]}>
          <cylinderGeometry args={[0.014, 0.016, 0.04, 10]} />
          <meshStandardMaterial color="#222" />
        </mesh>
        <mesh position={[-0.025, -0.01, 0.12]}>
          <cylinderGeometry args={[0.012, 0.014, 0.036, 10]} />
          <meshStandardMaterial color="#c9a227" />
        </mesh>
        {[0.16, -0.16].map((x) => (
          <mesh key={x} position={[x, 0, 0]}>
            <boxGeometry args={[0.18, 0.004, 0.07]} />
            <meshStandardMaterial color="#1b3a6b" emissive="#3a7ad9" emissiveIntensity={0.45} />
          </mesh>
        ))}
        {[0.16, -0.16].map((y) => (
          <mesh key={`y${y}`} position={[0, y, 0]} rotation={[0, 0, Math.PI / 2]}>
            <boxGeometry args={[0.14, 0.004, 0.05]} />
            <meshStandardMaterial color="#1b3a6b" emissive="#3a7ad9" emissiveIntensity={0.35} />
          </mesh>
        ))}
      </group>
    );
  }
  if (hull === "polar") {
    return (
      <group>
        <mesh>
          <cylinderGeometry args={[0.045, 0.045, 0.16, 6]} />
          <meshStandardMaterial color="#dce6f2" metalness={0.3} roughness={0.3} />
        </mesh>
        {[0, 1, 2, 3].map((i) => {
          const a = (i * Math.PI) / 2 + Math.PI / 4;
          return (
            <mesh key={i} position={[Math.cos(a) * 0.14, Math.sin(a) * 0.14, 0]} rotation={[0, 0, a]}>
              <boxGeometry args={[0.2, 0.003, 0.055]} />
              <meshStandardMaterial color="#16324f" emissive="#4aa0e0" emissiveIntensity={0.5} />
            </mesh>
          );
        })}
        <mesh position={[0, 0, 0.1]}>
          <cylinderGeometry args={[0.016, 0.02, 0.04, 12]} />
          <meshStandardMaterial color="#111" />
        </mesh>
      </group>
    );
  }
  if (hull === "molniya") {
    return (
      <group>
        <mesh>
          <boxGeometry args={[0.09, 0.07, 0.14]} />
          <meshStandardMaterial color="#f0d8b0" metalness={0.35} roughness={0.4} />
        </mesh>
        <mesh position={[0.12, 0.04, 0]} rotation={[0.4, 0.3, 0]}>
          <sphereGeometry args={[0.045, 12, 8, 0, Math.PI]} />
          <meshStandardMaterial color="#cfd6de" side={THREE.DoubleSide} metalness={0.6} roughness={0.2} />
        </mesh>
        <mesh position={[-0.14, 0, 0]}>
          <boxGeometry args={[0.16, 0.004, 0.07]} />
          <meshStandardMaterial color="#5a2a08" emissive="#c46a18" emissiveIntensity={0.4} />
        </mesh>
        <mesh position={[0, -0.08, 0]}>
          <cylinderGeometry args={[0.006, 0.006, 0.1, 6]} />
          <meshStandardMaterial color="#888" />
        </mesh>
      </group>
    );
  }
  if (hull === "bus") {
    return (
      <group>
        <mesh>
          <cylinderGeometry args={[0.055, 0.055, 0.14, 8]} />
          <meshStandardMaterial color={body} metalness={0.28} roughness={0.32} />
        </mesh>
        <mesh position={[0.16, 0, 0]}>
          <boxGeometry args={[0.22, 0.005, 0.09]} />
          <meshStandardMaterial color="#1b3a6b" emissive="#3a7ad9" emissiveIntensity={0.5} />
        </mesh>
        <mesh position={[-0.16, 0, 0]}>
          <boxGeometry args={[0.22, 0.005, 0.09]} />
          <meshStandardMaterial color="#1b3a6b" emissive="#3a7ad9" emissiveIntensity={0.5} />
        </mesh>
        <mesh position={[0, 0, 0.09]}>
          <boxGeometry args={[0.04, 0.04, 0.03]} />
          <meshStandardMaterial color="#222" />
        </mesh>
      </group>
    );
  }
  return (
    <group>
      <mesh>
        <boxGeometry args={[0.07, 0.07, 0.14]} />
        <meshStandardMaterial color={body} emissive="#fff6d2" emissiveIntensity={0.15} />
      </mesh>
      <mesh position={[0.12, 0, 0]}>
        <boxGeometry args={[0.16, 0.004, 0.07]} />
        <meshStandardMaterial color="#1b3a6b" emissive="#3a7ad9" emissiveIntensity={0.5} />
      </mesh>
      <mesh position={[-0.12, 0, 0]}>
        <boxGeometry args={[0.16, 0.004, 0.07]} />
        <meshStandardMaterial color="#1b3a6b" emissive="#3a7ad9" emissiveIntensity={0.5} />
      </mesh>
    </group>
  );
}

function Satellite({
  craft,
  simRef,
  flash,
  selected,
  onInspect,
}: {
  craft: Craft;
  simRef: SimRef;
  flash: number;
  selected: boolean;
  onInspect: (id: string) => void;
}) {
  const ref = useRef<THREE.Group>(null);
  useFrame(() => {
    if (!ref.current) return;
    const a = craftAnomaly(craft, simRef.current.clock);
    const p = satEci(a, craft.orbit);
    ref.current.position.set(p.x, p.y, p.z);
    ref.current.lookAt(0, 0, 0);
    const pulse = selected && flash > 0 && performance.now() - flash < 500 ? 1.55 : selected ? 1.25 : 1;
    ref.current.scale.setScalar(pulse);
  });
  return (
    <group
      ref={ref}
      onClick={(e) => {
        e.stopPropagation();
        onInspect(craft.id);
      }}
    >
      <group scale={2.15}>
        <CraftMesh hull={craft.hull} tint={hullTint(craft.id)} />
      </group>
      <mesh>
        <sphereGeometry args={[0.035, 10, 10]} />
        <meshBasicMaterial color={ORBITS[craft.orbit].ring} toneMapped={false} />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.16, 10, 10]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  );
}

function Marker({
  lat,
  lon,
  color,
  simRef,
  pulse,
}: {
  lat: number;
  lon: number;
  color: string;
  simRef: SimRef;
  pulse?: boolean;
}) {
  const ref = useRef<THREE.Group>(null);
  useFrame(() => {
    if (!ref.current) return;
    const local = latLonToXyz(lat, lon, EARTH_R * 1.02);
    const p = rotateY(local, simRef.current.earthAngle);
    ref.current.position.set(p.x, p.y, p.z);
    const s = pulse ? 1 + Math.sin(performance.now() / 180) * 0.2 : 1;
    ref.current.scale.setScalar(s);
  });
  return (
    <group ref={ref}>
      <mesh>
        <sphereGeometry args={[0.05, 12, 12]} />
        <meshBasicMaterial color={color} toneMapped={false} />
      </mesh>
    </group>
  );
}

function Beam({ craft, simRef }: { craft: Craft; simRef: SimRef }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(() => {
    if (!ref.current) return;
    const a = craftAnomaly(craft, simRef.current.clock);
    const p = satEci(a, craft.orbit);
    ref.current.position.set(p.x / 2, p.y / 2, p.z / 2);
    ref.current.lookAt(p.x, p.y, p.z);
    ref.current.scale.set(1, 1, (satRadius(a, craft.orbit) - EARTH_R) / 2);
  });
  return (
    <mesh ref={ref}>
      <cylinderGeometry args={[0.006, 0.02, 2, 8]} />
      <meshBasicMaterial color="#7ec8c5" transparent opacity={0.35} />
    </mesh>
  );
}

export function Globe({
  simRef,
  contracts,
  crafts,
  activeCraftId,
  flash,
  jobActive,
  onInspect,
}: {
  simRef: SimRef;
  contracts: Contract[];
  crafts: Craft[];
  activeCraftId: string | null;
  flash: number;
  jobActive: boolean;
  onInspect: (id: string) => void;
}) {
  const alive = crafts.filter((c) => c.status === "alive");
  const orbits = [...new Set(alive.map((c) => c.orbit))];
  const active = alive.find((c) => c.id === activeCraftId) ?? null;

  return (
    <div className="relative h-[46vh] min-h-[280px] w-full overflow-hidden bg-[#070b14] sm:h-[52vh] lg:h-auto lg:min-h-[520px] lg:flex-1">
      <Canvas
        camera={{ position: [0, 0.45, 5.8], fov: 38 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: false, toneMapping: THREE.NoToneMapping }}
      >
        <color attach="background" args={["#070b14"]} />
        <ambientLight intensity={0.95} />
        <directionalLight position={[4.5, 2.2, 3]} intensity={1.55} color="#fff6e0" />
        <Stars radius={60} depth={28} count={500} factor={1.8} fade speed={0.2} />
        <Suspense fallback={null}>
          <Earth simRef={simRef} />
        </Suspense>
        {orbits.map((id) => (
          <OrbitRing key={id} orbitId={id} />
        ))}
        {alive.map((craft) => (
          <Satellite
            key={craft.id}
            craft={craft}
            simRef={simRef}
            flash={flash}
            selected={craft.id === activeCraftId}
            onInspect={onInspect}
          />
        ))}
        {jobActive && active ? <Beam craft={active} simRef={simRef} /> : null}
        {PPIS.map((p) => (
          <Marker key={p.id} lat={p.lat} lon={p.lon} color="#7ec8c5" simRef={simRef} />
        ))}
        {contracts
          .filter((c) => c.status === "active" || c.status === "pipeline")
          .map((c) => (
            <Marker
              key={c.id}
              lat={c.lat}
              lon={c.lon}
              color={c.status === "pipeline" ? "#f0d48a" : "#e07a5f"}
              simRef={simRef}
              pulse={c.status === "active"}
            />
          ))}
        <OrbitControls
          enablePan={false}
          enableRotate
          enableZoom
          minDistance={4.8}
          maxDistance={8.2}
          enableDamping
          dampingFactor={0.08}
        />
      </Canvas>
      <p className="pointer-events-none absolute bottom-3 left-3 rounded-full bg-black/45 px-3 py-1 font-mono text-[10px] text-zinc-300">
        тап по КА · телеметрия · {alive.length} на орбите
      </p>
    </div>
  );
}
