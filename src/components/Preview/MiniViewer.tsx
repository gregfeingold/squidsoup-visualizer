import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Grid } from '@react-three/drei';
import { LightGrid } from '../Viewer/LightGrid';
import { ConcertEnvironment } from '../Viewer/ConcertEnvironment';

export function MiniViewer() {
  return (
    <Canvas className="bg-[#1a1a1f]" style={{ position: 'relative', zIndex: 0 }}>
      <PerspectiveCamera makeDefault position={[20, 12, 20]} fov={50} />
      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={8}
        maxDistance={60}
        target={[0, 5, 0]}
      />

      {/* Very dark ambient for concert atmosphere */}
      <ambientLight intensity={0.02} />

      {/* Fog for atmosphere */}
      <fog attach="fog" args={['#1a1a1f', 35, 90]} />

      {/* Grid floor - bright cyan lines */}
      <Grid
        position={[0, 0, 0]}
        args={[50, 50]}
        cellSize={2}
        cellThickness={0.5}
        cellColor="#00aacc"
        sectionSize={10}
        sectionThickness={0.8}
        sectionColor="#00ddff"
        fadeDistance={50}
        fadeStrength={1}
        infiniteGrid
      />

      {/* Concert environment (crowd, DJ, speakers) */}
      <ConcertEnvironment />

      {/* The light grid */}
      <LightGrid />
    </Canvas>
  );
}
