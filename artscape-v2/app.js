/**
 * ARTSCAPE V2 — The Motif Travels
 * Main Application Logic
 */

// ═══════════════════════════════════════════════════════════════════
// State Management
// ═══════════════════════════════════════════════════════════════════
const AppState = {
  currentScreen: 'hero',     // hero | gallery
  selectedArtwork: null,
  selectedElement: null,
  activeRelationship: null,
  artworks: [],
  elements: [],
  relationships: [],
  isLoading: false,
  isTransitioning: false
};

// ═══════════════════════════════════════════════════════════════════
// DOM References
// ═══════════════════════════════════════════════════════════════════
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

// ═══════════════════════════════════════════════════════════════════
// Initialization & Backend Connectivity
// ═══════════════════════════════════════════════════════════════════
async function checkBackendConnection() {
  const statusEl = $('#nav-backend-status');
  if (!statusEl) return;
  const dot = statusEl.querySelector('.nav__status-dot');
  const text = statusEl.querySelector('.nav__status-text');

  const health = await ArtscapeAPI.checkHealth();
  if (health.connected) {
    statusEl.classList.remove('nav__status--offline');
    statusEl.classList.add('nav__status--connected');
    if (dot) dot.style.backgroundColor = '#10b981';
    if (text) text.textContent = health.gemini?.configured ? 'Gemini API Live' : 'Backend Connected';
    statusEl.title = `Connected to Next.js API (${health.gemini?.mode || 'live'})`;
  } else {
    statusEl.classList.remove('nav__status--connected');
    statusEl.classList.add('nav__status--offline');
    if (dot) dot.style.backgroundColor = '#f59e0b';
    if (text) text.textContent = 'Local CreativeDNA';
    statusEl.title = 'Next.js backend unreachable, using local CreativeDNA corpus';
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  initParticles();
  initNavScroll();
  initRevealAnimations();

  // Check live backend connection asynchronously
  checkBackendConnection();

  // Load artworks (from live Next.js API with fallback)
  AppState.artworks = await ArtscapeAPI.getArtworks();
  renderGallery();

  // Event listeners
  $('#hero-cta').addEventListener('click', () => navigateTo('gallery'));
  $('#hero-scroll-hint').addEventListener('click', () => navigateTo('gallery'));
});

// ═══════════════════════════════════════════════════════════════════
// Navigation
// ═══════════════════════════════════════════════════════════════════
function navigateTo(screen) {
  // Hide all screens
  $$('.screen').forEach(s => s.classList.remove('screen--active'));

  // Show target screen
  const target = $(`#screen-${screen}`);
  if (target) {
    target.classList.add('screen--active');
    AppState.currentScreen = screen;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Update nav
  $$('.nav__link').forEach(link => {
    link.classList.toggle('nav__link--active', link.dataset.screen === screen);
  });
}

function initNavScroll() {
  const nav = $('.nav');
  let lastScroll = 0;

  window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;
    nav.classList.toggle('nav--scrolled', scrollY > 50);
    lastScroll = scrollY;
  });

  // Nav link clicks
  $$('.nav__link').forEach(link => {
    link.addEventListener('click', () => {
      navigateTo(link.dataset.screen);
    });
  });
}

// ═══════════════════════════════════════════════════════════════════
// Gallery Rendering
// ═══════════════════════════════════════════════════════════════════
function renderGallery() {
  const grid = $('#gallery-grid');
  if (!grid) return;

  grid.innerHTML = AppState.artworks.map(artwork => `
    <article class="artwork-card reveal" data-artwork-id="${artwork.id}" id="card-${artwork.id}">
      <div class="artwork-card__image-wrapper">
        <img
          class="artwork-card__image"
          src="${artwork.image}"
          alt="${artwork.title} by ${artwork.creator}"
          loading="lazy"
        />
        <div class="artwork-card__overlay">
          <button class="artwork-card__step-inside" data-artwork-id="${artwork.id}">
            Step Inside →
          </button>
        </div>
      </div>
      <div class="artwork-card__info">
        <h3 class="artwork-card__title">${artwork.title}</h3>
        <p class="artwork-card__creator">${artwork.creator} · ${artwork.year}</p>
        <div class="artwork-card__meta">
          <span class="artwork-card__tag">${artwork.tradition}</span>
          <span class="artwork-card__tag">${artwork.region}</span>
        </div>
      </div>
    </article>
  `).join('');

  // Attach click handlers
  $$('.artwork-card').forEach(card => {
    card.addEventListener('click', () => {
      const artworkId = card.dataset.artworkId;
      openArtworkView(artworkId);
    });
  });

  // Re-init reveal animations for new elements
  setTimeout(() => initRevealAnimations(), 100);
}

