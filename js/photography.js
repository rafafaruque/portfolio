// Collection order, metadata, and original image paths live in one JSON file.
document.addEventListener('DOMContentLoaded', async () => {
  const overview = document.getElementById('archive-overview');
  if (!overview) return;

  let rolls;
  try {
    const response = await fetch('data/photography-rolls.json');
    if (!response.ok) throw new Error('Could not load the photography collections');
    rolls = await response.json();
  } catch (error) {
    // The static overview still links to original cover photographs.
    console.error(error);
    return;
  }

  const collection = document.getElementById('archive-collection');
  const title = document.getElementById('collection-title');
  const details = document.getElementById('collection-details');
  const gallery = collection.querySelector('.archive-photographs');
  const dialog = document.getElementById('archive-lightbox');
  const enlarged = document.getElementById('archive-enlarged');
  const counter = document.getElementById('archive-counter');
  let currentRoll;
  let currentIndex = 0;
  let overviewScroll = 0;
  let coverFocus;
  let photoFocus;
  let bodyStyle;
  let rootOverflow;
  let lightboxScroll;

  // Pack in source order into the shortest column using known image dimensions.
  // No image-load measurement or DOM reordering is needed.
  const layoutPhotographs = () => {
    if (collection.hidden) return;
    const style = getComputedStyle(gallery);
    const columns = style.gridTemplateColumns.split(' ').length;
    const gap = parseFloat(style.columnGap);
    const width = (gallery.clientWidth - gap * (columns - 1)) / columns;
    if (width <= 0) return;
    const heights = Array(columns).fill(0);
    [...gallery.children].forEach((item) => {
      const photo = item.querySelector('img');
      const column = heights.indexOf(Math.min(...heights));
      item.style.width = `${width}px`;
      item.style.left = `${column * (width + gap)}px`;
      item.style.top = `${heights[column]}px`;
      heights[column] += width * Number(photo.getAttribute('height')) / Number(photo.getAttribute('width')) + gap;
    });
    gallery.style.height = `${Math.max(0, ...heights) - gap}px`;
    gallery.classList.add('is-masonry');
  };

  let galleryWidth = 0;
  if ('ResizeObserver' in window) {
    new ResizeObserver(([entry]) => {
      if (entry.contentRect.width === galleryWidth) return;
      galleryWidth = entry.contentRect.width;
      layoutPhotographs();
    }).observe(gallery);
  } else {
    window.addEventListener('resize', layoutPhotographs);
  }

  const thumbnail = (photo, width) => {
    const stem = photo.src.split('/').pop().replace(/\.[^.]+$/, '');
    return `images/photography-thumbnails/${stem}-${width}.webp`;
  };

  const image = (photo, sizes, eager = false) => {
    const img = document.createElement('img');
    img.src = thumbnail(photo, 768);
    img.srcset = `${thumbnail(photo, 384)} 384w, ${thumbnail(photo, 768)} 768w`;
    img.sizes = sizes;
    img.alt = photo.alt;
    img.width = photo.width;
    img.height = photo.height;
    img.loading = eager ? 'eager' : 'lazy';
    img.decoding = 'async';
    return img;
  };

  const showPhoto = (index) => {
    currentIndex = (index + currentRoll.photos.length) % currentRoll.photos.length;
    const photo = currentRoll.photos[currentIndex];
    enlarged.alt = photo.alt;
    enlarged.width = photo.width;
    enlarged.height = photo.height;
    enlarged.src = photo.src;
    counter.textContent = `${currentIndex + 1} / ${currentRoll.photos.length}`;
    dialog.setAttribute('aria-label', `${currentRoll.title} — photograph ${counter.textContent}`);
  };

  const openPhoto = (index, button) => {
    photoFocus = button;
    lightboxScroll = window.scrollY;
    bodyStyle = document.body.style.cssText;
    rootOverflow = document.documentElement.style.overflow;
    showPhoto(index);
    document.body.style.position = 'fixed';
    document.body.style.top = `-${lightboxScroll}px`;
    document.body.style.width = '100%';
    document.documentElement.style.overflow = 'hidden';
    dialog.showModal();
  };

  const openRoll = (roll, button) => {
    currentRoll = roll;
    overviewScroll = window.scrollY;
    coverFocus = button;
    title.textContent = roll.title;
    details.textContent = roll.details;
    const photos = roll.photos.map((photo, index) => {
      const item = document.createElement('li');
      const trigger = document.createElement('button');
      trigger.type = 'button';
      trigger.className = 'archive-photo';
      trigger.setAttribute('aria-haspopup', 'dialog');
      trigger.setAttribute('aria-controls', 'archive-lightbox');
      trigger.setAttribute('aria-label', `Enlarge photograph ${index + 1}: ${photo.alt}`);
      const photograph = image(photo, '(max-width: 519px) calc(100vw - 48px), (max-width: 1100px) 45vw, 342px', index < 3);
      photograph.style.aspectRatio = `${photo.width} / ${photo.height}`;
      trigger.appendChild(photograph);
      trigger.addEventListener('click', () => openPhoto(index, trigger));
      item.appendChild(trigger);
      return item;
    });
    gallery.replaceChildren(...photos);
    overview.hidden = true;
    collection.hidden = false;
    layoutPhotographs();
    window.scrollTo({ top: 0, behavior: 'instant' });
    title.focus({ preventScroll: true });
  };

  const covers = rolls.map((roll, index) => {
    const item = document.createElement('li');
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'archive-cover';
    button.setAttribute('aria-label', `Open ${roll.title} — ${roll.details}`);
    const figure = document.createElement('figure');
    const frame = document.createElement('div');
    frame.className = 'archive-cover-image';
    const coverImage = image(roll.photos[0], '(max-width: 479px) calc(100vw - 52px), (max-width: 980px) 45vw, (max-width: 1199px) 30vw, 260px', index < 4);
    coverImage.style.objectPosition = roll.coverPosition || 'center';
    frame.appendChild(coverImage);
    const number = document.createElement('span');
    number.className = 'archive-frame-number';
    number.setAttribute('aria-hidden', 'true');
    number.textContent = roll.id.split('-')[1];
    frame.appendChild(number);
    const caption = document.createElement('figcaption');
    const name = document.createElement('span');
    name.className = 'archive-roll-title';
    name.textContent = roll.title;
    const metadata = document.createElement('span');
    metadata.className = 'archive-roll-details';
    metadata.textContent = roll.details;
    caption.append(name, metadata);
    figure.append(frame, caption);
    button.appendChild(figure);
    button.addEventListener('click', () => openRoll(roll, button));
    item.appendChild(button);
    return item;
  });
  overview.querySelector('.archive-rolls').replaceChildren(...covers);

  collection.querySelector('.archive-back').addEventListener('click', () => {
    collection.hidden = true;
    overview.hidden = false;
    window.scrollTo({ top: overviewScroll, behavior: 'instant' });
    coverFocus.focus({ preventScroll: true });
  });

  dialog.querySelector('.archive-close').addEventListener('click', () => dialog.close());
  dialog.querySelector('.archive-previous').addEventListener('click', () => showPhoto(currentIndex - 1));
  dialog.querySelector('.archive-next').addEventListener('click', () => showPhoto(currentIndex + 1));
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog || event.target.classList.contains('archive-lightbox-stage') || event.target.classList.contains('archive-lightbox-toolbar')) dialog.close();
  });
  dialog.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      showPhoto(currentIndex + (event.key === 'ArrowRight' ? 1 : -1));
    }
    // Native modal dialog provides Escape closing, focus containment, and inert background.
  });
  dialog.addEventListener('close', () => {
    document.body.style.cssText = bodyStyle;
    document.documentElement.style.overflow = rootOverflow;
    window.scrollTo({ top: lightboxScroll, behavior: 'instant' });
    photoFocus.focus({ preventScroll: true });
  });
});
