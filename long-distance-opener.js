const intro = document.querySelector('#intro');
const invitation = document.querySelector('#invitation');
const envelope = document.querySelector('.envelope');
const openButton = document.querySelector('#openInvite');

function openInvitation() {
  document.dispatchEvent(new CustomEvent('invitation:opening'));
  envelope.classList.add('opened');
  openButton.classList.add('opened');
  openButton.disabled = true;
  window.setTimeout(() => {
    intro.classList.add('hidden');
    invitation.classList.add('visible');
    invitation.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = '';
    document.body.classList.add('invitation-open');
    document.dispatchEvent(new CustomEvent('invitation:opened'));
  }, 950);
}

document.body.style.overflow = 'hidden';
openButton.addEventListener('click', openInvitation);
