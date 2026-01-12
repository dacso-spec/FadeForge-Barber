document.documentElement.classList.add('js');

document.addEventListener('DOMContentLoaded', () => {
  console.log('FadeForge Barber - Initializing...');
  
  initScrollAnimations();
  initGalleryScroll();
  initHeaderScroll();
  initCardAnimations();
  initButtonEffects();
  initTypingEffect();
  initLottieAnimation();
  initTiltEffects();
  initCountUpAnimations();
  initPageTransitions();
  
  console.log('FadeForge Barber - All systems ready! 🚀');
});

function initScrollAnimations() {
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animated');
        
        if (entry.target.classList.contains('cards')) {
          const cards = entry.target.querySelectorAll('.card');
          cards.forEach((card, index) => {
            setTimeout(() => {
              card.classList.add('animated');
            }, index * 100);
          });
        }
      }
    });
  }, observerOptions);

  document.querySelectorAll('[data-animate]').forEach(el => {
    observer.observe(el);
  });
  
  document.querySelectorAll('.cards').forEach(el => {
    observer.observe(el);
  });
}

function initGalleryScroll() {
  const gallery = document.querySelector('.gallery');
  if (!gallery || !window.gsap || !window.ScrollTrigger) return;

  const gsap = window.gsap;
  const ScrollTrigger = window.ScrollTrigger;

  if (gsap.registerPlugin) {
    gsap.registerPlugin(ScrollTrigger);
  }

  const hScroll = gallery.querySelector('.h-scroll');
  const panels = gsap.utils.toArray('.gallery .panel');
  if (!hScroll || panels.length <= 1) return;

  const media = ScrollTrigger.matchMedia();

  media.add('(min-width: 769px)', () => {
    const scrollDistance = hScroll.scrollWidth - hScroll.clientWidth;
    if (scrollDistance <= 0) {
      return () => {
        gsap.set(hScroll, { clearProps: 'transform' });
      };
    }

    const tween = gsap.to(hScroll, {
      x: -scrollDistance,
      ease: 'none',
      scrollTrigger: {
        id: 'gallery-horizontal',
        trigger: gallery,
        pin: true,
        scrub: 1,
        start: 'top top',
        end: () => `+=${scrollDistance}`,
        invalidateOnRefresh: true
      }
    });

    return () => {
      if (tween.scrollTrigger) {
        tween.scrollTrigger.kill(true);
      }
      tween.kill();
      gsap.set(hScroll, { clearProps: 'transform' });
    };
  });
}

function initHeaderScroll() {
  const header = document.querySelector('.site-header');
  let lastScrollY = window.scrollY;

  window.addEventListener('scroll', () => {
    const currentScrollY = window.scrollY;
    
    if (currentScrollY > 100) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
    
    lastScrollY = currentScrollY;
  });
}

function initCardAnimations() {
  const cards = document.querySelectorAll('.card');
  
  cards.forEach(card => {
    card.addEventListener('mouseenter', () => {
      card.style.transform = 'translateY(-8px) scale(1.02)';
    });
    
    card.addEventListener('mouseleave', () => {
      if (!card.classList.contains('animated')) {
        card.style.transform = 'translateY(30px)';
      } else {
        card.style.transform = 'translateY(0)';
      }
    });
  });
}

function initButtonEffects() {
  const buttons = document.querySelectorAll('.btn');
  
  buttons.forEach(button => {
    if (button.classList.contains('btn--magnetic')) {
      button.addEventListener('mousemove', (e) => {
        const rect = button.getBoundingClientRect();
        const localX = e.clientX - rect.left;
        const localY = e.clientY - rect.top;
        const x = localX - rect.width / 2;
        const y = localY - rect.height / 2;
        
        button.style.setProperty('--x', `${localX}px`);
        button.style.setProperty('--y', `${localY}px`);
        button.style.transform = `translate(${x * 0.2}px, ${y * 0.2}px) scale(1.05)`;
      });
      
      button.addEventListener('mouseleave', () => {
        button.style.transform = '';
        button.style.removeProperty('--x');
        button.style.removeProperty('--y');
      });
    }
    
    button.addEventListener('click', function(e) {
      const ripple = document.createElement('span');
      const rect = this.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const x = e.clientX - rect.left - size / 2;
      const y = e.clientY - rect.top - size / 2;
      
      ripple.style.width = ripple.style.height = size + 'px';
      ripple.style.left = x + 'px';
      ripple.style.top = y + 'px';
      ripple.classList.add('ripple');
      
      this.appendChild(ripple);
      
      setTimeout(() => {
        ripple.remove();
      }, 600);
    });
  });
}

