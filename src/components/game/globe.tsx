"use client";

import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei";
import * as THREE from "three";
import { EARTH_R, PPIS, SAT_R } from "@/lib/game/data";
import { makeEarthCanvases } from "@/lib/game/earth";
import { latLonToXyz, orbitPoints, rotateY, satEci } from "@/lib/game/orbit";
import type { Contract, SimRef } from "@/lib/game/types";

function Earth({ simRef }: { simRef: SimRef }) {
  const group = useRef<THREE.Group>(null);
  const textures = useMemo(() => {
    const { day } = makeEarthCanvases();
    const map = new THREE.CanvasTexture(day);
    map.needsUpdate = true;
    map.minFilter = THREE.LinearFilter;
    map.magFilter = THREE.LinearFilter;
    return { map };
  }, []);

  useEffect(() => () => {
    textures.map.dispose();
  }, [textures]);

  useFrame(() => {
    if (group.current) group.current.rotation.y = simRef.current.earthAngle;
  });

  return (
    <group ref={group}>
      <mesh>
        <sphereGeometry args={[EARTH_R, 64, 48]} />
        <meshPhongMaterial
          color="#ffffff"
          map={textures.map}
          shininess={12}
          specular="#335577"
          toneMapped={false}
        />
      </mesh>
      <mesh>
        <sphereGeometry args={[EARTH_R * 1.03, 32, 24]} />
        <meshBasicMaterial color="#9ad4e0" transparent opacity={0.12} side={THREE.BackSide} toneMapped={false} />
      </mesh>
    </group>
  );
}

function OrbitRing() {
  const tube = useMemo(() => {
    const pts = orbitPoints().map((p) => new THREE.Vector3(p.x, p.y, p.z));
    const curve = new THREE.CatmullRomCurve3(pts, true);
    return new THREE.TubeGeometry(curve, 160, 0.014, 8, true);
  }, []);
  useEffect(() => () => tube.dispose(), [tube]);
  return (
    <mesh geometry={tube}>
      <meshBasicMaterial color="#e8a25a" />
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
    if (mat.current) {
      const on = flash > 0 && performance.now() - flash < 500;
      mat.current.emissiveIntensity = on ? 2 : 0;
    }
  });
  return (
    <group ref={ref}>
      <mesh>
        <boxGeometry args={[0.07, 0.07, 0.16]} />
        <meshStandardMaterial
          ref={mat}
          color="#d7dde6"
          metalness={0.4}
          roughness={0.3}
          emissive="#fff6d2"
          emissiveIntensity={0}
        />
      </mesh>
      <mesh position={[0.14, 0, 0]}>
        <boxGeometry args={[0.18, 0.004, 0.08]} />
        <meshStandardMaterial color="#1b3a6b" emissive="#3a7ad9" emissiveIntensity={0.6} />
      </mesh>
      <mesh position={[-0.14, 0, 0]}>
        <boxGeometry args={[0.18, 0.004, 0.08]} />
        <meshStandardMaterial color="#1b3a6b" emissive="#3a7ad9" emissiveIntensity={0.6} />
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
        <sphereGeometry args={[0.055, 12, 12]} />
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
    <div className="relative h-[46vh] min-h-[260px] w-full overflow-hidden bg-[#05070d] sm:h-[52vh] lg:h-auto lg:min-h-[520px] lg:flex-1">
      <Canvas
        camera={{ position: [0, 0.55, 5.4], fov: 38 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: false, toneMapping: THREE.NoToneMapping }}
      >
        <color attach="background" args={["#070b14"]} />
        <ambientLight intensity={1.1} />
        <directionalLight position={[4, 2, 3]} intensity={1.4} color="#fff6e0" />
        <Stars radius={60} depth={30} count={400} factor={1.6} fade speed={0.2} />
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
          enableZoom={false}
          minDistance={4.8}
          maxDistance={6.2}
          enableDamping
          dampingFactor={0.08}
        />
      </Canvas>
      <div className="pointer-events-none absolute bottom-3 left-3 flex flex-wrap gap-2 font-mono text-[10px] text-zinc-300">
        <span className="rounded-full bg-black/45 px-2 py-1">орбита</span>
        <span className="rounded-full bg-black/45 px-2 py-1 text-teal">ППИ</span>
        <span className="rounded-full bg-black/45 px-2 py-1 text-copper">цель</span>
      </div>
    </div>
  );
}
