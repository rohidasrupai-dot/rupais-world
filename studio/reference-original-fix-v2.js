(function () {
  function fix() {
    const artwork = document.querySelector('.reference-artwork');
    if (artwork) {
      artwork.style.maxWidth = 'none';
      artwork.style.maxHeight = 'none';
    }
    const reference = document.querySelector('#referencePreview')?.src || '';
    document.querySelectorAll('[data-image-slot]').forEach((image) => {
      if (/earth-storybook-/.test(image.src)) image.hidden = true;
    });
    document.querySelectorAll('[data-control-image]').forEach((image) => {
      if (/earth-storybook-/.test(image.src)) {
        if (reference) image.src = reference;
        const status = image.parentElement?.querySelector('.using-original');
        if (status) status.textContent = 'Using original artwork';
      }
    });
  }
  const observer = new MutationObserver(fix);
  observer.observe(document.body, { childList: true, subtree: true });
  setTimeout(fix, 0);
  setTimeout(fix, 500);
})();
