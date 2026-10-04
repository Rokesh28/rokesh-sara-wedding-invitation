(function () {
  const gallery = document.querySelector('#coupleGallery');
  const frame = document.querySelector('#couplePhotoFrame');
  const image = document.querySelector('#coupleGalleryImage');
  const caption = document.querySelector('#coupleGalleryCaption');
  if (!gallery || !frame || !image || !caption) return;

  const dots = Array.from(gallery.querySelectorAll('.couple-gallery-dot'));
  const previousButton = gallery.querySelector('#couplePhotoPrevious');
  const nextButton = gallery.querySelector('#couplePhotoNext');
  const photos = dots.map((dot) => ({
    src: dot.dataset.src,
    alt: dot.dataset.alt,
    caption: dot.dataset.caption,
  }));
  let currentIndex = 0;
  let isAnimating = false;
  let pointerStart = null;
  let changeTimer;

  function showPhoto(index, direction) {
    if (isAnimating || index === currentIndex || !photos[index]) return;
    isAnimating = true;
    const exitClass = direction > 0 ? 'is-moving-left' : 'is-moving-right';
    const enterClass = direction > 0 ? 'photo-enter-from-right' : 'photo-enter-from-left';
    frame.classList.add(exitClass);

    changeTimer = window.setTimeout(() => {
      currentIndex = index;
      image.src = photos[index].src;
      image.alt = photos[index].alt;
      caption.textContent = photos[index].caption;
      dots.forEach((dot, dotIndex) => {
        const active = dotIndex === currentIndex;
        dot.classList.toggle('is-current', active);
        dot.setAttribute('aria-current', String(active));
      });
      frame.classList.remove(exitClass);
      frame.classList.add(enterClass);
      window.requestAnimationFrame(() => {
        window.setTimeout(() => {
          frame.classList.remove(enterClass);
          isAnimating = false;
        }, 600);
      });
    }, 220);
  }

  function move(step) {
    const index = (currentIndex + step + photos.length) % photos.length;
    showPhoto(index, step);
  }

  previousButton.addEventListener('click', () => move(-1));
  nextButton.addEventListener('click', () => move(1));
  dots.forEach((dot, index) => {
    dot.addEventListener('click', () => {
      const direction = index >= currentIndex ? 1 : -1;
      showPhoto(index, direction);
    });
  });

  gallery.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      move(-1);
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      move(1);
    }
  });

  gallery.addEventListener('pointerdown', (event) => {
    pointerStart = { x: event.clientX, y: event.clientY };
  });
  gallery.addEventListener('pointerup', (event) => {
    if (!pointerStart) return;
    const dx = event.clientX - pointerStart.x;
    const dy = event.clientY - pointerStart.y;
    pointerStart = null;
    if (Math.abs(dx) > 44 && Math.abs(dx) > Math.abs(dy) * 1.2) move(dx < 0 ? 1 : -1);
  });
  gallery.addEventListener('pointercancel', () => { pointerStart = null; });
  window.addEventListener('pagehide', () => window.clearTimeout(changeTimer), { once: true });
})();
