(function () {
  const form = document.querySelector('#wishForm');
  const list = document.querySelector('#guestWishes');
  const status = document.querySelector('#wishStatus');
  if (!form || !list || !status) return;

  const endpoint = (window.WEDDING_WISHES_ENDPOINT || '').trim();
  const submitButton = form.querySelector('button[type="submit"]');
  const emptyMessage = 'The shared guestbook is being prepared. Check back soon to leave your wish.';

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

  function addWishCard(wish) {
    const card = document.createElement('article');
    card.className = 'wish-card';
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

  async function loadWishes() {
    if (!endpoint) {
      showStatus(emptyMessage, false);
      list.innerHTML = '<article class="wish-empty"><span aria-hidden="true">♡</span><p>Your guests’ notes will gather here.</p><small>The shared guestbook connection is being set up</small></article>';
      submitButton.disabled = true;
      return;
    }

    try {
      const result = await jsonp({ action: 'list' });
      list.replaceChildren();
      const wishes = Array.isArray(result.wishes) ? result.wishes : [];
      if (!wishes.length) {
        list.innerHTML = '<article class="wish-empty"><span aria-hidden="true">♡</span><p>The first lovely wishes will appear here.</p><small>Be the first to leave us a note</small></article>';
        return;
      }
      wishes.forEach((wish) => list.appendChild(addWishCard(wish)));
    } catch (error) {
      showStatus(error.message, true);
    }
  }

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

  loadWishes();
})();
