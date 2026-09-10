/**
 * ============================================================================
 * Apple Liquid Glass UI Controller — Circular Droplet & Fluid Physics
 * ============================================================================
 */

(function () {
  'use strict';

  let droplet = document.getElementById('liquidGlassDroplet');
  if (!droplet) {
    droplet = document.createElement('div');
    droplet.id = 'liquidGlassDroplet';
    droplet.className = 'apple-liquid-glass-droplet';
    document.body.appendChild(droplet);
  }

  // Position & Physics State
  let targetX = window.innerWidth * 0.5;
  let targetY = window.innerHeight * 0.5;
  let currentX = targetX;
  let currentY = targetY;
  let vx = 0;
  let vy = 0;
  let hasMoved = false;

  // Apple Spring Dynamics Parameters
  const SPRING_K = 0.15;
  const DAMPING = 0.75;
  const MAX_STRETCH = 0.22; // subtle droplet elongation

  // Pointer tracking
  function onPointerMove(e) {
    targetX = e.clientX;
    targetY = e.clientY;
    if (!hasMoved) {
      hasMoved = true;
      currentX = targetX;
      currentY = targetY;
      droplet.classList.add('is-active');
    }
  }

  window.addEventListener('mousemove', onPointerMove, { passive: true });
  window.addEventListener('pointermove', onPointerMove, { passive: true });

  // Touch support
  window.addEventListener('touchmove', function (e) {
    if (e.touches && e.touches[0]) {
      targetX = e.touches[0].clientX;
      targetY = e.touches[0].clientY;
      if (!hasMoved) {
        hasMoved = true;
        currentX = targetX;
        currentY = targetY;
        droplet.classList.add('is-active');
      }
    }
  }, { passive: true });

  // Hide when leaving window
  document.addEventListener('mouseleave', function () {
    droplet.classList.remove('is-active');
  });
  document.addEventListener('mouseenter', function () {
    if (hasMoved) droplet.classList.add('is-active');
  });

  // Animation Loop (Fluid spring & optics)
  function updateDroplet() {
    const dx = targetX - currentX;
    const dy = targetY - currentY;

    vx = (vx + dx * SPRING_K) * DAMPING;
    vy = (vy + dy * SPRING_K) * DAMPING;

    currentX += vx;
    currentY += vy;

    const speed = Math.hypot(vx, vy);
    const stretch = Math.min(speed * 0.0022, MAX_STRETCH);
    const angle = Math.atan2(vy, vx);

    // Specular Glare Tracking
    const glareDeg = (angle * 180 / Math.PI) - 45;
    const glareX = 30 - Math.cos(angle) * 8 * (speed > 1 ? 1 : 0);
    const glareY = 26 - Math.sin(angle) * 8 * (speed > 1 ? 1 : 0);

    droplet.style.setProperty('--glare-angle', glareDeg + 'deg');
    droplet.style.setProperty('--glare-x', glareX + '%');
    droplet.style.setProperty('--glare-y', glareY + '%');

    // Droplet Deformation (stretches along motion angle, maintains volume)
    if (speed > 0.4) {
      droplet.style.transform = 'translate3d(' + currentX + 'px, ' + currentY + 'px, 0) translate(-50%, -50%) rotate(' + angle + 'rad) scale(' + (1 + stretch) + ', ' + (1 - stretch * 0.55) + ') rotate(' + (-angle) + 'rad)';
    } else {
      droplet.style.transform = 'translate3d(' + currentX + 'px, ' + currentY + 'px, 0) translate(-50%, -50%)';
    }

    requestAnimationFrame(updateDroplet);
  }

  requestAnimationFrame(updateDroplet);
})();