function initTypingEffect() {
  const typingElement = document.getElementById('typing-text');
  if (!typingElement) return;
  
  const phrases = ['Wild Style.', 'Modern Cuts.', 'Classic Craft.', 'Your Look.'];
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) {
    typingElement.textContent = phrases[0];
    return;
  }
  let phraseIndex = 0;
  let charIndex = 0;
  let isDeleting = false;
  
  function type() {
    const currentPhrase = phrases[phraseIndex];
    
    if (isDeleting) {
      typingElement.textContent = currentPhrase.substring(0, charIndex - 1);
      charIndex--;
    } else {
      typingElement.textContent = currentPhrase.substring(0, charIndex + 1);
      charIndex++;
    }
    
    let typeSpeed = isDeleting ? 50 : 100;
    
    if (!isDeleting && charIndex === currentPhrase.length) {
      typeSpeed = 2000;
      isDeleting = true;
    } else if (isDeleting && charIndex === 0) {
      isDeleting = false;
      phraseIndex = (phraseIndex + 1) % phrases.length;
      typeSpeed = 500;
    }
    
    setTimeout(type, typeSpeed);
  }
  
  type();
}

function initLottieAnimation() {
  const lottieContainer = document.getElementById('scissors-lottie');
  if (!lottieContainer) return;
  lottieContainer.innerHTML = '';
}

function initTiltEffects() {
  const tiltCards = document.querySelectorAll('.tilt-card');
  
  tiltCards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      
      const tiltX = (y - 0.5) * 10;
      const tiltY = (0.5 - x) * 10;
      
      card.style.transform = `perspective(1000px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale(1.05)`;
    });
    
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });
}

function initCountUpAnimations() {
  const countElements = document.querySelectorAll('[data-countup]');
  
  const countUpObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const target = parseInt(entry.target.dataset.countup);
        const duration = 2000;
        const start = 0;
        const increment = target / (duration / 16);
        let current = start;
        
        const timer = setInterval(() => {
          current += increment;
          if (current >= target) {
            current = target;
            clearInterval(timer);
          }
          entry.target.textContent = `£${Math.floor(current)}`;
        }, 16);
        
        countUpObserver.unobserve(entry.target);
      }
    });
  });
  
  countElements.forEach(el => countUpObserver.observe(el));
}

function initPageTransitions() {
  const pageTransition = document.getElementById('page-transition');
  const links = document.querySelectorAll('a[href]');
  
  links.forEach(link => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      
      if (!href) return;

      if (
        href.startsWith('http') ||
        href.startsWith('#') ||
        href.startsWith('mailto:') ||
        href.startsWith('tel:') ||
        href.startsWith('javascript:')
      ) {
        return;
      }
      
      e.preventDefault();
      
      if (pageTransition) {
        pageTransition.classList.remove('hidden');
        
        setTimeout(() => {
          window.location.href = href;
        }, 500);
      }
    });
  });
  
  if (pageTransition) {
    setTimeout(() => {
      pageTransition.classList.add('hidden');
    }, 100);
  }
}

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      target.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  });
});

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

const rippleStyles = document.createElement('style');
rippleStyles.textContent = `
  .ripple {
    position: absolute;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.6);
    transform: scale(0);
    animation: ripple-animation 0.6s linear;
    pointer-events: none;
  }
  
  @keyframes ripple-animation {
    to {
      transform: scale(4);
      opacity: 0;
    }
  }
  
  .btn {
    position: relative;
    overflow: hidden;
  }
`;
document.head.appendChild(rippleStyles);

const cardStyles = document.createElement('style');
cardStyles.textContent = `
  .card.animated {
    opacity: 1 !important;
    transform: translateY(0) !important;
    transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  .card {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
`;
document.head.appendChild(cardStyles);

console.log('%c🔥 FadeForge Barber - Premium Barber Shop Website', 'font-size: 20px; font-weight: bold; color: #ff4654;');
console.log('%cCrafted with precision and style ✨', 'font-size: 14px; color: #666;');
