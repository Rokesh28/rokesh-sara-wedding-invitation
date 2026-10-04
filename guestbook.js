(function () {
  const form = document.querySelector('#wishForm');
  const list = document.querySelector('#guestWishes');
  const track = document.querySelector('#wishTrack');
  const status = document.querySelector('#wishStatus');
  if (!form || !list || !track || !status) return;

  const endpoint = (window.WEDDING_WISHES_ENDPOINT || '').trim();
  const submitButton = form.querySelector('button[type="submit"]');
  const controls = document.querySelector('#wishCarouselControls');
  const previousButton = document.querySelector('#wishPrevious');
  const nextButton = document.querySelector('#wishNext');
  const pager = document.querySelector('#wishPager');
  const counter = document.querySelector('#wishCounter');
  const viewAllButton = document.querySelector('#viewAllWishes');
  const allWishesDialog = document.querySelector('#allWishesDialog');
  const allWishesGrid = document.querySelector('#allWishesGrid');
  const closeAllButton = document.querySelector('#closeAllWishes');
  const emptyMessage = 'The shared guestbook is being prepared. Check back soon to leave your wish.';
  let wishes = [];
  let currentIndex = 0;
  let isSliding = false;
  let slideFallback;
  let pointerStartX = null;
  let pointerStartY = null;

  function showStatus(message, isError) {
    status.textContent = message;
    status.classList.toggle('is-error', Boolean(isError));
  }

  function jsonp(params) {
    return new Promise((resolve, reject) => {
      const callbackName = `weddingWishCallback${Date.now()}${Math.floor(Math.random() * 10000)}`;
      const script = document.createElement('script');
      const url = new URL(endpoint);
      Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
      url.searchParams.set('callback', callbackName);
      url.searchParams.set('_', String(Date.now()));

      const finish = () => {
        window.clearTimeout(timeout);
        delete window[callbackName];
        script.remove();
      };
      const timeout = window.setTimeout(() => {
        finish();
        reject(new Error('The guestbook took too long to respond. Please try again.'));
      }, 15000);

      window[callbackName] = (result) => {
        finish();
        if (result && result.ok) resolve(result);
        else reject(new Error((result && result.error) || 'The wish could not be saved.'));
      };
      script.onerror = () => {
        finish();
        reject(new Error('Could not reach the guestbook. Please try again in a moment.'));
      };
      script.src = url.toString();
      document.body.appendChild(script);
    });
  }

  function addWishCard(wish, index, total) {
    const card = document.createElement('article');
    card.className = 'wish-card';
    card.setAttribute('role', 'group');
    card.setAttribute('aria-label', `Wish ${index + 1} of ${total}, from ${wish.name}`);
    const mark = document.createElement('span');
    mark.className = 'wish-mark';
    mark.setAttribute('aria-hidden', 'true');
    mark.textContent = '“';
    const message = document.createElement('p');
    message.className = 'wish-message';
    message.textContent = wish.message;
    const name = document.createElement('p');
    name.className = 'wish-name';
    name.textContent = wish.name;
    card.append(mark, message, name);
    return card;
  }

  function emptyWish(messageText, smallText) {
    const card = document.createElement('article');
    card.className = 'wish-empty';
    const heart = document.createElement('span');
    heart.setAttribute('aria-hidden', 'true');
    heart.textContent = '♡';
    const message = document.createElement('p');
    message.textContent = messageText;
    const small = document.createElement('small');
    small.textContent = smallText;
    card.append(heart, message, small);
    return card;
  }

  function addSlide(wishIndex, position) {
    const slide = document.createElement('div');
    slide.className = 'wish-slide';
    slide.dataset.position = position;
    slide.setAttribute('aria-hidden', String(position !== 'current'));
    slide.appendChild(addWishCard(wishes[wishIndex], wishIndex, wishes.length));
    return slide;
  }

  function updateCarouselControls() {
    const hasWishes = wishes.length > 0;
    const hasMultiple = wishes.length > 1;
    controls.hidden = !hasMultiple;
    viewAllButton.hidden = !hasWishes;
    if (!hasMultiple) return;

    previousButton.disabled = isSliding;
    nextButton.disabled = isSliding;
    counter.textContent = `${String(currentIndex + 1).padStart(2, '0')} / ${String(wishes.length).padStart(2, '0')}`;

    const dotCount = Math.min(5, wishes.length);
    const dotStart = Math.max(0, Math.min(currentIndex - Math.floor(dotCount / 2), wishes.length - dotCount));
    const activeDot = currentIndex - dotStart;
    pager.replaceChildren();
    for (let index = 0; index < dotCount; index += 1) {
      const dot = document.createElement('span');
      dot.className = `wish-dot${index === activeDot ? ' is-current' : ''}`;
      pager.appendChild(dot);
    }
  }

  function renderCarousel() {
    window.clearTimeout(slideFallback);
    isSliding = false;
    track.classList.remove('is-sliding', 'is-sliding-next', 'is-sliding-previous');

    if (!wishes.length) {
      const slide = document.createElement('div');
      slide.className = 'wish-slide';
      slide.dataset.position = 'current';
      slide.appendChild(emptyWish('The first lovely wishes will appear here.', 'Be the first to leave us a note'));
      track.replaceChildren(slide);
      updateCarouselControls();
      return;
    }

    currentIndex = Math.min(currentIndex, wishes.length - 1);
    const beforeIndex = (currentIndex - 1 + wishes.length) % wishes.length;
    const afterIndex = (currentIndex + 1) % wishes.length;
    track.replaceChildren(
      addSlide(beforeIndex, 'previous'),
      addSlide(currentIndex, 'current'),
      addSlide(afterIndex, 'next'),
    );
    updateCarouselControls();
  }

  function finishSlide(step) {
    if (!isSliding) return;
    isSliding = false;
    currentIndex = (currentIndex + step + wishes.length) % wishes.length;
    renderCarousel();
  }

  function moveSlide(step) {
    if (isSliding || wishes.length < 2) return;
    isSliding = true;
    updateCarouselControls();
    track.classList.add('is-sliding', step > 0 ? 'is-sliding-next' : 'is-sliding-previous');
    const onTransitionEnd = (event) => {
      if (event.target.classList.contains('wish-slide') && event.propertyName === 'transform') {
        track.removeEventListener('transitionend', onTransitionEnd);
        finishSlide(step);
      }
    };
    track.addEventListener('transitionend', onTransitionEnd);
    slideFallback = window.setTimeout(() => finishSlide(step), 700);
  }

  function renderAllWishes() {
    allWishesGrid.replaceChildren();
    wishes.forEach((wish, index) => allWishesGrid.appendChild(addWishCard(wish, index, wishes.length)));
  }

  async function loadWishes() {
    if (!endpoint) {
      showStatus(emptyMessage, false);
      track.replaceChildren();
      const slide = document.createElement('div');
      slide.className = 'wish-slide';
      slide.dataset.position = 'current';
      slide.appendChild(emptyWish('Your guests’ notes will gather here.', 'The shared guestbook connection is being set up'));
      track.appendChild(slide);
      updateCarouselControls();
      submitButton.disabled = true;
      return;
    }

    try {
      const result = await jsonp({ action: 'list' });
      wishes = Array.isArray(result.wishes)
        ? result.wishes.filter((wish) => wish && String(wish.name || '').trim() && String(wish.message || '').trim())
        : [];
      currentIndex = 0;
      renderCarousel();
      if (allWishesDialog.open) renderAllWishes();
    } catch (error) {
      showStatus(error.message, true);
    }
  }

  previousButton.addEventListener('click', () => moveSlide(-1));
  nextButton.addEventListener('click', () => moveSlide(1));

  list.addEventListener('pointerdown', (event) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    pointerStartX = event.clientX;
    pointerStartY = event.clientY;
  });
  list.addEventListener('pointerup', (event) => {
    if (pointerStartX === null || pointerStartY === null) return;
    const delta = event.clientX - pointerStartX;
    const verticalDelta = event.clientY - pointerStartY;
    pointerStartX = null;
    pointerStartY = null;
    if (Math.abs(delta) < 42 || Math.abs(delta) < Math.abs(verticalDelta) * 1.25) return;
    moveSlide(delta < 0 ? 1 : -1);
  });
  list.addEventListener('pointercancel', () => { pointerStartX = null; pointerStartY = null; });
  list.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') moveSlide(-1);
    if (event.key === 'ArrowRight') moveSlide(1);
  });

  viewAllButton.addEventListener('click', () => {
    renderAllWishes();
    allWishesDialog.showModal();
  });
  closeAllButton.addEventListener('click', () => allWishesDialog.close());
  allWishesDialog.addEventListener('click', (event) => {
    if (event.target === allWishesDialog) allWishesDialog.close();
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!endpoint) {
      showStatus(emptyMessage, true);
      return;
    }

    const data = new FormData(form);
    if (String(data.get('website') || '').trim()) return;
    const name = String(data.get('name') || '').trim().slice(0, 60);
    const message = String(data.get('message') || '').trim().slice(0, 500);
    if (!name || !message) return;

    submitButton.disabled = true;
    showStatus('Sending your lovely note…', false);
    try {
      await jsonp({ action: 'add', name, message, website: '' });
      form.reset();
      showStatus('Your wish has been added. Thank you for being part of our story!', false);
      await loadWishes();
    } catch (error) {
      showStatus(error.message, true);
    } finally {
      submitButton.disabled = false;
    }
  });

  renderCarousel();
  loadWishes();
})();
