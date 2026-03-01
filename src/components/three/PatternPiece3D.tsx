import { useRef, useState, useMemo, useEffect } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useSpring, animated } from "@react-spring/three";
import { Float, Html } from "@react-three/drei";
import type { PatternPieceData } from "@/data/pattern-pieces";
import type { BodyMeasurements } from "@/types/measurements";
import { createPieceGeometry, getWrapRadius } from "@/lib/wrap-geometry";

interface PatternPiece3DProps {
  piece: PatternPieceData;
  assembled: boolean;
  delay: number;
  highlighted: boolean;
  dimmed: boolean;
  onPointerOver: () => void;
  onPointerOut: () => void;
  onClick: () => void;
  measurements?: BodyMeasurements;
  assembledPositionOverride?: [number, number, number];
  assembledRotationOverride?: [number, number, number];
}

export default function PatternPiece3D({
  piece,
  assembled,
  delay,
  highlighted,
  dimmed,
  onPointerOver,
  onPointerOut,
  onClick,
  measurements,
  assembledPositionOverride,
  assembledRotationOverride,
}: PatternPiece3DProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  const wrapRadius = useMemo(() => {
    if (!measurements) return 0.5;
    return getWrapRadius(piece.id, measurements);
  }, [piece.id, measurements]);

  // Create geometry + pre-computed flat & bent vertex arrays
  const pieceGeo = useMemo(
    () =>
      createPieceGeometry(piece.shape, wrapRadius, {
        pieceId: piece.id,
        measurements,
      }),
    [piece.id, piece.shape, wrapRadius, measurements],
  );

  useEffect(() => {
    return () => pieceGeo.geometry.dispose();
  }, [pieceGeo]);

  const spring = useSpring({
    position: assembled
      ? (assembledPositionOverride ?? piece.assembledPosition)
      : piece.flatPosition,
    rotation: assembled
      ? (assembledRotationOverride ?? piece.assembledRotation)
      : piece.flatRotation,
    bendT: assembled ? 1 : 0,
    scale: highlighted ? 1.08 : dimmed ? 0.85 : 1,
    opacity: dimmed ? 0.2 : hovered ? 0.9 : 0.7,
    emissiveIntensity: hovered || highlighted ? 0.15 : 0,
    delay: assembled ? delay : 0,
    config: {
      mass: 2,
      tension: assembled ? 80 : 120,
      friction: 26,
    },
  });

  // Lerp vertex positions between flat and bent each frame
  useFrame(() => {
    const t = (spring.bendT as any).get() as number;
    const pos = pieceGeo.geometry.getAttribute("position");
    const arr = pos.array as Float32Array;
    const { flatVerts, bentVerts } = pieceGeo;

    for (let i = 0; i < arr.length; i++) {
      arr[i] = flatVerts[i] + (bentVerts[i] - flatVerts[i]) * t;
    }
    pos.needsUpdate = true;

    // Recompute normals so lighting stays correct as the piece bends
    pieceGeo.geometry.computeVertexNormals();
  });

  const handlePointerOver = (e: THREE.Event) => {
    (e as any).stopPropagation();
    setHovered(true);
    onPointerOver();
    document.body.style.cursor = "pointer";
  };

  const handlePointerOut = () => {
    setHovered(false);
    onPointerOut();
    document.body.style.cursor = "auto";
  };

  const handleClick = (e: THREE.Event) => {
    (e as any).stopPropagation();
    onClick();
  };

  const content = (
    <animated.mesh
      ref={meshRef}
      position={spring.position as any}
      rotation={spring.rotation as any}
      scale={spring.scale}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
      onClick={handleClick}
      geometry={pieceGeo.geometry}
    >
      <animated.meshStandardMaterial
        color={piece.color}
        transparent
        opacity={spring.opacity}
        emissive={piece.color}
        emissiveIntensity={spring.emissiveIntensity as any}
        side={THREE.DoubleSide}
        roughness={0.8}
        metalness={0.05}
      />
      {(hovered || highlighted) && (
        <Html center distanceFactor={6} style={{ pointerEvents: "none" }}>
          <div
            className="rounded-lg border bg-background/95 px-3 py-1.5 shadow-lg backdrop-blur"
            style={{ whiteSpace: "nowrap" }}
          >
            <p className="text-sm font-medium">{piece.name}</p>
            <p className="text-xs text-muted-foreground">
              {piece.instructions}
            </p>
          </div>
        </Html>
      )}
    </animated.mesh>
  );

  if (!assembled) {
    return (
      <Float
        speed={1.5}
        rotationIntensity={0.2}
        floatIntensity={0.3}
        floatingRange={[-0.05, 0.05]}
      >
        {content}
      </Float>
    );
  }

  return content;
}
