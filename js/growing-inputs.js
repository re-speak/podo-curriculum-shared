/* Grow synced textareas after local or remote value changes. */
(() => {
  const selector = 'textarea.space-input, textarea.free-input, textarea.phrase-input';
  const grow = (control) => {
    control.style.height = 'auto';
    const borders = control.offsetHeight - control.clientHeight;
    control.style.height = `${control.scrollHeight + borders}px`;
    control.style.overflow = 'auto';
    for (let pass = 0; pass < 3 && control.scrollHeight > control.clientHeight + 1; pass += 1) {
      control.style.height = `${control.offsetHeight + control.scrollHeight - control.clientHeight}px`;
    }
  };
  const growAll = () => document.querySelectorAll(selector).forEach(grow);
  const queueGrow = (control) => {
    grow(control);
    requestAnimationFrame(() => {
      grow(control);
      requestAnimationFrame(() => grow(control));
    });
  };
  document.addEventListener('input', (event) => {
    if (event.target.matches?.(selector)) queueGrow(event.target);
  });
  document.addEventListener('change', (event) => {
    if (event.target.matches?.(selector)) queueGrow(event.target);
  });
  const widths = new WeakMap();
  const widthObserver = new ResizeObserver((entries) => {
    for (const {target, contentRect} of entries) {
      if (widths.get(target) !== contentRect.width) {
        widths.set(target, contentRect.width);
        queueGrow(target);
      }
    }
  });
  document.querySelectorAll(selector).forEach((control) => widthObserver.observe(control));
  const phone = document.querySelector('.phone');
  if (phone) {
    const pageObserver = new MutationObserver(() => {
      phone.querySelectorAll(`.pg-on ${selector}`).forEach(queueGrow);
    });
    pageObserver.observe(phone, {subtree: true, attributes: true, attributeFilter: ['class']});
  }
  window.addEventListener('load', growAll);
  requestAnimationFrame(growAll);
})();
