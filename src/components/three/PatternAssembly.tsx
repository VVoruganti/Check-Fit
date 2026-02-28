import { useState, useCallback } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, ContactShadows } from "@react-three/drei";
import PatternPiece3D from "./PatternPiece3D";
import DressForm from "./DressForm";
import type { PatternPieceData } from "@/data/pattern-pieces";
import type { BodyMeasurements } from "@/types/measurements";

interface PatternAssemblyProps {
  assembled: boolean;
  isolatedPiece: string | null;
  onHoverPiece: (id: string | null) => void;
  onClickPiece: (id: string) => void;
  pieces?: PatternPieceData[];
  measurements?: BodyMeasurements;
}

export default function PatternAssembly({
  assembled,
  isolatedPiece,
  onHoverPiece,
  onClickPiece,
  pieces = [],
  measurements,
}: PatternAssemblyProps) {
  const [hoveredPiece, setHoveredPiece] = useState<string | null>(null);

  const handleHover = useCallback(
    (id: string | null) => {
      setHoveredPiece(id);
      onHoverPiece(id);
    },
    [onHoverPiece],
  );

  return (
    <Canvas
      camera={{ position: [0, 1, 5], fov: 45 }}
      style={{ background: "transparent" }}
      shadows
    >
      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight
        position={[5, 8, 5]}
        intensity={1}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <directionalLight position={[-3, 4, -3]} intensity={0.3} />
      <pointLight position={[0, 3, 0]} intensity={0.2} />

      {/* Environment for subtle reflections */}
      <Environment preset="studio" environmentIntensity={0.3} />

      {/* Ground shadow */}
      <ContactShadows
        position={[0, -1.9, 0]}
        opacity={0.4}
        scale={10}
        blur={2}
        far={4}
      />

      {/* Dress form */}
      <DressForm measurements={measurements} />

      {/* Pattern pieces */}
      {pieces.map((piece, index) => (
        <PatternPiece3D
          key={piece.id}
          piece={piece}
          assembled={assembled}
          delay={index * 200}
          highlighted={
            hoveredPiece === piece.id || isolatedPiece === piece.id
          }
          dimmed={isolatedPiece !== null && isolatedPiece !== piece.id}
          onPointerOver={() => handleHover(piece.id)}
          onPointerOut={() => handleHover(null)}
          onClick={() => onClickPiece(piece.id)}
        />
      ))}

      {/* Controls */}
      <OrbitControls
        makeDefault
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI / 1.5}
        minDistance={2.5}
        maxDistance={10}
        enableDamping
        dampingFactor={0.05}
      />

      {/* Grid helper — subtle */}
      <gridHelper
        args={[20, 40, "#d4c4b0", "#e8ddd0"]}
        position={[0, -1.85, 0]}
      />
    </Canvas>
  );
}
