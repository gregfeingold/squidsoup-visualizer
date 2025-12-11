import { useRef, useEffect, useState } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { PointerLockControls as DreiPointerLockControls } from '@react-three/drei';
import * as THREE from 'three';

interface FirstPersonControlsProps {
  speed?: number;
  enabled?: boolean;
  onGyroActive?: (active: boolean) => void;
  gyroPermissionGranted?: boolean;
}

// Detect if device is mobile/tablet
export const isMobile = () => {
  if (typeof window === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    (navigator.maxTouchPoints && navigator.maxTouchPoints > 2);
};

export function FirstPersonControls({ speed = 5, enabled = true, onGyroActive, gyroPermissionGranted = false }: FirstPersonControlsProps) {
  const controlsRef = useRef<any>(null);
  const { camera, gl } = useThree();
  const [useMobileControls] = useState(isMobile);

  // Gyroscope state
  const gyroEnabled = useRef(false);
  const orientationData = useRef<{ alpha: number; beta: number; gamma: number } | null>(null);
  const initialOrientation = useRef<{ alpha: number; beta: number; gamma: number } | null>(null);

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

  // Disconnect controls when disabled or unmounting
  useEffect(() => {
    if (!enabled && controlsRef.current) {
      // Unlock pointer if locked
      if (document.pointerLockElement) {
        document.exitPointerLock();
      }
      // Disconnect the controls to prevent further lock attempts
      controlsRef.current.disconnect();
    }

    return () => {
      // Cleanup on unmount
      if (document.pointerLockElement) {
        document.exitPointerLock();
      }
      if (controlsRef.current) {
        controlsRef.current.disconnect();
      }
    };
  }, [enabled]);

  // Mobile gyroscope controls - listen for orientation when permission granted
  useEffect(() => {
    if (!useMobileControls || !enabled) return;

    const handleOrientation = (event: DeviceOrientationEvent) => {
      const { alpha, beta, gamma } = event;
      if (alpha === null || beta === null || gamma === null) return;

      // Store current orientation data
      orientationData.current = { alpha, beta, gamma };

      // Store initial orientation on first valid reading
      if (!initialOrientation.current) {
        initialOrientation.current = { alpha, beta, gamma };
      }

      // Mark as active once we get valid data
      if (!gyroEnabled.current) {
        gyroEnabled.current = true;
        onGyroActive?.(true);
      }
    };

    // Start listening when permission is granted (from parent component)
    if (gyroPermissionGranted) {
      window.addEventListener('deviceorientation', handleOrientation, true);
    }

    return () => {
      window.removeEventListener('deviceorientation', handleOrientation, true);
      gyroEnabled.current = false;
      orientationData.current = null;
      initialOrientation.current = null;
    };
  }, [useMobileControls, enabled, onGyroActive, gyroPermissionGranted]);

  // Update movement and gyroscope each frame
  useFrame((_, delta) => {
    // Desktop requires pointer lock, mobile uses gyroscope (always "active")
    const isActive = useMobileControls ? gyroEnabled.current : controlsRef.current?.isLocked;
    if (!isActive || !enabled) return;

    // Apply gyroscope rotation for mobile
    // Uses the standard WebXR/three.js approach for device orientation
    if (useMobileControls && orientationData.current && initialOrientation.current) {
      const { alpha, beta, gamma } = orientationData.current;
      const initial = initialOrientation.current;

      // Convert degrees to radians
      const alphaRad = THREE.MathUtils.degToRad(alpha);
      const betaRad = THREE.MathUtils.degToRad(beta);
      const gammaRad = THREE.MathUtils.degToRad(gamma);
      const initialAlphaRad = THREE.MathUtils.degToRad(initial.alpha);

      // Standard device orientation to camera rotation
      // This mimics how three.js DeviceOrientationControls works
      const euler = new THREE.Euler();
      const quaternion = new THREE.Quaternion();
      const q0 = new THREE.Quaternion();
      const q1 = new THREE.Quaternion(-Math.sqrt(0.5), 0, 0, Math.sqrt(0.5)); // -90 deg around X

      // Set rotation order for device orientation
      euler.set(betaRad, alphaRad, -gammaRad, 'YXZ');
      quaternion.setFromEuler(euler);

      // Rotate to align with screen orientation (portrait)
      quaternion.multiply(q1);

      // Apply offset so initial orientation = looking forward
      q0.setFromAxisAngle(new THREE.Vector3(0, 1, 0), -initialAlphaRad);
      quaternion.premultiply(q0);

      camera.quaternion.copy(quaternion);
    }

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

    // Move the camera
    if (useMobileControls) {
      // For mobile, move based on camera direction
      const forward = new THREE.Vector3();
      camera.getWorldDirection(forward);
      forward.y = 0;
      forward.normalize();

      const right = new THREE.Vector3();
      right.crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();

      camera.position.addScaledVector(right, -velocity.current.x * delta);
      camera.position.addScaledVector(forward, -velocity.current.z * delta);
    } else if (controlsRef.current) {
      controlsRef.current.moveRight(-velocity.current.x * delta);
      controlsRef.current.moveForward(-velocity.current.z * delta);
    }
    camera.position.y += velocity.current.y * delta;

    // Keep within bounds
    camera.position.x = THREE.MathUtils.clamp(camera.position.x, -25, 25);
    camera.position.y = THREE.MathUtils.clamp(camera.position.y, 0.5, 15);
    camera.position.z = THREE.MathUtils.clamp(camera.position.z, -25, 25);
  });

  // Mobile uses gyroscope, desktop uses pointer lock
  if (useMobileControls) {
    return null; // Gyroscope controls are handled via useEffect
  }

  return (
    <DreiPointerLockControls
      ref={controlsRef}
      args={[camera, gl.domElement]}
    />
  );
}
