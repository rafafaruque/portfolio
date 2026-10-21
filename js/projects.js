// Entries in projects.html are the single source for images and project content.
document.addEventListener('DOMContentLoaded', () => {
  const preview = document.getElementById('projects-preview');
  const rows = [...document.querySelectorAll('.projects-page .index-project')];
  if (!preview || !rows.length) return;

  const desktop = window.matchMedia('(min-width: 981px) and (hover: hover) and (pointer: fine)');
  const panels = rows.map((row) => {
    const panel = row.querySelector('.index-project-image').cloneNode(true);
    preview.appendChild(panel);
    return panel;
  });

  const select = (index) => {
    rows.forEach((row, i) => {
      row.classList.toggle('is-active', i === index);
      row.querySelector('.index-preview-trigger').setAttribute('aria-pressed', String(i === index));
      panels[i].classList.toggle('is-active', i === index);
    });
  };

  rows.forEach((row, index) => {
    row.addEventListener('mouseenter', () => {
      if (desktop.matches && !rows.some((other) => other.contains(document.activeElement))) select(index);
    });
    row.addEventListener('focusin', () => select(index));
    row.querySelector('.index-preview-trigger').addEventListener('click', () => select(index));
  });

  const syncMode = () => {
    rows.forEach((row) => {
      const button = row.querySelector('.index-preview-trigger');
      // On touch, the image is already visible and the heading needs no control.
      button.disabled = !desktop.matches;
      if (desktop.matches) {
        button.setAttribute('aria-pressed', String(row.classList.contains('is-active')));
      } else {
        button.removeAttribute('aria-pressed');
      }
    });
  };
  select(0);
  syncMode();
  desktop.addEventListener('change', syncMode);
  document.body.classList.add('projects-enhanced');
});
