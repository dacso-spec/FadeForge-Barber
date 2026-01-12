import * as THREE from 'three';

const BRAND_COLORS = {
  darkGrey: new THREE.Color('#2d2d2d'),
  emberRed: new THREE.Color('#ff6b6b'),
  smokeFade: new THREE.Color('#4a4a4a')
};

class EmberVortex {
  constructor(host, options = {}) {
    this.host = host;
    this.variant = options.variant || host.dataset.emberVortex || 'soft';
    this.container = null;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.particles = null;
    this.particleCount = options.particleCount || (this.variant === 'overlay' ? 2600 : 2000);
    this.scrollSpeed = 0;
    this.baseSpeed = options.baseSpeed ?? 0.5;
    this.clock = new THREE.Clock();
    this.isVisible = true;
    this.resizeObserver = null;
    this.visibilityObserver = null;

    this.enabled = this.init();
    if (!this.enabled) return;

    this.animate();
    this.setupScrollListener();
    this.setupVisibilityObserver();
  }

  init() {
    this.host.classList.add('ember-vortex-host');

    this.container = document.createElement('div');
    this.container.className = 'ember-vortex-layer';
    this.container.dataset.variant = this.variant;
    this.container.style.opacity = this.variant === 'overlay' ? '0.45' : '0.28';
    this.host.prepend(this.container);

    const rect = this.host.getBoundingClientRect();
    const width = Math.max(1, rect.width);
    const height = Math.max(1, rect.height);

    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(BRAND_COLORS.darkGrey, 0.0015);

    this.camera = new THREE.PerspectiveCamera(70, width / height, 0.1, 1000);
    this.camera.position.z = 50;
    this.camera.position.y = -10;

    try {
      this.renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance'
      });
    } catch (error) {
      this.teardown();
      console.warn('⚠️ EmberVortex disabled: WebGL context unavailable.', error);
      return false;
    }
    this.renderer.setSize(width, height, false);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';
    this.renderer.domElement.style.display = 'block';
    this.container.appendChild(this.renderer.domElement);

    this.createParticles();
    this.observeResize();
    return true;
  }

  teardown() {
    if (this.container) {
      this.container.remove();
    }
    this.host.classList.remove('ember-vortex-host');
  }

  observeResize() {
    this.resizeObserver = new ResizeObserver((entries) => {
      entries.forEach((entry) => {
        const { width, height } = entry.contentRect;
        if (!width || !height) return;
        this.onResize(width, height);
      });
    });

    this.resizeObserver.observe(this.host);
  }

  createParticles() {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(this.particleCount * 3);
    const colors = new Float32Array(this.particleCount * 3);
    const sizes = new Float32Array(this.particleCount);
    const randoms = new Float32Array(this.particleCount);
    const speeds = new Float32Array(this.particleCount);
    const angles = new Float32Array(this.particleCount);
    const radii = new Float32Array(this.particleCount);

    for (let i = 0; i < this.particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 5 + Math.random() * 30;
      const height = -30 + Math.random() * 60;

      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = height;
      positions[i * 3 + 2] = Math.sin(angle) * radius;

      const heightRatio = (height + 30) / 60;
      const color = new THREE.Color();

      if (heightRatio < 0.3) {
        color.lerpColors(BRAND_COLORS.emberRed, BRAND_COLORS.darkGrey, heightRatio / 0.3);
      } else {
        color.lerpColors(BRAND_COLORS.darkGrey, BRAND_COLORS.smokeFade, (heightRatio - 0.3) / 0.7);
      }

      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;

      sizes[i] = 0.45 + Math.random() * 1.6 * (1 - heightRatio * 0.45);
      randoms[i] = Math.random();
      speeds[i] = 0.45 + Math.random() * 0.5;
      angles[i] = angle;
      radii[i] = radius;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute('random', new THREE.BufferAttribute(randoms, 1));
    geometry.setAttribute('speed', new THREE.BufferAttribute(speeds, 1));
    geometry.setAttribute('angle', new THREE.BufferAttribute(angles, 1));
    geometry.setAttribute('radius', new THREE.BufferAttribute(radii, 1));

    const material = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        pixelRatio: { value: this.renderer.getPixelRatio() }
      },
      vertexShader: `
        attribute float size;
        attribute float random;
        attribute float speed;
        attribute float angle;
        attribute float radius;
        attribute vec3 color;
        uniform float time;
        uniform float pixelRatio;
        varying vec3 vColor;
        varying float vAlpha;

        void main() {
          vColor = color;

          float animatedAngle = angle + time * speed * 0.22;
          float animatedHeight = position.y + time * speed * 2.0;

          float heightMod = mod(animatedHeight + 30.0, 60.0) - 30.0;

          vec3 animatedPosition;
          animatedPosition.x = cos(animatedAngle) * radius;
          animatedPosition.y = heightMod;
          animatedPosition.z = sin(animatedAngle) * radius;

          vec4 mvPosition = modelViewMatrix * vec4(animatedPosition, 1.0);
          gl_PointSize = size * pixelRatio * (220.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;

          vAlpha = 1.0 - (heightMod + 30.0) / 70.0;
          vAlpha = clamp(vAlpha, 0.0, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vAlpha;

        void main() {
          vec2 center = gl_PointCoord - 0.5;
          float dist = length(center);
          float alpha = smoothstep(0.5, 0.0, dist);
          float glow = pow(alpha, 1.8);

          gl_FragColor = vec4(vColor * glow, vAlpha * glow);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });

    this.particles = new THREE.Points(geometry, material);
    this.scene.add(this.particles);
  }

  setupScrollListener() {
    let lastScrollY = 0;

    window.addEventListener('scroll', () => {
      const currentScrollY = window.scrollY;
      const scrollDelta = Math.abs(currentScrollY - lastScrollY);

      this.scrollSpeed = Math.min(scrollDelta * 0.008, 2.0);

      setTimeout(() => {
        this.scrollSpeed *= 0.9;
        if (this.scrollSpeed < 0.01) this.scrollSpeed = 0;
      }, 120);

      lastScrollY = currentScrollY;
    });
  }

  setupVisibilityObserver() {
    this.visibilityObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          this.isVisible = entry.isIntersecting;
        });
      },
      { threshold: 0.1 }
    );

    this.visibilityObserver.observe(this.host);
  }

  animate() {
    if (!this.enabled) return;
    requestAnimationFrame(() => this.animate());

    if (!this.isVisible) return;

    const delta = this.clock.getDelta();
    const elapsedTime = this.clock.getElapsedTime();

    if (this.particles) {
      const totalSpeed = this.baseSpeed + this.scrollSpeed;
      this.particles.material.uniforms.time.value += delta * totalSpeed;

      this.camera.position.x = Math.sin(elapsedTime * 0.12) * 1.8;
      this.camera.position.y = -10 + Math.sin(elapsedTime * 0.15) * 0.9;
    }

    if (!this.renderer || !this.scene || !this.camera) return;
    this.renderer.render(this.scene, this.camera);
  }

  onResize(width, height) {
    if (!this.renderer || !this.camera) return;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));

    if (this.particles) {
      this.particles.material.uniforms.pixelRatio.value = this.renderer.getPixelRatio();
    }
  }
}

function canUseWebGL() {
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
}

function initEmberVortex() {
  const targets = document.querySelectorAll('[data-ember-vortex]');
  if (!targets.length) return;

  if (!canUseWebGL()) {
    console.warn('⚠️ WebGL unavailable. Ember vortex disabled.');
    return;
  }

  targets.forEach((target) => {
    new EmberVortex(target, { variant: target.dataset.emberVortex });
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initEmberVortex);
} else {
  initEmberVortex();
}