// ═══════════════════════════════════════════════════════════════════
// Artwork View (Step Inside)
// ═══════════════════════════════════════════════════════════════════
async function openArtworkView(artworkId) {
  const artwork = AppState.artworks.find(a => a.id === artworkId);
  if (!artwork) return;

  AppState.selectedArtwork = artwork;
  AppState.selectedElement = null;

  const view = $('#artwork-view');
  const canvasWrapper = $('#artwork-canvas');

  // Set header info
  $('#artwork-view-title').textContent = artwork.title;

  // Set main image
  const mainImg = $('#artwork-main-image');
  mainImg.src = artwork.image;
  mainImg.alt = artwork.title;
  mainImg.classList.remove('artwork-view__main-image--dimmed');

  // Close any open panel
  closeElementPanel();

  // Show the view
  view.classList.add('artwork-view--active');

  // Load elements (simulates Gemini analysis)
  showToast('Analyzing artwork with Gemini…');
  const elements = await ArtscapeAPI.getElements(artworkId);
  AppState.elements = elements;

  // Render element overlays
  renderElementOverlays(elements);

  showToast(`${elements.length} visual elements identified`);
}

function closeArtworkView() {
  const view = $('#artwork-view');
  view.classList.remove('artwork-view--active');
  AppState.selectedArtwork = null;
  AppState.selectedElement = null;

  // Remove overlays
  $$('.element-overlay').forEach(el => el.remove());
}

function renderElementOverlays(elements) {
  const canvas = $('#artwork-canvas');
  const mainImg = $('#artwork-main-image');

  // Remove existing overlays
  $$('.element-overlay').forEach(el => el.remove());

  // Wait for image to load
  const setupOverlays = () => {
    const imgRect = mainImg.getBoundingClientRect();
    const canvasRect = canvas.getBoundingClientRect();

    // Calculate image offset within canvas
    const offsetX = imgRect.left - canvasRect.left;
    const offsetY = imgRect.top - canvasRect.top;

    elements.forEach(element => {
      const overlay = document.createElement('div');
      overlay.className = 'element-overlay';
      overlay.dataset.elementId = element.id;

      // Calculate bounding box from polygon points
      const points = element.geometry.points;
      const minX = Math.min(...points.map(p => p[0]));
      const maxX = Math.max(...points.map(p => p[0]));
      const minY = Math.min(...points.map(p => p[1]));
      const maxY = Math.max(...points.map(p => p[1]));

      // Position overlay relative to canvas
      overlay.style.left = `${offsetX + minX * imgRect.width}px`;
      overlay.style.top = `${offsetY + minY * imgRect.height}px`;
      overlay.style.width = `${(maxX - minX) * imgRect.width}px`;
      overlay.style.height = `${(maxY - minY) * imgRect.height}px`;

      // Add label
      overlay.innerHTML = `
        <div class="element-overlay__pulse"></div>
        <span class="element-overlay__label">${element.label}</span>
      `;

      // Click handler
      overlay.addEventListener('click', (e) => {
        e.stopPropagation();
        selectElement(element);
      });

      canvas.querySelector('.artwork-view__canvas').appendChild(overlay);
    });
  };

  if (mainImg.complete) {
    setupOverlays();
  } else {
    mainImg.addEventListener('load', setupOverlays, { once: true });
  }

  // Re-position on resize
  window.addEventListener('resize', () => {
    $$('.element-overlay').forEach(el => el.remove());
    if (AppState.elements.length > 0) {
      setupOverlays();
    }
  });
}

