import { useRef, useEffect } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { PointerLockControls as DreiPointerLockControls } from '@react-three/drei';
import * as THREE from 'three';

interface FirstPersonControlsProps {
  speed?: number;
  enabled?: boolean;
}

export function FirstPersonControls({ speed = 5, enabled = true }: FirstPersonControlsProps) {
  const controlsRef = useRef<any>(null);
  const { camera, gl } = useThree();

  // Movement state
  const moveState = useRef({
    forward: false,
    backward: false,
    left: false,
    right: false,
    up: false,
    down: false,
  });

  const velocity = useRef(new THREE.Vector3());
  const direction = useRef(new THREE.Vector3());

  // Handle keyboard input
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          moveState.current.forward = true;
          break;
        case 'KeyS':
        case 'ArrowDown':
          moveState.current.backward = true;
          break;
        case 'KeyA':
        case 'ArrowLeft':
          moveState.current.left = true;
          break;
        case 'KeyD':
        case 'ArrowRight':
          moveState.current.right = true;
          break;
        case 'Space':
          moveState.current.up = true;
          break;
        case 'ShiftLeft':
        case 'ShiftRight':
          moveState.current.down = true;
          break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          moveState.current.forward = false;
          break;
        case 'KeyS':
        case 'ArrowDown':
          moveState.current.backward = false;
          break;
        case 'KeyA':
        case 'ArrowLeft':
          moveState.current.left = false;
          break;
        case 'KeyD':
        case 'ArrowRight':
          moveState.current.right = false;
          break;
        case 'Space':
          moveState.current.up = false;
          break;
        case 'ShiftLeft':
        case 'ShiftRight':
          moveState.current.down = false;
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
    };
  }, [enabled]);

  // Update movement each frame
  useFrame((_, delta) => {
    if (!controlsRef.current?.isLocked || !enabled) return;

    const state = moveState.current;

    // Apply friction
    velocity.current.x -= velocity.current.x * 10 * delta;
    velocity.current.z -= velocity.current.z * 10 * delta;
    velocity.current.y -= velocity.current.y * 10 * delta;

    // Calculate direction
    direction.current.z = Number(state.forward) - Number(state.backward);
    direction.current.x = Number(state.right) - Number(state.left);
    direction.current.y = Number(state.up) - Number(state.down);
    direction.current.normalize();

    // Apply movement
    if (state.forward || state.backward) {
      velocity.current.z -= direction.current.z * speed * delta * 10;
    }
    if (state.left || state.right) {
      velocity.current.x -= direction.current.x * speed * delta * 10;
    }
    if (state.up || state.down) {
      velocity.current.y += direction.current.y * speed * delta * 10;
    }

    // Move the controls (which moves the camera)
    controlsRef.current.moveRight(-velocity.current.x * delta);
    controlsRef.current.moveForward(-velocity.current.z * delta);
    camera.position.y += velocity.current.y * delta;

    // Keep within bounds
    camera.position.x = THREE.MathUtils.clamp(camera.position.x, -25, 25);
    camera.position.y = THREE.MathUtils.clamp(camera.position.y, 0.5, 15);
    camera.position.z = THREE.MathUtils.clamp(camera.position.z, -25, 25);
  });

  return (
    <DreiPointerLockControls
      ref={controlsRef}
      args={[camera, gl.domElement]}
    />
  );
}
