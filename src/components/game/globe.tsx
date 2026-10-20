"use client";

import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Line, OrbitControls, Stars } from "@react-three/drei";
import * as THREE from "three";
import { EARTH_R, PPIS, SAT_R } from "@/lib/game/data";
import { makeEarthCanvases } from "@/lib/game/earth";
import { latLonToXyz, orbitPoints, rotateY, satEci } from "@/lib/game/orbit";
import type { Contract, SimRef } from "@/lib/game/types";

function Earth({ simRef }: { simRef: SimRef }) {
  const group = useRef<THREE.Group>(null);
  const textures = useMemo(() => {
    const { day, night } = makeEarthCanvases();
    const map = new THREE.CanvasTexture(day);
    const emissive = new THREE.CanvasTexture(night);
    map.colorSpace = THREE.SRGBColorSpace;
    emissive.colorSpace = THREE.SRGBColorSpace;
    return { map, emissive };
  }, []);

  useEffect(() => () => {
    textures.map.dispose();
    textures.emissive.dispose();
  }, [textures]);

  useFrame(() => {
    if (group.current) group.current.rotation.y = simRef.current.earthAngle;
  });

  return (
    <group ref={group}>
      <mesh>
        <sphereGeometry args={[EARTH_R, 64, 48]} />
        <meshStandardMaterial
          map={textures.map}
          emissiveMap={textures.emissive}
          emissive="#ffd2a0"
          emissiveIntensity={0.55}
          roughness={0.92}
          metalness={0.05}
        />
      </mesh>
      <mesh>
        <sphereGeometry args={[EARTH_R * 1.035, 48, 32]} />
        <meshBasicMaterial color="#7ec8c5" transparent opacity={0.07} side={THREE.BackSide} />
      </mesh>
    </group>
  );
}

function OrbitRing() {
  const pts = useMemo(
    () => orbitPoints().map((p) => new THREE.Vector3(p.x, p.y, p.z)),
    [],
  );
  return <Line points={pts} color="#e8a25a" transparent opacity={0.75} lineWidth={1} />;
}

function Satellite({ simRef, flash }: { simRef: SimRef; flash: number }) {
  const ref = useRef<THREE.Group>(null);
  const mat = useRef<THREE.MeshStandardMaterial>(null);
  useFrame(() => {
    if (!ref.current) return;
    const p = satEci(simRef.current.anomaly);
    ref.current.position.set(p.x, p.y, p.z);
    ref.current.lookAt(0, 0, 0);
    if (mat.current) {
      const on = flash > 0 && performance.now() - flash < 500;
      mat.current.emissiveIntensity = on ? 2 : 0;
    }
  });
  return (
    <group ref={ref}>
      <mesh>
        <boxGeometry args={[0.045, 0.045, 0.1]} />
        <meshStandardMaterial
          ref={mat}
          color="#d7dde6"
          metalness={0.4}
          roughness={0.3}
          emissive="#fff6d2"
          emissiveIntensity={0}
        />
      </mesh>
      <mesh position={[0.09, 0, 0]}>
        <boxGeometry args={[0.12, 0.002, 0.05]} />
        <meshStandardMaterial color="#1b3a6b" emissive="#245" emissiveIntensity={0.4} />
      </mesh>
      <mesh position={[-0.09, 0, 0]}>
        <boxGeometry args={[0.12, 0.002, 0.05]} />
        <meshStandardMaterial color="#1b3a6b" emissive="#245" emissiveIntensity={0.4} />
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
    const s = pulse ? 1 + Math.sin(performance.now() / 180) * 0.18 : 1;
    ref.current.scale.setScalar(s);
  });
  return (
    <group ref={ref}>
      <mesh>
        <sphereGeometry args={[0.035, 12, 12]} />
        <meshBasicMaterial color={color} />
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
    const len = SAT_R - EARTH_R;
    ref.current.scale.set(1, 1, len / 2);
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
    <div className="relative h-[42vh] min-h-[240px] w-full overflow-hidden rounded-b-3xl bg-[#05070d] sm:h-[52vh]">
      <Canvas
        camera={{ position: [0, 1.15, 5.6], fov: 42 }}
        dpr={[1, 1.6]}
        gl={{ antialias: true, alpha: false }}
      >
        <color attach="background" args={["#05070d"]} />
        <ambientLight intensity={0.35} />
        <directionalLight position={[6, 2, 3]} intensity={1.35} color="#fff4dd" />
        <Stars radius={40} depth={20} count={800} factor={2} fade speed={0.4} />
        <Earth simRef={simRef} />
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
          minDistance={3.6}
          maxDistance={8}
          enableDamping
          dampingFactor={0.08}
        />
      </Canvas>
    </div>
  );
}
