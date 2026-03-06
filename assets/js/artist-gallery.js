const lightbox = document.getElementById("lightbox");
const lightboxImageWrap = document.getElementById("lightbox-image-wrap");
const lightboxVideoWrap = document.getElementById("lightbox-video-wrap");
const lightboxImage = document.getElementById("lightbox-image");
const lightboxVideo = document.getElementById("lightbox-video");
const lightboxTitle = document.getElementById("lightbox-title");
const lightboxDescription = document.getElementById("lightbox-description");
const lightboxKind = document.getElementById("lightbox-kind");
const lightboxCaption = document.getElementById("lightbox-caption");
const closeButton = document.getElementById("lightbox-close");
const prevButton = document.getElementById("lightbox-prev");
const nextButton = document.getElementById("lightbox-next");
const artCards = Array.from(document.querySelectorAll(".art-card"));
const playlistCatalog = window.PLAYLIST_CATALOG || {};
let currentIndex = -1;
let touchStartX = 0;
let touchStartY = 0;

function toEmbedUrl(watchUrl) {
  const match = /(?:v=|youtu\.be\/)([A-Za-z0-9_-]{11})/.exec(watchUrl || "");
  if (!match) {
    return "";
  }
  return `https://www.youtube.com/embed/${match[1]}?autoplay=1`;
}

function withLoop(embedUrl) {
  if (!embedUrl) return embedUrl;
  const ytMatch = /youtube\.com\/embed\/([A-Za-z0-9_-]{11})/.exec(embedUrl);
  if (ytMatch) {
    const url = new URL(embedUrl);
    url.searchParams.set("loop", "1");
    url.searchParams.set("playlist", ytMatch[1]);
    return url.toString();
  }
  if (embedUrl.includes("vimeo.com")) {
    const url = new URL(embedUrl);
    url.searchParams.set("loop", "1");
    return url.toString();
  }
  return embedUrl;
}

function showVideoInLightbox(embedUrl) {
  lightboxImageWrap.classList.add("hidden");
  lightboxVideoWrap.classList.remove("hidden");
  lightboxImage.src = "";
  lightboxImage.alt = "";
  lightboxVideo.src = withLoop(embedUrl);
}

function setRichTextContent(target, text, linkUrl) {
  if (linkUrl) {
    const link = document.createElement("a");
    link.href = linkUrl;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = text || linkUrl;
    target.replaceChildren(link);
    return;
  }

  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = (text || "").split(urlRegex);
  const fragment = document.createDocumentFragment();

  parts.forEach((part) => {
    if (!part) {
      return;
    }
    if (part.startsWith("http://") || part.startsWith("https://")) {
      const link = document.createElement("a");
      link.href = part;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = part;
      fragment.appendChild(link);
      return;
    }
    fragment.appendChild(document.createTextNode(part));
  });

  target.replaceChildren(fragment);
}

function renderPlaylistDetails(playlist) {
  const descriptionFragment = document.createDocumentFragment();
  const intro = document.createElement("p");
  intro.className = "playlist-intro";
  intro.textContent = playlist.intro || "Full lesson list from the SideFX tutorial page:";
  descriptionFragment.appendChild(intro);

  const source = document.createElement("p");
  source.className = "playlist-source";
  const sourceLink = document.createElement("a");
  sourceLink.href = playlist.source;
  sourceLink.target = "_blank";
  sourceLink.rel = "noopener noreferrer";
  sourceLink.textContent = "Open source page";
  source.appendChild(sourceLink);
  descriptionFragment.appendChild(source);

  const lessonList = document.createElement("ol");
  lessonList.className = "playlist-list";
  playlist.lessons.forEach((lesson) => {
    const item = document.createElement("li");
    const heading = document.createElement("strong");
    heading.textContent = lesson.title;
    item.appendChild(heading);

    const lessonLinkUrl = lesson.link || lesson.watch || lesson.embed || "";
    const embedUrl = lesson.embed || toEmbedUrl(lesson.watch || "");
    const lessonLink = document.createElement("a");
    lessonLink.href = lessonLinkUrl || "#";
    if (embedUrl) {
      lessonLink.dataset.embed = embedUrl;
    } else {
      lessonLink.target = "_blank";
      lessonLink.rel = "noopener noreferrer";
    }
    lessonLink.textContent = lesson.linkText || lessonLinkUrl;
    item.appendChild(lessonLink);

    const summary = document.createElement("p");
    summary.textContent = lesson.description;
    item.appendChild(summary);

    lessonList.appendChild(item);
  });
  descriptionFragment.appendChild(lessonList);
  lightboxDescription.replaceChildren(descriptionFragment);

  const captionFragment = document.createDocumentFragment();
  const sourceText = document.createElement("span");
  sourceText.textContent = "Source: ";
  captionFragment.appendChild(sourceText);

  const sourceLinkInline = document.createElement("a");
  sourceLinkInline.href = playlist.source;
  sourceLinkInline.target = "_blank";
  sourceLinkInline.rel = "noopener noreferrer";
  sourceLinkInline.textContent = "SideFX Procedural Thinking";
  captionFragment.appendChild(sourceLinkInline);

  if (playlist.projectFiles) {
    const separator = document.createElement("span");
    separator.textContent = " · ";
    captionFragment.appendChild(separator);

    const filesLink = document.createElement("a");
    filesLink.href = playlist.projectFiles;
    filesLink.target = "_blank";
    filesLink.rel = "noopener noreferrer";
    filesLink.textContent = "Project Files";
    captionFragment.appendChild(filesLink);
  }

  lightboxCaption.replaceChildren(captionFragment);
}

