const preferenceKey = 'portfolio-google-fonts-consent-v1';
const consentPanel = document.querySelector('#privacy-consent');
const consentButtons = [...document.querySelectorAll('[data-privacy-consent]')];
const preferenceOpeners = [...document.querySelectorAll('[data-open-privacy-consent]')];

function readPreference() {
  try {
    return window.localStorage.getItem(preferenceKey);
  } catch {
    return null;
  }
}

function loadGoogleFonts() {
  if (document.querySelector('#google-fonts-stylesheet')) return;

  const fontsOrigin = document.createElement('link');
  fontsOrigin.rel = 'preconnect';
  fontsOrigin.href = 'https://fonts.googleapis.com';

  const filesOrigin = document.createElement('link');
  filesOrigin.rel = 'preconnect';
  filesOrigin.href = 'https://fonts.gstatic.com';
  filesOrigin.crossOrigin = 'anonymous';

  const stylesheet = document.createElement('link');
  stylesheet.id = 'google-fonts-stylesheet';
  stylesheet.rel = 'stylesheet';
  stylesheet.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Mono:wght@400;700&display=swap';
  stylesheet.addEventListener('load', () => {
    document.fonts.ready.then(() => document.dispatchEvent(new CustomEvent('privacy:fonts-loaded')));
  }, { once: true });

  document.head.append(fontsOrigin, filesOrigin, stylesheet);
}

if (consentPanel) {
  let preference = readPreference();
  let lastOpener = null;

  if (preference === 'accepted') loadGoogleFonts();
  consentPanel.hidden = preference === 'accepted' || preference === 'rejected';

  consentButtons.forEach((button) => {
    button.addEventListener('click', () => {
      preference = button.dataset.privacyConsent === 'accept' ? 'accepted' : 'rejected';
      try {
        window.localStorage.setItem(preferenceKey, preference);
      } catch {
        // The current-session choice still applies when browser storage is unavailable.
      }

      if (preference === 'accepted') loadGoogleFonts();
      consentPanel.hidden = true;
      lastOpener?.focus();
    });
  });

  preferenceOpeners.forEach((button) => {
    button.addEventListener('click', () => {
      lastOpener = button;
      consentPanel.hidden = false;
      consentButtons[0]?.focus();
    });
  });
}
