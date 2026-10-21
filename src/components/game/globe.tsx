"use client";

import { Suspense, useMemo, useRef } from "react";
import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei";
import * as THREE from "three";
import { EARTH_R, PPIS, SAT_R } from "@/lib/game/data";
import { latLonToXyz, orbitPoints, rotateY, satEci } from "@/lib/game/orbit";
import type { Contract, SimRef } from "@/lib/game/types";

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

function OrbitRing() {
  const curve = useMemo(() => {
    const pts = orbitPoints().map((p) => new THREE.Vector3(p.x, p.y, p.z));
    return new THREE.CatmullRomCurve3(pts, true);
  }, []);
  return (
    <mesh>
      <tubeGeometry args={[curve, 128, 0.012, 8, true]} />
      <meshBasicMaterial color="#e8a25a" toneMapped={false} />
    </mesh>
  );
}

function Satellite({ simRef, flash }: { simRef: SimRef; flash: number }) {
  const ref = useRef<THREE.Group>(null);
  const mat = useRef<THREE.MeshStandardMaterial>(null);
  useFrame(() => {
    if (!ref.current) return;
    const p = satEci(simRef.current.anomaly);
    ref.current.position.set(p.x, p.y, p.z);
    ref.current.lookAt(0, 0, 0);
    if (mat.current) mat.current.emissiveIntensity = flash > 0 && performance.now() - flash < 500 ? 2 : 0.2;
  });
  return (
    <group ref={ref}>
      <mesh>
        <boxGeometry args={[0.07, 0.07, 0.14]} />
        <meshStandardMaterial ref={mat} color="#e8edf2" emissive="#fff6d2" emissiveIntensity={0.2} />
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

function Beam({ simRef }: { simRef: SimRef }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(() => {
    if (!ref.current) return;
    const p = satEci(simRef.current.anomaly);
    ref.current.position.set(p.x / 2, p.y / 2, p.z / 2);
    ref.current.lookAt(p.x, p.y, p.z);
    ref.current.scale.set(1, 1, (SAT_R - EARTH_R) / 2);
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
  flash,
  jobActive,
}: {
  simRef: SimRef;
  contracts: Contract[];
  flash: number;
  jobActive: boolean;
}) {
  return (
    <div className="relative h-[46vh] min-h-[280px] w-full overflow-hidden bg-[#070b14] sm:h-[52vh] lg:h-auto lg:min-h-[520px] lg:flex-1">
      <Canvas
        camera={{ position: [0, 0.45, 5.3], fov: 38 }}
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
        <OrbitRing />
        <Satellite simRef={simRef} flash={flash} />
        {jobActive ? <Beam simRef={simRef} /> : null}
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
          minDistance={4.6}
          maxDistance={7}
          enableDamping
          dampingFactor={0.08}
        />
      </Canvas>
      <p className="pointer-events-none absolute bottom-3 left-3 rounded-full bg-black/45 px-3 py-1 font-mono text-[10px] text-zinc-300">
        крути пальцем · орбита · ППИ · цель
      </p>
    </div>
  );
}
