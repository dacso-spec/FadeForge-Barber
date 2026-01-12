import React from 'react';
import { createRoot } from 'react-dom/client';
import FloatingToolsHero from './FloatingToolsHero.jsx';

const canUseWebGL = () => {
  if (typeof window === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    const gl =
      canvas.getContext('webgl2') ||
      canvas.getContext('webgl') ||
      canvas.getContext('experimental-webgl');
    return !!gl;
  } catch (error) {
    return false;
  }
};

console.log('🛠️ Initializing Floating 3D Tools...');
const container = document.getElementById('floating-tools-hero-container');

if (container) {
  if (!canUseWebGL()) {
    console.warn('⚠️ WebGL unavailable. Skipping Floating 3D Tools.');
  } else {
    console.log('✅ Container found, rendering 3D scene...');
    try {
      const root = createRoot(container);
      root.render(React.createElement(FloatingToolsHero));
      console.log('🎨 3D Tools rendered successfully!');
    } catch (error) {
      console.error('❌ Error rendering 3D Tools:', error);
    }
  }
} else {
  console.warn('⚠️ Container #floating-tools-hero-container not found!');
}
