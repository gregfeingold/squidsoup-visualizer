import { useRef, useEffect, useCallback, useState } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { PointerLockControls as DreiPointerLockControls } from '@react-three/drei';
import * as THREE from 'three';

interface FirstPersonControlsProps {
  speed?: number;
  enabled?: boolean;
}

// Detect if device is mobile/tablet
export const isMobile = () => {
  if (typeof window === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    (navigator.maxTouchPoints && navigator.maxTouchPoints > 2);
};

export function FirstPersonControls({ speed = 5, enabled = true }: FirstPersonControlsProps) {
  const controlsRef = useRef<any>(null);
  const { camera, gl } = useThree();
  const [useMobileControls] = useState(isMobile);

  // Gyroscope state
  const gyroEnabled = useRef(false);
  const initialOrientation = useRef<{ alpha: number; beta: number; gamma: number } | null>(null);
  const euler = useRef(new THREE.Euler(0, 0, 0, 'YXZ'));

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

  // Mobile gyroscope controls
  useEffect(() => {
    if (!useMobileControls || !enabled) return;

    const handleOrientation = (event: DeviceOrientationEvent) => {
      if (!gyroEnabled.current) return;

      const { alpha, beta, gamma } = event;
      if (alpha === null || beta === null || gamma === null) return;

      // Store initial orientation on first reading
      if (!initialOrientation.current) {
        initialOrientation.current = { alpha, beta, gamma };
        return;
      }

      // Calculate relative rotation from initial position
      const deltaAlpha = (alpha - initialOrientation.current.alpha) * Math.PI / 180;
      const deltaBeta = (beta - initialOrientation.current.beta) * Math.PI / 180;

      // Apply rotation to camera (inverted for natural feel)
      euler.current.setFromQuaternion(camera.quaternion);
      euler.current.y = -deltaAlpha;
      euler.current.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, -deltaBeta * 0.5));
      camera.quaternion.setFromEuler(euler.current);
    };

    // Request permission for iOS 13+
    const requestPermission = async () => {
      if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
        try {
          const permission = await (DeviceOrientationEvent as any).requestPermission();
          if (permission === 'granted') {
            gyroEnabled.current = true;
            window.addEventListener('deviceorientation', handleOrientation);
          }
        } catch (e) {
          console.log('Gyroscope permission denied');
        }
      } else {
        // Non-iOS devices
        gyroEnabled.current = true;
        window.addEventListener('deviceorientation', handleOrientation);
      }
    };

    // Start on first touch
    const handleTouch = () => {
      if (!gyroEnabled.current) {
        requestPermission();
      }
      gl.domElement.removeEventListener('touchstart', handleTouch);
    };

    gl.domElement.addEventListener('touchstart', handleTouch);

    return () => {
      gl.domElement.removeEventListener('touchstart', handleTouch);
      window.removeEventListener('deviceorientation', handleOrientation);
      gyroEnabled.current = false;
      initialOrientation.current = null;
    };
  }, [useMobileControls, enabled, camera, gl]);

  // Update movement each frame
  useFrame((_, delta) => {
    // Desktop requires pointer lock, mobile uses gyroscope (always "active")
    const isActive = useMobileControls ? gyroEnabled.current : controlsRef.current?.isLocked;
    if (!isActive || !enabled) return;

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
