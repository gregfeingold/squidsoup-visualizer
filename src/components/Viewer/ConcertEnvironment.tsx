import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useAudioStore } from '../../stores/audioStore';

// Generate crowd silhouette positions
function generateCrowdPositions(count: number, radius: number, minRadius: number = 3): THREE.Vector3[] {
  const positions: THREE.Vector3[] = [];

  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + Math.random() * 0.3;
    const r = minRadius + Math.random() * (radius - minRadius);
    const x = Math.cos(angle) * r;
    const z = Math.sin(angle) * r;
    positions.push(new THREE.Vector3(x, 0, z));
  }

  return positions;
}

// Single crowd person silhouette
function CrowdPerson({ position, scale = 1 }: { position: THREE.Vector3; scale?: number }) {
  const meshRef = useRef<THREE.Group>(null);
  const { analysis } = useAudioStore();
  const baseY = useRef(Math.random() * 0.1);
  const bouncePhase = useRef(Math.random() * Math.PI * 2);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;

    // Subtle bounce to the beat
    const bounce = analysis.beat ? 0.15 : 0;
    const idleBounce = Math.sin(clock.elapsedTime * 2 + bouncePhase.current) * 0.02;
    const audioBounce = analysis.bass * 0.1;

    meshRef.current.position.y = baseY.current + bounce + idleBounce + audioBounce;

    // Subtle sway
    meshRef.current.rotation.z = Math.sin(clock.elapsedTime * 0.5 + bouncePhase.current) * 0.05;
  });

  return (
    <group ref={meshRef} position={position} scale={scale}>
      {/* Body */}
      <mesh position={[0, 0.7, 0]}>
        <capsuleGeometry args={[0.2, 0.6, 4, 8]} />
        <meshBasicMaterial color="#050505" />
      </mesh>
      {/* Head */}
      <mesh position={[0, 1.35, 0]}>
        <sphereGeometry args={[0.15, 8, 8]} />
        <meshBasicMaterial color="#050505" />
      </mesh>
      {/* Arms up (some people) */}
      {Math.random() > 0.6 && (
        <>
          <mesh position={[-0.25, 1.1, 0]} rotation={[0, 0, -0.4]}>
            <capsuleGeometry args={[0.06, 0.4, 4, 8]} />
            <meshBasicMaterial color="#050505" />
          </mesh>
          <mesh position={[0.25, 1.1, 0]} rotation={[0, 0, 0.4]}>
            <capsuleGeometry args={[0.06, 0.4, 4, 8]} />
            <meshBasicMaterial color="#050505" />
          </mesh>
        </>
      )}
    </group>
  );
}

// DJ Booth in the center
function DJBooth() {
  const djRef = useRef<THREE.Group>(null);
  const { analysis } = useAudioStore();

  useFrame(({ clock }) => {
    if (!djRef.current) return;
    // DJ bounces to the beat
    const bounce = analysis.beat ? 0.08 : 0;
    djRef.current.position.y = bounce + analysis.bass * 0.05;
  });

  return (
    <group position={[0, 0, 0]}>
      {/* DJ Table/Booth */}
      <mesh position={[0, 0.5, 0]}>
        <boxGeometry args={[2, 1, 1]} />
        <meshStandardMaterial color="#1a1a2e" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Equipment on table */}
      <mesh position={[-0.4, 1.05, 0]}>
        <boxGeometry args={[0.5, 0.1, 0.4]} />
        <meshStandardMaterial color="#2a2a4e" emissive="#3a3a6e" emissiveIntensity={0.3} />
      </mesh>
      <mesh position={[0.4, 1.05, 0]}>
        <boxGeometry args={[0.5, 0.1, 0.4]} />
        <meshStandardMaterial color="#2a2a4e" emissive="#3a3a6e" emissiveIntensity={0.3} />
      </mesh>

      {/* DJ Figure */}
      <group ref={djRef} position={[0, 0, -0.7]}>
        {/* Body */}
        <mesh position={[0, 1.2, 0]}>
          <capsuleGeometry args={[0.25, 0.7, 4, 8]} />
          <meshBasicMaterial color="#080808" />
        </mesh>
        {/* Head */}
        <mesh position={[0, 1.85, 0]}>
          <sphereGeometry args={[0.18, 8, 8]} />
          <meshBasicMaterial color="#080808" />
        </mesh>
        {/* Arms reaching to decks */}
        <mesh position={[-0.35, 1.3, 0.3]} rotation={[0.5, 0, -0.3]}>
          <capsuleGeometry args={[0.07, 0.5, 4, 8]} />
          <meshBasicMaterial color="#080808" />
        </mesh>
        <mesh position={[0.35, 1.3, 0.3]} rotation={[0.5, 0, 0.3]}>
          <capsuleGeometry args={[0.07, 0.5, 4, 8]} />
          <meshBasicMaterial color="#080808" />
        </mesh>
      </group>

      {/* Small lights on booth */}
      <pointLight position={[-0.4, 1.1, 0.3]} color="#ff0066" intensity={0.5} distance={2} />
      <pointLight position={[0.4, 1.1, 0.3]} color="#00ffff" intensity={0.5} distance={2} />
    </group>
  );
}