// ═══════════════════════════════════════════════════════════════════
// Element Selection
// ═══════════════════════════════════════════════════════════════════
async function selectElement(element) {
  AppState.selectedElement = element;

  // Dim the main image
  const mainImg = $('#artwork-main-image');
  mainImg.classList.add('artwork-view__main-image--dimmed');

  // Highlight selected overlay
  $$('.element-overlay').forEach(el => {
    el.classList.toggle('element-overlay--selected', el.dataset.elementId === element.id);
  });

  // Load relationships for this element
  const relationships = await ArtscapeAPI.discoverRelationships(
    AppState.selectedArtwork.id,
    element.id
  );
  AppState.relationships = relationships;

  // Open element detail panel
  openElementPanel(element, relationships);
}

function openElementPanel(element, relationships) {
  const panel = $('#element-panel');

  // Determine source type badge
  const sourceType = element.meaning.sourceType;
  const badgeClass = sourceType === 'artist_declared' ? 'artist' :
                     sourceType === 'externally_verified' ? 'verified' : 'inferred';
  const badgeLabel = sourceType === 'artist_declared' ? '✦ Artist Declared' :
                     sourceType === 'externally_verified' ? '✓ Externally Verified' : '◇ AI Inferred';

  panel.innerHTML = `
    <button class="element-panel__close" onclick="closeElementPanel()" id="panel-close-btn">✕</button>
    <div class="element-panel__type">${element.type}</div>
    <h2 class="element-panel__name">${element.label}</h2>

    <div class="element-panel__section">
      <div class="element-panel__section-label">Meaning</div>
      <p class="element-panel__text">${element.meaning.text}</p>
      <span class="element-panel__source-badge element-panel__source-badge--${badgeClass}">
        ${badgeLabel}
      </span>
    </div>

    <div class="element-panel__section">
      <div class="element-panel__section-label">Technique</div>
      <p class="element-panel__text">${element.technique}</p>
    </div>

    <div class="element-panel__section">
      <div class="element-panel__section-label">Tradition</div>
      <p class="element-panel__text">${element.tradition}</p>
    </div>

    <div class="element-panel__divider"></div>

    ${relationships.length > 0 ? `
      <div class="element-panel__section">
        <div class="element-panel__section-label">Discovered Connections</div>
        <p class="element-panel__text">
          This element connects to ${relationships.length} other artwork${relationships.length > 1 ? 's' : ''} in the corpus.
        </p>
      </div>

      ${relationships.map(rel => {
        const targetArtwork = AppState.artworks.find(a => a.id === rel.targetArtworkId);
        return `
          <button class="element-panel__follow-btn" onclick="followMotif('${rel.id}')" id="follow-btn-${rel.id}">
            <span>Follow to "${targetArtwork ? targetArtwork.title : 'Unknown'}"</span>
            <span class="hero__cta-arrow">→</span>
          </button>
        `;
      }).join('')}

      <p class="element-panel__follow-count">
        ${relationships.length} relationship${relationships.length > 1 ? 's' : ''} found · Agreement based on independent checks
      </p>
    ` : `
      <div class="element-panel__section">
        <div class="element-panel__section-label">Connections</div>
        <p class="element-panel__text" style="color: var(--text-tertiary);">
          No verified relationships found for this element in the current corpus.
        </p>
      </div>
    `}
  `;

  panel.classList.add('element-panel--open');
}

function closeElementPanel() {
  const panel = $('#element-panel');
  panel.classList.remove('element-panel--open');

  // Un-dim the image
  const mainImg = $('#artwork-main-image');
  if (mainImg) {
    mainImg.classList.remove('artwork-view__main-image--dimmed');
  }

  // Deselect overlays
  $$('.element-overlay').forEach(el => el.classList.remove('element-overlay--selected'));
  AppState.selectedElement = null;
}

