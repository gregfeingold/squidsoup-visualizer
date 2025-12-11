import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { usePatternStore } from '../../stores/patternStore';
import { useAudioStore } from '../../stores/audioStore';
import { evaluatePatterns } from '../../patterns/generators';
import { AudioAnalysis } from '../../patterns/types';
import { useTimelinePlayback } from '../../hooks/useTimelinePlayback';

// Seeded random for deterministic grid generation
function seededRandom(seed: number): () => number {
  return () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
}

export function LightGrid() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const glowMeshRef = useRef<THREE.InstancedMesh>(null);

  // Get store values - use timeline-aware patterns
  const timelinePatterns = useTimelinePlayback();
  const activeColorSchemeId = usePatternStore((s) => s.activeColorSchemeId);
  const colorSchemes = usePatternStore((s) => s.colorSchemes);
  const customColors = usePatternStore((s) => s.customColors);
  const gridConfig = usePatternStore((s) => s.gridConfig);
  const analysis = useAudioStore((s) => s.analysis);

  // Parse colors - memoized
  const colors = useMemo(() => {
    const scheme = customColors.length > 0
      ? { colors: customColors }
      : colorSchemes.find((s) => s.id === activeColorSchemeId) || colorSchemes[0];
    return scheme.colors.map((c) => new THREE.Color(c));
  }, [activeColorSchemeId, colorSchemes, customColors]);

  // Generate FIXED point positions
  const { positions, count } = useMemo(() => {
    const { mode, dimensions, pointCount, distribution } = gridConfig;
    const points: THREE.Vector3[] = [];
    const random = seededRandom(12345);

    if (mode === '3d') {
      if (distribution === 'grid') {
        const stringsX = Math.ceil(Math.sqrt(pointCount / 20));
        const stringsZ = stringsX;
        const pointsPerString = Math.ceil(pointCount / (stringsX * stringsZ));

        for (let sx = 0; sx < stringsX && points.length < pointCount; sx++) {
          for (let sz = 0; sz < stringsZ && points.length < pointCount; sz++) {
            const x = (sx / (stringsX - 1) - 0.5) * dimensions.width;
            const z = (sz / (stringsZ - 1) - 0.5) * dimensions.depth;

            for (let py = 0; py < pointsPerString && points.length < pointCount; py++) {
              const y = (py / pointsPerString) * dimensions.height + 1;
              points.push(new THREE.Vector3(x, y, z));
            }
          }
        }
      } else if (distribution === 'random') {
        const stringCount = Math.ceil(pointCount / 15);
        const pointsPerString = Math.ceil(pointCount / stringCount);

        for (let s = 0; s < stringCount && points.length < pointCount; s++) {
          const x = (random() - 0.5) * dimensions.width;
          const z = (random() - 0.5) * dimensions.depth;

          for (let py = 0; py < pointsPerString && points.length < pointCount; py++) {
            const y = (py / pointsPerString) * dimensions.height + 0.5 + random() * 0.5;
            points.push(new THREE.Vector3(x, y, z));
          }
        }
      } else {
        const clusterCount = 8;
        const stringsPerCluster = Math.ceil(pointCount / (clusterCount * 12));

        for (let c = 0; c < clusterCount; c++) {
          const cx = (random() - 0.5) * dimensions.width * 0.7;
          const cz = (random() - 0.5) * dimensions.depth * 0.7;

          for (let s = 0; s < stringsPerCluster && points.length < pointCount; s++) {
            const x = cx + (random() - 0.5) * 4;
            const z = cz + (random() - 0.5) * 4;
            const stringHeight = 8 + random() * 4;
            const pointsInString = 10 + Math.floor(random() * 8);

            for (let py = 0; py < pointsInString && points.length < pointCount; py++) {
              const y = (py / pointsInString) * stringHeight + 1;
              points.push(new THREE.Vector3(x, y, z));
            }
          }
        }
      }
    } else {
      const cols = Math.ceil(Math.sqrt(pointCount * (dimensions.width / dimensions.height)));
      const rows = Math.ceil(pointCount / cols);

      for (let y = 0; y < rows && points.length < pointCount; y++) {
        for (let x = 0; x < cols && points.length < pointCount; x++) {
          points.push(
            new THREE.Vector3(
              (x / (cols - 1) - 0.5) * dimensions.width,
              (y / (rows - 1)) * dimensions.height + 1,
              0
            )
          );
        }
      }
    }

    return { positions: points, count: points.length };
  }, [gridConfig]);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Store previous intensities for smooth lerping
  const prevIntensities = useRef<Float32Array | null>(null);
  const prevColors = useRef<Float32Array | null>(null);

  // Initialize instance matrices and intensity buffers
  useEffect(() => {
    if (!meshRef.current) return;

    const mesh = meshRef.current;
    const glowMesh = glowMeshRef.current;

    prevIntensities.current = new Float32Array(count);
    prevColors.current = new Float32Array(count);

    if (!mesh.instanceColor) {
      mesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(count * 3), 3);
    }
    if (glowMesh && !glowMesh.instanceColor) {
      glowMesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(count * 3), 3);
    }

    for (let i = 0; i < count; i++) {
      dummy.position.copy(positions[i]);
      dummy.scale.setScalar(0.08);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);

      if (glowMesh) {
        dummy.scale.setScalar(0.2);
        dummy.updateMatrix();
        glowMesh.setMatrixAt(i, dummy.matrix);
      }

      mesh.instanceColor!.setXYZ(i, 0, 0, 0);
      if (glowMesh?.instanceColor) {
        glowMesh.instanceColor.setXYZ(i, 0, 0, 0);
      }
    }

    mesh.instanceMatrix.needsUpdate = true;
    mesh.instanceColor!.needsUpdate = true;
    if (glowMesh) {
      glowMesh.instanceMatrix.needsUpdate = true;
      glowMesh.instanceColor!.needsUpdate = true;
    }
  }, [positions, count, dummy]);

  const frameCount = useRef(0);

  // Animation frame - GENTLE transitions
  useFrame(({ clock }) => {
    if (!meshRef.current || !prevIntensities.current || !prevColors.current) return;

    frameCount.current++;
    if (frameCount.current % 2 !== 0) return;

    const mesh = meshRef.current;
    const glowMesh = glowMeshRef.current;
    const time = clock.getElapsedTime();

    const audioData: AudioAnalysis = analysis.timestamp > 0
      ? analysis
      : {
          bass: 0, mid: 0, treble: 0, amplitude: 0,
          beat: false, bpm: 0,
          frequencyData: new Uint8Array(0), timestamp: 0,
        };

    // Use timeline-aware patterns (already filtered by enabled status)
    const enabledPatterns = timelinePatterns.filter(p => p.enabled);
    const hasPatterns = enabledPatterns.length > 0;
    const colorCount = colors.length;

    // MUCH gentler lerp rates for smoother transitions
    const lerpUp = 0.12;    // Slower fade in
    const lerpDown = 0.04;  // Much slower fade out for trails

    // Global intensity - when no audio loaded (timestamp=0), use full intensity
    // When audio is loaded, scale based on amplitude
    const hasAudioLoaded = analysis.timestamp > 0;
    const amplitudeNormalized = Math.min(1, audioData.amplitude);
    // If no audio loaded, use full intensity; otherwise scale with amplitude
    const globalIntensity = hasAudioLoaded ? (0.4 + amplitudeNormalized * 0.6) : 1.0;

    for (let i = 0; i < count; i++) {
      const position = positions[i];

      let targetIntensity = 0;
      let targetColorShift = 0;

      if (hasPatterns) {
        const result = evaluatePatterns(position, time, enabledPatterns, audioData);
        // Scale by global intensity
        targetIntensity = result.intensity * globalIntensity;
        targetColorShift = result.colorShift;
      }

      // Even gentler lerp
      const prevI = prevIntensities.current[i];
      const lerpFactor = targetIntensity > prevI ? lerpUp : lerpDown;
      const smoothIntensity = prevI + (targetIntensity - prevI) * lerpFactor;
      prevIntensities.current[i] = smoothIntensity;

      // Smooth color lerp
      const prevC = prevColors.current[i];
      const smoothColor = prevC + (targetColorShift - prevC) * 0.08;
      prevColors.current[i] = smoothColor;

      // Apply with softer gamma curve
      const ledIntensity = Math.pow(smoothIntensity, 0.8);

      // Only show if above a tiny threshold (more negative space)
      const finalIntensity = ledIntensity > 0.02 ? ledIntensity : 0;

      const colorIndex = smoothColor * (colorCount - 1);
      const colorAIndex = Math.floor(colorIndex) % colorCount;
      const colorBIndex = (colorAIndex + 1) % colorCount;
      const colorT = colorIndex - Math.floor(colorIndex);

      const colorA = colors[colorAIndex];
      const colorB = colors[colorBIndex];

      // Boost brightness by ~10%
      const brightnessMult = 1.1;
      const r = (colorA.r + (colorB.r - colorA.r) * colorT) * finalIntensity * brightnessMult;
      const g = (colorA.g + (colorB.g - colorA.g) * colorT) * finalIntensity * brightnessMult;
      const b = (colorA.b + (colorB.b - colorA.b) * colorT) * finalIntensity * brightnessMult;

      mesh.instanceColor!.setXYZ(i, r, g, b);

      if (glowMesh?.instanceColor) {
        const glowI = finalIntensity * 0.7; // Increased from 0.6 to 0.7
        glowMesh.instanceColor.setXYZ(i, r * glowI, g * glowI, b * glowI);
      }
    }

    mesh.instanceColor!.needsUpdate = true;
    if (glowMesh?.instanceColor) {
      glowMesh.instanceColor.needsUpdate = true;
    }
  });

  return (
    <group>
      <instancedMesh
        ref={glowMeshRef}
        args={[undefined, undefined, count]}
        frustumCulled={false}
      >
        <sphereGeometry args={[1, 4, 4]} />
        <meshBasicMaterial transparent opacity={0.5} toneMapped={false} />
      </instancedMesh>

      <instancedMesh
        ref={meshRef}
        args={[undefined, undefined, count]}
        frustumCulled={false}
      >
        <sphereGeometry args={[1, 6, 6]} />
        <meshBasicMaterial toneMapped={false} />
      </instancedMesh>
    </group>
  );
}