function applyImageFitMode() {
  if (!lightbox.classList.contains("open") || lightboxImageWrap.classList.contains("hidden")) {
    return;
  }
  if (!lightboxImage.naturalWidth || !lightboxImage.naturalHeight) {
    return;
  }

  const imageRatio = lightboxImage.naturalWidth / lightboxImage.naturalHeight;
  const wrapRatio = lightboxImageWrap.clientWidth / lightboxImageWrap.clientHeight;

  lightboxImage.classList.remove("fit-width", "fit-height");
  if (imageRatio >= wrapRatio) {
    lightboxImage.classList.add("fit-width");
  } else {
    lightboxImage.classList.add("fit-height");
  }
}

function renderLightbox(index) {
  const card = artCards[index];
  if (!card) {
    return;
  }
  const title = card.querySelector(".card-copy strong")?.textContent?.trim() || card.dataset.alt || "";
  const playlist = card.dataset.playlist ? playlistCatalog[card.dataset.playlist] : null;
  const description = card.dataset.description !== undefined
    ? card.dataset.description
    : (card.querySelector(".card-copy span")?.textContent?.trim() || card.dataset.caption || "");

  currentIndex = index;
  if (card.dataset.kind === "video" || playlist) {
    const embedUrl = playlist ? playlist.defaultEmbed : (card.dataset.embed || "");
    showVideoInLightbox(embedUrl);
    lightboxKind.textContent = "Video";
  } else {
    lightboxVideoWrap.classList.add("hidden");
    lightboxImageWrap.classList.remove("hidden");
    lightboxVideo.src = "";
    lightboxImage.classList.remove("fit-width", "fit-height");
    lightboxImage.src = card.dataset.full;
    lightboxImage.alt = card.dataset.alt;
    if (lightboxImage.complete) {
      applyImageFitMode();
    } else {
      lightboxImage.onload = applyImageFitMode;
    }
    lightboxKind.textContent = "Image";
  }

  lightboxTitle.textContent = title;
  if (playlist) {
    lightboxKind.textContent = "Video Series";
    renderPlaylistDetails(playlist);
  } else {
    setRichTextContent(lightboxDescription, description, card.dataset.descriptionLink || "");
    setRichTextContent(lightboxCaption, card.dataset.caption || "");
  }
}

function openLightbox(index) {
  renderLightbox(index);
  lightbox.classList.add("open");
  lightbox.setAttribute("aria-hidden", "false");
  closeButton.focus();
}

function closeLightbox() {
  lightbox.classList.remove("open");
  lightbox.setAttribute("aria-hidden", "true");
  lightboxImageWrap.classList.remove("hidden");
  lightboxVideoWrap.classList.add("hidden");
  lightboxImage.src = "";
  lightboxImage.alt = "";
  lightboxImage.classList.remove("fit-width", "fit-height");
  lightboxVideo.src = "";
  lightboxTitle.textContent = "";
  lightboxDescription.textContent = "";
  lightboxKind.textContent = "";
  lightboxCaption.textContent = "";
  currentIndex = -1;
}

function showAdjacent(step) {
  if (!artCards.length || currentIndex < 0) {
    return;
  }

  const nextIndex = (currentIndex + step + artCards.length) % artCards.length;
  renderLightbox(nextIndex);
}

artCards.forEach((card, index) => {
  card.addEventListener("click", () => openLightbox(index));
});

closeButton.addEventListener("click", closeLightbox);
prevButton.addEventListener("click", () => showAdjacent(-1));
nextButton.addEventListener("click", () => showAdjacent(1));

lightboxDescription.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLAnchorElement)) {
    return;
  }
  const embed = target.dataset.embed;
  if (!embed) {
    return;
  }
  event.preventDefault();
  showVideoInLightbox(embed);
  lightboxKind.textContent = "Video Series";
});

lightbox.addEventListener("click", (event) => {
  if (event.target === lightbox) {
    closeLightbox();
  }
});

lightbox.addEventListener("touchstart", (event) => {
  if (!lightbox.classList.contains("open") || !event.touches.length) {
    return;
  }

  touchStartX = event.touches[0].clientX;
  touchStartY = event.touches[0].clientY;
}, { passive: true });

lightbox.addEventListener("touchend", (event) => {
  if (!lightbox.classList.contains("open") || !event.changedTouches.length) {
    return;
  }

  const deltaX = event.changedTouches[0].clientX - touchStartX;
  const deltaY = event.changedTouches[0].clientY - touchStartY;

  if (Math.abs(deltaX) < 50 || Math.abs(deltaX) < Math.abs(deltaY)) {
    return;
  }

  if (deltaX > 0) {
    showAdjacent(-1);
  } else {
    showAdjacent(1);
  }
}, { passive: true });

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && lightbox.classList.contains("open")) {
    closeLightbox();
  } else if (event.key === "ArrowLeft" && lightbox.classList.contains("open")) {
    showAdjacent(-1);
  } else if (event.key === "ArrowRight" && lightbox.classList.contains("open")) {
    showAdjacent(1);
  }
});

window.addEventListener("resize", applyImageFitMode);

const firstVideoIndex = artCards.findIndex(card => card.dataset.kind === "video" || card.dataset.playlist);
if (firstVideoIndex !== -1) {
  openLightbox(firstVideoIndex);
}