// ═══════════════════════════════════════════════════════════════════
// Motif Travel Transition (The Money Shot)
// ═══════════════════════════════════════════════════════════════════
async function followMotif(relationshipId) {
  if (AppState.isTransitioning) return;
  AppState.isTransitioning = true;

  const relationship = RELATIONSHIPS.find(r => r.id === relationshipId);
  if (!relationship) return;

  const sourceArtwork = AppState.artworks.find(a => a.id === relationship.sourceArtworkId);
  const targetArtwork = AppState.artworks.find(a => a.id === relationship.targetArtworkId);
  const sourceElement = ARTWORK_ELEMENTS[relationship.sourceArtworkId]
    ?.find(e => e.id === relationship.sourceElementId);

  if (!sourceArtwork || !targetArtwork || !sourceElement) return;

  AppState.activeRelationship = relationship;

  // Close artwork view
  closeElementPanel();

  const travelView = $('#motif-travel');
  travelView.classList.add('motif-travel--active');

  // Stage 1: Show source artwork
  travelView.innerHTML = `
    <div class="motif-travel__stage" id="travel-stage">
      <img
        class="motif-travel__artwork-image"
        id="travel-image"
        src="${sourceArtwork.image}"
        alt="${sourceArtwork.title}"
      />
      <p class="motif-travel__label">${sourceArtwork.title}</p>
    </div>
  `;

  const stage = $('#travel-stage');
  await sleep(100);
  stage.classList.add('motif-travel__stage--visible');

  // Stage 2: Zoom into motif
  await sleep(1500);
  const img = $('#travel-image');
  img.style.transform = 'scale(1.8)';
  img.style.filter = 'brightness(0.3) saturate(0.5)';

  await sleep(800);

  // Stage 3: Show motif name
  stage.innerHTML = `
    <div class="motif-travel__motif-label">${sourceElement.label}</div>
    <div class="motif-travel__connector">
      <div class="motif-travel__connector-line"></div>
      <span class="motif-travel__connector-text">the motif travels</span>
      <div class="motif-travel__connector-line"></div>
    </div>
  `;
  stage.classList.add('motif-travel__stage--visible');

  await sleep(2500);

  // Stage 4: Show target artwork
  stage.classList.remove('motif-travel__stage--visible');
  await sleep(500);

  stage.innerHTML = `
    <img
      class="motif-travel__artwork-image"
      src="${targetArtwork.image}"
      alt="${targetArtwork.title}"
      style="opacity: 0; transform: scale(0.9); transition: all 1.2s cubic-bezier(0.16, 1, 0.3, 1);"
      id="travel-target-img"
    />
    <p class="motif-travel__label">${targetArtwork.title}</p>
  `;
  stage.classList.add('motif-travel__stage--visible');

  await sleep(100);
  const targetImg = $('#travel-target-img');
  targetImg.style.opacity = '1';
  targetImg.style.transform = 'scale(1)';

  await sleep(2000);

  // Transition to relationship view
  travelView.classList.remove('motif-travel--active');
  showRelationshipView(relationship);

  AppState.isTransitioning = false;
}

