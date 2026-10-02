// Fade in `[data-anim]` elements as they scroll into view.
const observer = new IntersectionObserver((entries) => {
  for (const entry of entries) {
    if (!entry.isIntersecting) continue;
    entry.target.classList.add('is-visible');
    observer.unobserve(entry.target);
  }
});

for (const el of document.querySelectorAll('[data-anim]')) {
  observer.observe(el);
}
