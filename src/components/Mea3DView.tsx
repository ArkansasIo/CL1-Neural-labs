import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { NeuralCultureSimulator } from '../simulation/neuralCulture';
import { GROUNDED_CHANNELS, REFERENCE_CHANNELS, FLAG_HAS_SPIKE, FLAG_HAS_STIM } from '../types/cl1';
import { RotateCcw, Eye, Zap, Layers } from 'lucide-react';

interface Mea3DViewProps {
  simulator: NeuralCultureSimulator;
  onSelectChannel: (channel: number) => void;
  onStimulateChannel: (channel: number) => void;
}

export const Mea3DView: React.FC<Mea3DViewProps> = ({
  simulator,
  onSelectChannel,
  onStimulateChannel,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredChannel, setHoveredChannel] = useState<number | null>(null);
  const [wireframeMode, setWireframeMode] = useState<boolean>(false);
  const [cameraView, setCameraView] = useState<'perspective' | 'top'>('perspective');

  // Three.js instances
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const terrainMeshRef = useRef<THREE.Mesh | null>(null);
  const electrodeMeshesRef = useRef<THREE.Mesh[]>([]);
  const particleSystemRef = useRef<THREE.Points | null>(null);

  // Mouse interaction for orbit
  const isDragging = useRef(false);
  const previousMousePosition = useRef({ x: 0, y: 0 });
  const cameraAngle = useRef({ theta: Math.PI / 4, phi: Math.PI / 3, radius: 24 });

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color('#070b14');
    scene.fog = new THREE.FogExp2('#070b14', 0.025);

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    cameraRef.current = camera;
    updateCameraPosition();

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    rendererRef.current = renderer;
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 4. Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0x38bdf8, 1.2);
    dirLight.position.set(15, 25, 15);
    scene.add(dirLight);

    const pointLight = new THREE.PointLight(0x48ff00, 1.5, 30);
    pointLight.position.set(0, 5, 0);
    scene.add(pointLight);

    // 5. Silicon Substrate Chip Base
    const chipGeo = new THREE.BoxGeometry(16, 0.8, 16);
    const chipMat = new THREE.MeshStandardMaterial({
      color: 0x111827,
      roughness: 0.3,
      metalness: 0.8,
    });
    const chipMesh = new THREE.Mesh(chipGeo, chipMat);
    chipMesh.position.y = -0.4;
    scene.add(chipMesh);

    // Chip border circuit trace ring
    const borderGeo = new THREE.RingGeometry(8, 8.4, 4);
    const borderMat = new THREE.MeshBasicMaterial({ color: 0x0284c7, wireframe: true });
    const borderMesh = new THREE.Mesh(borderGeo, borderMat);
    borderMesh.rotation.x = -Math.PI / 2;
    borderMesh.position.y = 0.05;
    scene.add(borderMesh);

    // 6. 8x8 Gold Microelectrode Pads
    const electrodeMeshes: THREE.Mesh[] = [];
    const padGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.15, 16);

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const ch = c * 8 + r;
        const x = (c - 3.5) * 1.7;
        const z = (r - 3.5) * 1.7;

        const isGrounded = GROUNDED_CHANNELS.includes(ch as any);
        const isRef = REFERENCE_CHANNELS.includes(ch as any);

        const padMat = new THREE.MeshStandardMaterial({
          color: isGrounded ? 0x475569 : isRef ? 0x64748b : 0xf59e0b, // Gold pads
          roughness: 0.2,
          metalness: 0.9,
          emissive: isGrounded ? 0x000000 : 0x221500,
        });

        const pad = new THREE.Mesh(padGeo, padMat);
        pad.position.set(x, 0.08, z);
        pad.userData = { channel: ch };
        scene.add(pad);
        electrodeMeshes[ch] = pad;
      }
    }
    electrodeMeshesRef.current = electrodeMeshes;

    // 7. Dynamic Neural Monolayer / Potential Terrain Mesh
    // 32x32 vertex grid across the MEA
    const terrainGeo = new THREE.PlaneGeometry(14, 14, 32, 32);
    terrainGeo.rotateX(-Math.PI / 2);
    const terrainMat = new THREE.MeshStandardMaterial({
      color: 0x0ea5e9,
      wireframe: false,
      transparent: true,
      opacity: 0.65,
      roughness: 0.4,
      metalness: 0.3,
    });
    const terrainMesh = new THREE.Mesh(terrainGeo, terrainMat);
    terrainMesh.position.y = 0.25;
    scene.add(terrainMesh);
    terrainMeshRef.current = terrainMesh;

    // 8. Glowing Biological Spike Particles
    const particleCount = 200;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    const particleColors = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      particlePositions[i * 3] = (Math.random() - 0.5) * 12;
      particlePositions[i * 3 + 1] = 0.5 + Math.random() * 2;
      particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 12;

      particleColors[i * 3] = 0.28;     // R
      particleColors[i * 3 + 1] = 1.0;  // G
      particleColors[i * 3 + 2] = 0.0;  // B
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    particleGeo.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));

    const particleMat = new THREE.PointsMaterial({
      size: 0.2,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
    });
    const particleSystem = new THREE.Points(particleGeo, particleMat);
    scene.add(particleSystem);
    particleSystemRef.current = particleSystem;

    // Animation Loop
    let animId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      // Update terrain heights based on simulated extracellular voltages
      if (terrainMeshRef.current) {
        const posAttr = terrainMeshRef.current.geometry.attributes.position;
        const firingRates = simulator.getFiringRates();

        for (let i = 0; i < posAttr.count; i++) {
          const vx = posAttr.getX(i);
          const vz = posAttr.getZ(i);

          // Find nearest electrode
          const c = Math.round(vx / 1.7 + 3.5);
          const r = Math.round(vz / 1.7 + 3.5);

          let height = 0;
          if (r >= 0 && r < 8 && c >= 0 && c < 8) {
            const ch = c * 8 + r;
            const rate = firingRates[ch] || 0;
            // Height represents extracellular activity + wave ripples
            const ripple = Math.sin(vx * 1.2 + vz * 1.2 + elapsed * 3) * 0.15;
            height = (rate / 15) * 1.8 + ripple;
          }
          posAttr.setY(i, Math.max(0, height));
        }
        posAttr.needsUpdate = true;
      }

      // Rotate particle clouds slightly
      if (particleSystemRef.current) {
        particleSystemRef.current.rotation.y = elapsed * 0.08;
      }

      renderer.render(scene, camera);
    };

    animate();

    // Resize Handler
    const handleResize = () => {
      if (!containerRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    };
  }, []);

  // Subscribe to frames to flash electrodes
  useEffect(() => {
    const unsubscribe = simulator.onFrame((frame) => {
      if (!electrodeMeshesRef.current) return;

      for (let ch = 0; ch < 64; ch++) {
        const mesh = electrodeMeshesRef.current[ch];
        if (!mesh) continue;
        const mat = mesh.material as THREE.MeshStandardMaterial;

        if (frame.flags[ch] & FLAG_HAS_STIM) {
          mat.emissive.setHex(0x41ffff); // Cyan stim flash
          setTimeout(() => {
            mat.emissive.setHex(0x221500);
          }, 180);
        } else if (frame.flags[ch] & FLAG_HAS_SPIKE) {
          mat.emissive.setHex(0x48ff00); // Bright green spike flash
          setTimeout(() => {
            mat.emissive.setHex(0x221500);
          }, 140);
        }
      }
    });
    return () => {
      unsubscribe();
    };
  }, [simulator]);

  // Wireframe toggle
  useEffect(() => {
    if (terrainMeshRef.current) {
      (terrainMeshRef.current.material as THREE.MeshStandardMaterial).wireframe = wireframeMode;
    }
  }, [wireframeMode]);

  const updateCameraPosition = () => {
    if (!cameraRef.current) return;
    const { theta, phi, radius } = cameraAngle.current;
    cameraRef.current.position.x = radius * Math.sin(phi) * Math.sin(theta);
    cameraRef.current.position.y = radius * Math.cos(phi);
    cameraRef.current.position.z = radius * Math.sin(phi) * Math.cos(theta);
    cameraRef.current.lookAt(0, 0, 0);
  };

  // Mouse drag handlers for Orbit
  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    previousMousePosition.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return;
    const deltaX = e.clientX - previousMousePosition.current.x;
    const deltaY = e.clientY - previousMousePosition.current.y;

    cameraAngle.current.theta -= deltaX * 0.008;
    cameraAngle.current.phi = Math.max(0.1, Math.min(Math.PI / 2 - 0.05, cameraAngle.current.phi - deltaY * 0.008));
    updateCameraPosition();

    previousMousePosition.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  const handleWheel = (e: React.WheelEvent) => {
    cameraAngle.current.radius = Math.max(10, Math.min(45, cameraAngle.current.radius + e.deltaY * 0.02));
    updateCameraPosition();
  };

  const resetCamera = () => {
    cameraAngle.current = { theta: Math.PI / 4, phi: Math.PI / 3, radius: 24 };
    updateCameraPosition();
  };

  const setTopView = () => {
    cameraAngle.current = { theta: 0, phi: 0.05, radius: 24 };
    updateCameraPosition();
  };

  return (
    <div className="relative w-full h-full bg-[#070b14] select-none overflow-hidden flex flex-col">
      {/* 3D Toolbar */}
      <div className="absolute top-3 left-3 z-10 flex items-center gap-2 bg-[#0b111e]/90 backdrop-blur px-3 py-1.5 rounded-lg border border-slate-800 shadow-xl">
        <button
          onClick={resetCamera}
          className="px-2.5 py-1 text-xs text-slate-300 hover:text-white bg-slate-900 rounded border border-slate-700/80 flex items-center gap-1 transition"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset Orbit</span>
        </button>

        <button
          onClick={setTopView}
          className="px-2.5 py-1 text-xs text-slate-300 hover:text-white bg-slate-900 rounded border border-slate-700/80 flex items-center gap-1 transition"
        >
          <Eye className="w-3 h-3" />
          <span>Top-Down</span>
        </button>

        <button
          onClick={() => setWireframeMode(!wireframeMode)}
          className={`px-2.5 py-1 text-xs rounded border transition flex items-center gap-1 ${
            wireframeMode
              ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
              : 'text-slate-400 hover:text-slate-200 bg-slate-900 border-slate-800'
          }`}
        >
          <Layers className="w-3 h-3" />
          <span>Wireframe: {wireframeMode ? 'ON' : 'OFF'}</span>
        </button>
      </div>

      {/* 3D Legend */}
      <div className="absolute bottom-3 left-3 z-10 bg-[#0b111e]/90 backdrop-blur px-3 py-2 rounded-lg border border-slate-800 text-[11px] font-mono text-slate-400 flex items-center gap-4 shadow-xl">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block"></span>
          <span>Gold MEA Electrodes</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block"></span>
          <span>Action Potential (Spike)</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 inline-block"></span>
          <span>Biphasic Stim Flash</span>
        </span>
        <span className="text-slate-500">Drag to rotate • Scroll to zoom</span>
      </div>

      {/* WebGL Canvas Container */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        className="w-full h-full cursor-grab active:cursor-grabbing"
      />
    </div>
  );
};