// ═══════════════════════════════════════════════════════════════════
// Relationship View
// ═══════════════════════════════════════════════════════════════════
function showRelationshipView(relationship) {
  const sourceArtwork = AppState.artworks.find(a => a.id === relationship.sourceArtworkId);
  const targetArtwork = AppState.artworks.find(a => a.id === relationship.targetArtworkId);
  const sourceElement = ARTWORK_ELEMENTS[relationship.sourceArtworkId]
    ?.find(e => e.id === relationship.sourceElementId);
  const targetElement = ARTWORK_ELEMENTS[relationship.targetArtworkId]
    ?.find(e => e.id === relationship.targetElementId);

  const view = $('#relationship-view');

  // Parse agreement
  const [agree, total] = relationship.agreement.split('/').map(Number);

  // Format relationship type
  const relTypeLabel = relationship.relationshipType
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());

  // Status badge
  const statusClass = relationship.status === 'verified' ? 'verified' :
                      relationship.status === 'candidate' ? 'candidate' : 'unknown';
  const statusLabel = relationship.status.charAt(0).toUpperCase() + relationship.status.slice(1);

  // Creator section (if target artwork has artist info)
  const showCreator = targetArtwork.artistStatement !== null;

  view.innerHTML = `
    <div class="relationship-view__header">
      <button class="artwork-view__back" onclick="closeRelationshipView()" id="rel-back-btn">
        ← Back to Gallery
      </button>
      <span class="artwork-view__artwork-title">Relationship Discovery</span>
      <span class="status-badge status-badge--${statusClass}">
        ${statusClass === 'verified' ? '✓' : '◇'} ${statusLabel}
      </span>
    </div>

    <div class="relationship-view__body">
      <!-- Artwork pair -->
      <div class="relationship-view__artworks">
        <div class="relationship-view__artwork">
          <img
            class="relationship-view__artwork-img"
            src="${sourceArtwork.image}"
            alt="${sourceArtwork.title}"
          />
          <h3 class="relationship-view__artwork-name">${sourceArtwork.title}</h3>
          <p class="relationship-view__artwork-creator">${sourceArtwork.creator} · ${sourceArtwork.year}</p>
        </div>

        <div class="relationship-view__connection">
          <div class="relationship-view__connection-icon">↔</div>
          <span class="relationship-view__connection-type">${relTypeLabel}</span>
          <span class="relationship-view__connection-type" style="color: var(--text-tertiary); font-size: 0.65rem;">
            ${sourceElement ? sourceElement.label : ''} → ${targetElement ? targetElement.label : ''}
          </span>
        </div>

        <div class="relationship-view__artwork">
          <img
            class="relationship-view__artwork-img"
            src="${targetArtwork.image}"
            alt="${targetArtwork.title}"
          />
          <h3 class="relationship-view__artwork-name">${targetArtwork.title}</h3>
          <p class="relationship-view__artwork-creator">${targetArtwork.creator} · ${targetArtwork.year}</p>
        </div>
      </div>

      <!-- Narrative -->
      <div class="narrative-panel">
        <p class="narrative-panel__text">${relationship.narrative}</p>
      </div>

      <!-- Evidence -->
      <div class="evidence-panel">
        <h3 class="evidence-panel__title">
          <span class="evidence-panel__title-icon">🔍</span>
          Why These Are Connected
        </h3>

        ${relationship.evidence.map(ev => `
          <div class="evidence-item">
            <div class="evidence-item__icon">✓</div>
            <div>
              <div class="evidence-item__type">${ev.type.replace(/_/g, ' ')}</div>
              <p class="evidence-item__text">${ev.description}</p>
            </div>
          </div>
        `).join('')}

        <div class="agreement-display">
          <div class="agreement-display__dots">
            ${Array.from({ length: total }, (_, i) => `
              <div class="agreement-dot ${i < agree ? 'agreement-dot--agree' : 'agreement-dot--disagree'}"></div>
            `).join('')}
          </div>
          <div>
            <div class="agreement-display__label">${relationship.agreement}</div>
            <div class="agreement-display__text">independent model checks agree</div>
          </div>
        </div>
      </div>

      <!-- Provenance -->
      <div class="provenance-section">
        <div class="provenance-section__title">Source & Attribution</div>
        <div class="provenance-item">
          <span class="provenance-item__label">Source A</span>
          <span class="provenance-item__value">${sourceArtwork.source}</span>
        </div>
        <div class="provenance-item">
          <span class="provenance-item__label">Source B</span>
          <span class="provenance-item__value">${targetArtwork.source}</span>
        </div>
        <div class="provenance-item">
          <span class="provenance-item__label">Rights</span>
          <span class="provenance-item__value">${targetArtwork.rights}</span>
        </div>
      </div>

      ${showCreator ? `
        <!-- Creator Section -->
        <div class="creator-section">
          <div class="creator-section__avatar">${targetArtwork.creator.charAt(0)}</div>
          <div class="creator-section__info">
            <div class="creator-section__label">Creator</div>
            <h3 class="creator-section__name">${targetArtwork.creator}</h3>
            <p class="creator-section__tradition">${targetArtwork.tradition} · ${targetArtwork.region}</p>
            ${targetArtwork.artistStatement ? `
              <p class="creator-section__statement">${targetArtwork.artistStatement}</p>
            ` : ''}
            <button class="creator-section__explore-btn" onclick="exploreCreator('${targetArtwork.id}')" id="explore-creator-btn">
              Explore Their Work →
            </button>
          </div>
        </div>
      ` : ''}

      <!-- Discover More -->
      <div class="discover-more">
        <h3 class="discover-more__title">
          <span>🎨</span> Continue Exploring
        </h3>
        <div class="discover-more__grid">
          ${AppState.artworks
            .filter(a => a.id !== sourceArtwork.id && a.id !== targetArtwork.id)
            .slice(0, 3)
            .map(a => `
              <div class="discover-more__item" onclick="openArtworkFromRelView('${a.id}')" id="discover-${a.id}">
                <img src="${a.image}" alt="${a.title}" />
                <div class="discover-more__item-overlay">
                  <span class="discover-more__item-name">${a.title}</span>
                </div>
              </div>
            `).join('')}
        </div>
      </div>
    </div>
  `;

  // Hide artwork view, show relationship view
  $('#artwork-view').classList.remove('artwork-view--active');
  view.classList.add('relationship-view--active');
}

