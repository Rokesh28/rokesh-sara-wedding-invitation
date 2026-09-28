const countdown = document.querySelector('#weddingCountdown');
const revealItems = document.querySelectorAll('.distance-edition .reveal-in');

function startReveals() {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion) {
    revealItems.forEach((item) => {
      item.style.setProperty('--reveal-opacity', '1');
      item.style.setProperty('--reveal-y', '0px');
      item.style.setProperty('--reveal-blur', '0px');
      item.style.setProperty('--reveal-scale', '1');
    });
    return;
  }

  let framePending = false;
  const updateScrollScenes = () => {
    const viewportHeight = window.innerHeight;
    const atDocumentEnd = window.scrollY + viewportHeight >= document.documentElement.scrollHeight - 4;
    revealItems.forEach((item) => {
      const top = item.getBoundingClientRect().top;
      // Scrub each reveal from 90% to 54% of the viewport, in either direction.
      const progress = atDocumentEnd ? 1 : Math.max(0, Math.min(1, (viewportHeight * 0.9 - top) / (viewportHeight * 0.36)));
      item.style.setProperty('--reveal-opacity', (0.06 + progress * 0.94).toFixed(3));
      item.style.setProperty('--reveal-y', `${((1 - progress) * 28).toFixed(1)}px`);
      item.style.setProperty('--reveal-blur', `${((1 - progress) * 8).toFixed(1)}px`);
      item.style.setProperty('--reveal-scale', (0.985 + progress * 0.015).toFixed(3));
    });
    framePending = false;
  };
  const requestUpdate = () => {
    if (!framePending) {
      framePending = true;
      window.requestAnimationFrame(updateScrollScenes);
    }
  };
  window.addEventListener('scroll', requestUpdate, { passive: true });
  window.addEventListener('resize', requestUpdate, { passive: true });
  updateScrollScenes();
}

document.addEventListener('invitation:opened', startReveals, { once: true });

if (countdown) {
  const targetTime = new Date(countdown.dataset.date).getTime();
  const units = {
    days: countdown.querySelector('[data-unit="days"]'),
    hours: countdown.querySelector('[data-unit="hours"]'),
    minutes: countdown.querySelector('[data-unit="minutes"]'),
    seconds: countdown.querySelector('[data-unit="seconds"]'),
  };
  const heading = countdown.querySelector('.countdown-heading');
  let interval;

  function updateCountdown() {
    const remaining = targetTime - Date.now();
    if (remaining <= 0) {
      countdown.classList.add('is-complete');
      heading.textContent = 'The wait is over — forever starts now';
      window.clearInterval(interval);
      return;
    }
    const seconds = Math.floor(remaining / 1000);
    units.days.textContent = Math.floor(seconds / 86400).toLocaleString();
    units.hours.textContent = String(Math.floor((seconds % 86400) / 3600)).padStart(2, '0');
    units.minutes.textContent = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
    units.seconds.textContent = String(seconds % 60).padStart(2, '0');
  }

  updateCountdown();
  interval = window.setInterval(updateCountdown, 1000);
}