// Speaker stacks
function SpeakerStack({ position, side }: { position: [number, number, number]; side: 'left' | 'right' }) {
  const { analysis } = useAudioStore();

  return (
    <group position={position}>
      {/* Main speaker cabinet */}
      <mesh position={[0, 1, 0]}>
        <boxGeometry args={[1.2, 2, 0.8]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.3} roughness={0.7} />
      </mesh>
      {/* Speaker cone detail */}
      <mesh position={[0, 1.3, 0.41]}>
        <circleGeometry args={[0.4, 16]} />
        <meshStandardMaterial color="#0a0a0a" />
      </mesh>
      <mesh position={[0, 0.6, 0.41]}>
        <circleGeometry args={[0.25, 16]} />
        <meshStandardMaterial color="#0a0a0a" />
      </mesh>
      {/* Sub bass */}
      <mesh position={[0, 2.5, 0]}>
        <boxGeometry args={[1, 1, 0.8]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.3} roughness={0.7} />
      </mesh>
      {/* Bass reactive light */}
      <pointLight
        position={[side === 'left' ? 0.7 : -0.7, 1, 0.5]}
        color={side === 'left' ? '#ff3366' : '#3366ff'}
        intensity={analysis.bass * 2}
        distance={4}
      />
    </group>
  );
}

export function ConcertEnvironment() {
  // Generate crowd positions
  const crowdPositions = useMemo(() => {
    const positions: { pos: THREE.Vector3; scale: number }[] = [];

    // Front row (closer, bigger)
    const frontRow = generateCrowdPositions(20, 8, 4);
    frontRow.forEach(pos => positions.push({ pos, scale: 0.9 + Math.random() * 0.2 }));

    // Middle rows
    const midRow = generateCrowdPositions(35, 12, 8);
    midRow.forEach(pos => positions.push({ pos, scale: 0.8 + Math.random() * 0.2 }));

    // Back rows (further, slightly smaller due to perspective)
    const backRow = generateCrowdPositions(50, 18, 12);
    backRow.forEach(pos => positions.push({ pos, scale: 0.7 + Math.random() * 0.2 }));

    return positions;
  }, []);

  return (
    <group>
      {/* DJ Booth in center */}
      <DJBooth />

      {/* Speaker stacks */}
      <SpeakerStack position={[-4, 0, -2]} side="left" />
      <SpeakerStack position={[4, 0, -2]} side="right" />

      {/* Crowd silhouettes */}
      {crowdPositions.map((crowd, i) => (
        <CrowdPerson key={i} position={crowd.pos} scale={crowd.scale} />
      ))}

      {/* Floor - using BasicMaterial so it's not affected by lighting */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
        <circleGeometry args={[25, 64]} />
        <meshBasicMaterial color="#2a2a35" />
      </mesh>

      {/* Ambient stage lighting */}
      <ambientLight intensity={0.15} />
      <pointLight position={[0, 8, 0]} color="#4400ff" intensity={0.5} distance={25} />
    </group>
  );
}