function closeRelationshipView() {
  $('#relationship-view').classList.remove('relationship-view--active');
  AppState.activeRelationship = null;
  navigateTo('gallery');
}

function openArtworkFromRelView(artworkId) {
  $('#relationship-view').classList.remove('relationship-view--active');
  AppState.activeRelationship = null;
  openArtworkView(artworkId);
}

function exploreCreator(artworkId) {
  showToast('Creator profile — feature coming soon');
}

// ═══════════════════════════════════════════════════════════════════
// Toast Notifications
// ═══════════════════════════════════════════════════════════════════
function showToast(message, duration = 3000) {
  let toast = $('#app-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'app-toast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }

  toast.textContent = message;
  toast.classList.add('toast--visible');

  clearTimeout(toast._timeout);
  toast._timeout = setTimeout(() => {
    toast.classList.remove('toast--visible');
  }, duration);
}

// ═══════════════════════════════════════════════════════════════════
// Scroll Reveal Animations
// ═══════════════════════════════════════════════════════════════════
function initRevealAnimations() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('reveal--visible');
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  });

  $$('.reveal').forEach(el => observer.observe(el));
}

// ═══════════════════════════════════════════════════════════════════
// Particle Background
// ═══════════════════════════════════════════════════════════════════
function initParticles() {
  const canvas = document.createElement('canvas');
  canvas.className = 'particles-canvas';
  const hero = $('.hero');
  if (!hero) return;
  hero.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  let particles = [];
  let animFrame;

  function resize() {
    canvas.width = hero.offsetWidth;
    canvas.height = hero.offsetHeight;
  }

  function createParticles() {
    particles = [];
    const count = Math.min(60, Math.floor(canvas.width * canvas.height / 15000));
    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        size: Math.random() * 2 + 0.5,
        opacity: Math.random() * 0.3 + 0.05
      });
    }
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;

      if (p.x < 0) p.x = canvas.width;
      if (p.x > canvas.width) p.x = 0;
      if (p.y < 0) p.y = canvas.height;
      if (p.y > canvas.height) p.y = 0;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(79, 209, 197, ${p.opacity})`;
      ctx.fill();
    });

    // Draw connections
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 120) {
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(79, 209, 197, ${0.06 * (1 - dist / 120)})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }

    animFrame = requestAnimationFrame(draw);
  }

  resize();
  createParticles();
  draw();

  window.addEventListener('resize', () => {
    resize();
    createParticles();
  });
}

// ═══════════════════════════════════════════════════════════════════
// Utilities
// ═══════════════════════════════════════════════════════════════════
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
