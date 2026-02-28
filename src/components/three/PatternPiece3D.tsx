import { useRef, useState } from "react";
import * as THREE from "three";
import { useSpring, animated } from "@react-spring/three";
import { Float, Html } from "@react-three/drei";
import type { PatternPieceData } from "@/data/pattern-pieces";

interface PatternPiece3DProps {
  piece: PatternPieceData;
  assembled: boolean;
  delay: number;
  highlighted: boolean;
  dimmed: boolean;
  onPointerOver: () => void;
  onPointerOut: () => void;
  onClick: () => void;
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
}: PatternPiece3DProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  const spring = useSpring({
    position: assembled ? piece.assembledPosition : piece.flatPosition,
    rotation: assembled ? piece.assembledRotation : piece.flatRotation,
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

  const geometry = new THREE.ExtrudeGeometry(piece.shape, {
    depth: 0.02,
    bevelEnabled: false,
  });
  geometry.center();

  const content = (
    <animated.mesh
      ref={meshRef}
      position={spring.position as any}
      rotation={spring.rotation as any}
      scale={spring.scale}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
      onClick={handleClick}
      geometry={geometry}
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
      {/* Label */}
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

  // Only float when not assembled
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
