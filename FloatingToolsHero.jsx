import React, { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, Float, useGLTF } from '@react-three/drei';
import * as THREE from 'three';

const BRAND_RED = '#FF4D4D';
const CHROME_TINT = '#F5F6F7';
const DARK_METAL = '#16181c';
const ACCENT_KEYWORDS = ['handle', 'grip', 'ring', 'rubber', 'plastic', 'red'];
const METAL_KEYWORDS = ['blade', 'metal', 'steel', 'chrome', 'silver', 'edge'];
const DARK_KEYWORDS = ['hinge', 'pin', 'pivot', 'bolt', 'cap', 'black'];

const ASSET_BASE = import.meta.env.BASE_URL || '/';
const MODEL_PATHS = {
  scissors: `${ASSET_BASE}assets/barbers_scissors.glb`,
  razor: `${ASSET_BASE}assets/straight_razor.glb`,
  comb: `${ASSET_BASE}assets/cc0_-_hair_comb_6.glb`
};

useGLTF.preload(MODEL_PATHS.scissors);
useGLTF.preload(MODEL_PATHS.razor);
useGLTF.preload(MODEL_PATHS.comb);

function usePointerAndScroll() {
  const pointer = useRef({ x: 0, y: 0 });
  const scrollY = useRef(0);

  useEffect(() => {
    const handlePointer = (event) => {
      const { innerWidth, innerHeight } = window;
      if (!innerWidth || !innerHeight) return;
      pointer.current.x = (event.clientX / innerWidth) * 2 - 1;
      pointer.current.y = -(event.clientY / innerHeight) * 2 + 1;
    };

    const handleScroll = () => {
      scrollY.current = window.scrollY || document.documentElement.scrollTop || 0;
    };

    handleScroll();
    window.addEventListener('pointermove', handlePointer, { passive: true });
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('pointermove', handlePointer);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return { pointer, scrollY };
}

function FloatingWrapper({ position, rotation, floatProps, pointer, children }) {
  const groupRef = useRef();
  const baseRotation = useRef(rotation);

  useFrame(() => {
    if (!groupRef.current) return;
    const targetX = baseRotation.current[0] + pointer.current.y * 0.18;
    const targetY = baseRotation.current[1] + pointer.current.x * 0.22;

    groupRef.current.rotation.x = THREE.MathUtils.lerp(
      groupRef.current.rotation.x,
      targetX,
      0.07
    );
    groupRef.current.rotation.y = THREE.MathUtils.lerp(
      groupRef.current.rotation.y,
      targetY,
      0.07
    );
  });

  return (
    <Float {...floatProps}>
      <group ref={groupRef} position={position} rotation={rotation}>
        {children}
      </group>
    </Float>
  );
}

function usePremiumMaterials() {
  return useMemo(() => {
    const chrome = new THREE.MeshPhysicalMaterial({
      color: CHROME_TINT,
      metalness: 0.95,
      roughness: 0.18,
      clearcoat: 1,
      clearcoatRoughness: 0.18,
      reflectivity: 0.9,
      envMapIntensity: 1.9
    });

    const accent = new THREE.MeshStandardMaterial({
      color: BRAND_RED,
      metalness: 0.55,
      roughness: 0.32,
      envMapIntensity: 1.4,
      emissive: new THREE.Color('#8a1515'),
      emissiveIntensity: 0.25
    });

    const dark = new THREE.MeshStandardMaterial({
      color: '#2a2d33',
      metalness: 0.35,
      roughness: 0.5,
      envMapIntensity: 1
    });

    return { chrome, accent, dark };
  }, []);
}

function applyMaterials(root, chrome, accent, dark) {
  root.traverse((child) => {
    if (!child.isMesh) return;
    const name = `${child.name} ${child.material?.name || ''}`.toLowerCase();
    let nextMaterial = null;

    if (ACCENT_KEYWORDS.some((key) => name.includes(key))) {
      nextMaterial = accent;
    } else if (METAL_KEYWORDS.some((key) => name.includes(key))) {
      nextMaterial = chrome;
    } else if (DARK_KEYWORDS.some((key) => name.includes(key))) {
      nextMaterial = dark;
    }

    if (nextMaterial) {
      child.material = Array.isArray(child.material)
        ? child.material.map(() => nextMaterial)
        : nextMaterial;
    } else if (child.material) {
      const baseMaterials = Array.isArray(child.material) ? child.material : [child.material];
      const updatedMaterials = baseMaterials.map((material) => {
        if (!material.isMeshStandardMaterial && !material.isMeshPhysicalMaterial) {
          return new THREE.MeshStandardMaterial({
            color: CHROME_TINT,
            metalness: 0.4,
            roughness: 0.4,
            envMapIntensity: 1.2
          });
        }
        material.metalness = Math.min(material.metalness ?? 0.4, 0.85);
        material.roughness = Math.min(material.roughness ?? 0.45, 0.6);
        material.envMapIntensity = 1.2;
        return material;
      });

      child.material = Array.isArray(child.material)
        ? updatedMaterials
        : updatedMaterials[0];
    }

    if (child.material) {
      const mats = Array.isArray(child.material) ? child.material : [child.material];
      mats.forEach((material) => {
        material.side = THREE.DoubleSide;
        material.needsUpdate = true;
      });
    }
  });
}

function useFittedModel(groupRef, scene, targetSize) {
  useLayoutEffect(() => {
    if (!groupRef.current) return;
    const box = new THREE.Box3().setFromObject(scene);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();

    box.getSize(size);
    box.getCenter(center);

    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    const scale = targetSize / maxDim;

    groupRef.current.scale.setScalar(scale);
    groupRef.current.position.set(-center.x * scale, -center.y * scale, -center.z * scale);
  }, [scene, targetSize, groupRef]);
}

function Scissors({ chrome, accent }) {
  const { scene } = useGLTF(MODEL_PATHS.scissors);
  const groupRef = useRef();

  useLayoutEffect(() => {
    applyMaterials(scene, chrome, accent, chrome);
  }, [scene, chrome, accent]);

  useFittedModel(groupRef, scene, 1.4);

  return (
    <group ref={groupRef}>
      <primitive object={scene} />
    </group>
  );
}

function Razor({ chrome, accent, dark }) {
  const { scene } = useGLTF(MODEL_PATHS.razor);
  const groupRef = useRef();

  useLayoutEffect(() => {
    applyMaterials(scene, chrome, accent, dark);
  }, [scene, chrome, accent, dark]);

  useFittedModel(groupRef, scene, 1.6);

  return (
    <group ref={groupRef}>
      <primitive object={scene} />
    </group>
  );
}

function Comb({ chrome, accent }) {
  const { scene } = useGLTF(MODEL_PATHS.comb);
  const groupRef = useRef();

  useLayoutEffect(() => {
    applyMaterials(scene, chrome, accent, chrome);
  }, [scene, chrome, accent]);

  useFittedModel(groupRef, scene, 1.2);

  return (
    <group ref={groupRef}>
      <primitive object={scene} />
    </group>
  );
}

function Scene() {
  const groupRef = useRef();
  const { pointer, scrollY } = usePointerAndScroll();
  const { chrome, accent, dark } = usePremiumMaterials();

  useFrame(() => {
    if (!groupRef.current) return;
    const viewportHeight = window.innerHeight || 1;
    const progress = Math.min(scrollY.current / viewportHeight, 1);
    groupRef.current.position.y = progress * 1.25;
    groupRef.current.rotation.z = THREE.MathUtils.lerp(
      groupRef.current.rotation.z,
      progress * 0.12,
      0.08
    );
  });

  return (
    <>
      <ambientLight intensity={0.6} />
      <hemisphereLight
        skyColor="#f6f6f6"
        groundColor="#2a1012"
        intensity={0.35}
      />
      <directionalLight position={[5, 6, 4]} intensity={1.2} />
      <directionalLight position={[-4, 3, -4]} intensity={0.6} color={BRAND_RED} />
      <pointLight position={[0, 2, 4]} intensity={0.5} />
      <spotLight position={[0, 7, 3]} angle={0.35} penumbra={0.7} intensity={0.8} />
      <Environment preset="studio" />

      <group ref={groupRef}>
        <FloatingWrapper
          position={[2.1, 0.65, -1.6]}
          rotation={[0.15, 0.55, -0.12]}
          floatProps={{
            speed: 1.2,
            rotationIntensity: 0.5,
            floatIntensity: 0.7,
            floatingRange: [-0.2, 0.22]
          }}
          pointer={pointer}
        >
          <Scissors chrome={chrome} accent={accent} />
        </FloatingWrapper>

        <FloatingWrapper
          position={[-2.4, 0.2, -2.0]}
          rotation={[-0.2, -0.5, 0.12]}
          floatProps={{
            speed: 1.05,
            rotationIntensity: 0.55,
            floatIntensity: 0.6,
            floatingRange: [-0.25, 0.2]
          }}
          pointer={pointer}
        >
          <Razor chrome={chrome} accent={accent} dark={dark} />
        </FloatingWrapper>

        <FloatingWrapper
          position={[0.8, -1.2, -1.8]}
          rotation={[0.28, 0.2, 0.18]}
          floatProps={{
            speed: 1.15,
            rotationIntensity: 0.4,
            floatIntensity: 0.55,
            floatingRange: [-0.18, 0.2]
          }}
          pointer={pointer}
        >
          <Comb chrome={chrome} accent={accent} />
        </FloatingWrapper>
      </group>
    </>
  );
}

export default function FloatingToolsHero() {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none'
      }}
    >
      <Canvas
        camera={{ position: [0, 0, 6], fov: 42 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        dpr={[1, 1.5]}
      >
        <Scene />
      </Canvas>
    </div>
  );
}
