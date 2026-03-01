import { useMemo, useRef } from "react";
import * as THREE from "three";
import type { BodyMeasurements } from "@/types/measurements";
import { SCALE } from "@/lib/generators/utils";

interface DressFormProps {
  measurements?: BodyMeasurements;
}

/**
 * Procedural wireframe dress form / mannequin.
 * When measurements are provided, the profile is computed dynamically.
 * No external model needed — built from lathe geometry.
 */
export default function DressForm({ measurements }: DressFormProps) {
  const groupRef = useRef<THREE.Group>(null);

  const profilePoints = useMemo(() => {
    if (!measurements) {
      // Default static profile (original)
      return [
        new THREE.Vector2(0.15, -1.8),
        new THREE.Vector2(0.15, -1.6),
        new THREE.Vector2(0.08, -1.55),
        new THREE.Vector2(0.08, -1.2),
        new THREE.Vector2(0.35, -1.1),
        new THREE.Vector2(0.45, -0.7),
        new THREE.Vector2(0.38, -0.3),
        new THREE.Vector2(0.35, -0.1),
        new THREE.Vector2(0.38, 0.1),
        new THREE.Vector2(0.48, 0.5),
        new THREE.Vector2(0.45, 0.7),
        new THREE.Vector2(0.35, 0.9),
        new THREE.Vector2(0.2, 1.1),
        new THREE.Vector2(0.12, 1.2),
        new THREE.Vector2(0.1, 1.35),
      ];
    }

    // Dynamically compute profile from measurements
    const bustR = (measurements.bust / (2 * Math.PI)) * SCALE;
    const waistR = (measurements.waist / (2 * Math.PI)) * SCALE;
    const hipR = (measurements.hip / (2 * Math.PI)) * SCALE;
    const neckR = (measurements.neck / (2 * Math.PI)) * SCALE;
    const shoulderR = (measurements.shoulderWidth / 2) * SCALE;

    // Vertical layout based on back length
    const totalHeight = measurements.backLength * SCALE;
    const shoulderY = totalHeight * 0.6;
    const bustY = shoulderY - totalHeight * 0.25;
    const waistY = shoulderY - totalHeight * 0.65;
    const hipY = waistY - 8 * SCALE;

    // Stand/pole positions
    const standBottom = hipY - totalHeight * 0.5;
    const poleBottom = hipY - totalHeight * 0.1;

    return [
      new THREE.Vector2(0.15, standBottom),     // base bottom
      new THREE.Vector2(0.15, standBottom + 0.2), // stand
      new THREE.Vector2(0.08, standBottom + 0.25),// stand neck
      new THREE.Vector2(0.08, poleBottom),       // pole
      new THREE.Vector2(hipR * 0.7, hipY - 0.1),// hip start
      new THREE.Vector2(hipR, hipY),             // hip widest
      new THREE.Vector2(waistR + 0.03, (hipY + waistY) / 2), // above hip
      new THREE.Vector2(waistR, waistY),         // waist narrowest
      new THREE.Vector2(waistR + 0.03, (waistY + bustY) / 2), // below bust
      new THREE.Vector2(bustR, bustY),           // bust
      new THREE.Vector2(bustR - 0.03, (bustY + shoulderY) / 2), // upper chest
      new THREE.Vector2(shoulderR * 0.65, shoulderY - 0.15), // shoulder slope
      new THREE.Vector2(neckR + 0.08, shoulderY),// neck base
      new THREE.Vector2(neckR, shoulderY + 0.1), // neck
      new THREE.Vector2(neckR - 0.02, shoulderY + 0.2), // neck top
    ];
  }, [measurements]);

  const armCapsule = useMemo(() => {
    if (!measurements) return null;

    const armR = (measurements.upperArm / (2 * Math.PI)) * SCALE;
    const shoulderHalfW = (measurements.shoulderWidth / 2) * SCALE;
    const totalHeight = measurements.backLength * SCALE;
    const shoulderY = totalHeight * 0.6;
    const length = Math.max(measurements.armLength * SCALE * 0.42, 0.45);
    const y = shoulderY - 0.08;

    return {
      radius: Math.max(armR * 0.9, 0.06),
      length,
      leftPos: [-shoulderHalfW - length * 0.45, y, 0] as [number, number, number],
      rightPos: [shoulderHalfW + length * 0.45, y, 0] as [number, number, number],
    };
  }, [measurements]);

  return (
    <group ref={groupRef} position={[0, 0.1, 0]}>
      {/* Main form - wireframe */}
      <mesh>
        <latheGeometry args={[profilePoints, 32]} />
        <meshStandardMaterial
          color="#e8e0d8"
          wireframe
          transparent
          opacity={0.3}
        />
      </mesh>
      {/* Solid inner form - very transparent */}
      <mesh>
        <latheGeometry args={[profilePoints, 32]} />
        <meshStandardMaterial
          color="#f0e8e0"
          transparent
          opacity={0.08}
          side={THREE.DoubleSide}
        />
      </mesh>

      {armCapsule && (
        <>
          <mesh position={armCapsule.leftPos} rotation={[0, 0, Math.PI / 2]}>
            <capsuleGeometry args={[armCapsule.radius, armCapsule.length, 8, 16]} />
            <meshStandardMaterial
              color="#d8d1c7"
              wireframe
              transparent
              opacity={0.24}
            />
          </mesh>
          <mesh position={armCapsule.rightPos} rotation={[0, 0, Math.PI / 2]}>
            <capsuleGeometry args={[armCapsule.radius, armCapsule.length, 8, 16]} />
            <meshStandardMaterial
              color="#d8d1c7"
              wireframe
              transparent
              opacity={0.24}
            />
          </mesh>
        </>
      )}
    </group>
  );
}
