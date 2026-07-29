/**
 * Variant Image Grouping System
 * ------------------------------------------------------------------
 * - Filters thumbnails by the selected variant's option value (ALT match)
 * - Cinematic fade + zoom transition of the hero image (0.5s)
 * - Magnifying-glass zoom driven by mousemove
 * - AJAX add to cart via /cart/add.js
 * - Debounced variant switching for rapid clicks
 * Vanilla ES6+. No frameworks, no dependencies.
 */
(function () {
  'use strict';

  const TRANSITION_MS = 500;

  /** Simple trailing debounce */
  function debounce(fn, wait = 120) {
    let t;
    return function (...args) {
      clearTimeout(t);
      t = setTimeout(() => fn.apply(this, args), wait);
    };
  }

  function formatMoney(cents, format) {
    const amount = (cents / 100).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    if (!format) return '$' + amount;
    return format.replace(/\{\{\s*amount[^}]*\}\}/, amount);
  }

  class VariantImageSection {
    constructor(root) {
      this.root = root;
      this.moneyFormat = root.dataset.moneyFormat || '';

      this.variants = this.parseJSON('[data-variant-json]', []);
      this.images = this.parseJSON('[data-images-json]', []);

      this.form = root.querySelector('[data-product-form]');
      this.variantInput = root.querySelector('[data-variant-id]');
      this.heroFrame = root.querySelector('[data-hero-frame]');
      this.heroImg = root.querySelector('[data-hero-img]');
      this.heroLens = root.querySelector('[data-hero-lens]');
      this.counter = root.querySelector('[data-hero-counter]');
      this.gallery = root.querySelector('[data-thumbnail-gallery]');
      this.thumbs = Array.from(root.querySelectorAll('[data-thumbnail-item]'));
      this.status = root.querySelector('[data-cart-status]');
      this.atc = root.querySelector('[data-add-to-cart]');
      this.atcText = root.querySelector('[data-atc-text]');
      this.atcSpinner = root.querySelector('[data-atc-spinner]');
      this.priceEl = root.querySelector('[data-price]');
      this.compareEl = root.querySelector('[data-compare-price]');
      this.availabilityEl = root.querySelector('[data-availability]');

      this.selectedOptions = this.readSelectedOptions();
      this.visibleThumbs = [];
      this.currentIndex = 0;

      this.bindOptions();
      this.bindThumbnails();
      this.bindHeroNav();
      this.bindMagnifier();
      this.bindQuantity();
      this.bindCart();

      this.refreshVisibleThumbs();
    }

    parseJSON(selector, fallback) {
      const el = this.root.querySelector(selector);
      if (!el) return fallback;
      try {
        return JSON.parse(el.textContent);
      } catch (err) {
        console.warn('[variant-images] Bad JSON in', selector, err);
        return fallback;
      }
    }

    readSelectedOptions() {
      const buttons = this.root.querySelectorAll('[data-option-button].is-selected');
      const opts = [];
      buttons.forEach((btn) => {
        opts[parseInt(btn.dataset.optionPosition, 10) - 1] = btn.dataset.optionValue;
      });
      return opts;
    }

    /* ------------------------- Variant options ------------------------- */

    bindOptions() {
      const handle = debounce((btn) => this.selectOption(btn), 80);
      this.root.querySelectorAll('[data-option-button]').forEach((btn) => {
        btn.addEventListener('click', () => handle(btn));
      });
    }

    selectOption(btn) {
      const position = parseInt(btn.dataset.optionPosition, 10);
      const value = btn.dataset.optionValue;
      const group = btn.closest('.vig-option__values');

      group.querySelectorAll('[data-option-button]').forEach((b) => {
        const on = b === btn;
        b.classList.toggle('is-selected', on);
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
      });

      const label = btn.closest('.vig-option').querySelector('[data-option-selected-value]');
      if (label) label.textContent = value;

      this.selectedOptions[position - 1] = value;
      this.updateVariant();
    }

    matchVariant() {
      return this.variants.find((v) =>
        this.selectedOptions.every((val, i) => val === undefined || v.options[i] === val)
      );
    }

    updateVariant() {
      const variant = this.matchVariant();

      if (!variant) {
        this.setUnavailable();
        return;
      }

      if (this.variantInput) this.variantInput.value = variant.id;

      // Keep the URL shareable/refreshable.
      if (window.history && window.history.replaceState) {
        const url = new URL(window.location.href);
        url.searchParams.set('variant', variant.id);
        window.history.replaceState({}, '', url.toString());
      }

      // Price
      if (this.priceEl) this.priceEl.textContent = formatMoney(variant.price, this.moneyFormat);
      if (this.compareEl) {
        if (variant.compare_at_price && variant.compare_at_price > variant.price) {
          this.compareEl.textContent = formatMoney(variant.compare_at_price, this.moneyFormat);
          this.compareEl.hidden = false;
        } else {
          this.compareEl.hidden = true;
        }
      }

      // Availability + button
      if (this.availabilityEl) {
        this.availabilityEl.innerHTML =
          '<span class="vig-dot ' +
          (variant.available ? 'is-in' : 'is-out') +
          '"></span>' +
          (variant.available ? 'In stock — ready to ship' : 'Sold out');
      }
      if (this.atc) this.atc.disabled = !variant.available;
      if (this.atcText) this.atcText.textContent = variant.available ? 'Add to cart' : 'Sold out';

      // Image filtering
      this.filterThumbnails(variant.options[0], variant.featured_image);
      this.root.dispatchEvent(new CustomEvent('vig:variant:change', { detail: { variant }, bubbles: true }));
    }

    setUnavailable() {
      if (this.atc) this.atc.disabled = true;
      if (this.atcText) this.atcText.textContent = 'Unavailable';
      if (this.availabilityEl) {
        this.availabilityEl.innerHTML = '<span class="vig-dot is-out"></span>This combination is unavailable';
      }
    }

    /* ------------------------- Thumbnails ------------------------- */

    filterThumbnails(colorValue, featuredImage) {
      const wanted = (colorValue || '').toString().trim().toLowerCase();
      const featuredSrc = featuredImage && featuredImage.src ? featuredImage.src.split('?')[0] : null;

      let firstVisible = null;

      this.thumbs.forEach((thumb) => {
        const alt = (thumb.dataset.alt || '').trim().toLowerCase();
        const isFeatured =
          featuredSrc && thumb.dataset.image && thumb.dataset.image.indexOf(featuredSrc.split('/').pop().split('.')[0]) !== -1;
        const match = !wanted || alt === wanted || isFeatured;

        thumb.classList.toggle('is-hidden', !match);
        if (match && !firstVisible) firstVisible = thumb;
      });

      // Fallback: never leave the gallery empty.
      if (!firstVisible) {
        this.thumbs.forEach((t) => t.classList.remove('is-hidden'));
        firstVisible = this.thumbs[0];
      }

      this.refreshVisibleThumbs();
      if (firstVisible) this.activateThumb(firstVisible);
    }

    refreshVisibleThumbs() {
      this.visibleThumbs = this.thumbs.filter((t) => !t.classList.contains('is-hidden'));
      this.visibleThumbs.forEach((t, i) => {
        t.style.setProperty('--stagger', i * 60 + 'ms');
        t.classList.remove('vig-thumb--enter');
        // Force reflow to replay the entrance animation.
        void t.offsetWidth;
        t.classList.add('vig-thumb--enter');
      });
      this.updateCounter();
    }

    bindThumbnails() {
      this.thumbs.forEach((thumb) => {
        thumb.addEventListener('click', () => this.activateThumb(thumb));
      });
    }

    activateThumb(thumb) {
      if (!thumb) return;
      this.thumbs.forEach((t) => t.classList.toggle('is-active', t === thumb));
      this.currentIndex = Math.max(0, this.visibleThumbs.indexOf(thumb));
      this.swapHero(thumb.dataset.image, thumb.dataset.zoom, thumb.dataset.alt);
      this.updateCounter();
    }

    /* ------------------------- Hero image ------------------------- */

    swapHero(src, zoomSrc, alt) {
      if (!this.heroImg || !src || this.heroImg.getAttribute('src') === src) return;

      const preload = new Image();
      preload.onload = () => {
        this.heroImg.classList.remove('is-visible');
        setTimeout(() => {
          this.heroImg.src = src;
          this.heroImg.dataset.zoomSrc = zoomSrc || src;
          if (alt) this.heroImg.alt = alt;
          if (this.heroLens) this.heroLens.style.backgroundImage = 'url("' + (zoomSrc || src) + '")';
          requestAnimationFrame(() => this.heroImg.classList.add('is-visible'));
        }, TRANSITION_MS / 2);
      };
      preload.src = src;
    }

    bindHeroNav() {
      const prev = this.root.querySelector('[data-hero-prev]');
      const next = this.root.querySelector('[data-hero-next]');
      const step = (dir) => {
        if (!this.visibleThumbs.length) return;
        const len = this.visibleThumbs.length;
        this.currentIndex = (this.currentIndex + dir + len) % len;
        this.activateThumb(this.visibleThumbs[this.currentIndex]);
      };
      if (prev) prev.addEventListener('click', () => step(-1));
      if (next) next.addEventListener('click', () => step(1));

      this.root.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') step(-1);
        if (e.key === 'ArrowRight') step(1);
      });
    }

    updateCounter() {
      if (!this.counter) return;
      const total = this.visibleThumbs.length;
      this.counter.textContent = total ? this.currentIndex + 1 + ' / ' + total : '';
    }

    /* ------------------------- Magnifying glass ------------------------- */

    bindMagnifier() {
      if (!this.heroFrame || !this.heroImg || !this.heroLens) return;
      const lens = this.heroLens;

      const setBg = () => {
        lens.style.backgroundImage = 'url("' + (this.heroImg.dataset.zoomSrc || this.heroImg.src) + '")';
      };
      setBg();

      this.heroFrame.addEventListener('mouseenter', () => {
        if (window.matchMedia('(hover: none)').matches) return;
        setBg();
        lens.classList.add('is-active');
      });

      this.heroFrame.addEventListener('mouseleave', () => {
        lens.classList.remove('is-active');
      });

      this.heroFrame.addEventListener('mousemove', (e) => {
        if (!lens.classList.contains('is-active')) return;
        const rect = this.heroFrame.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const px = (x / rect.width) * 100;
        const py = (y / rect.height) * 100;

        lens.style.left = x + 'px';
        lens.style.top = y + 'px';
        lens.style.backgroundSize = rect.width * 2 + 'px ' + rect.height * 2 + 'px';
        lens.style.backgroundPosition = px + '% ' + py + '%';
      });
    }

    /* ------------------------- Quantity ------------------------- */

    bindQuantity() {
      const input = this.root.querySelector('[data-qty-input]');
      const minus = this.root.querySelector('[data-qty-minus]');
      const plus = this.root.querySelector('[data-qty-plus]');
      if (!input) return;
      if (minus) minus.addEventListener('click', () => {
        input.value = Math.max(1, parseInt(input.value, 10) - 1);
      });
      if (plus) plus.addEventListener('click', () => {
        input.value = parseInt(input.value, 10) + 1;
      });
    }

    /* ------------------------- AJAX cart ------------------------- */

    bindCart() {
      if (!this.form) return;
      const submit = debounce(() => this.addToCart(), 200);
      this.form.addEventListener('submit', (e) => {
        e.preventDefault();
        submit();
      });
    }

    async addToCart() {
      if (!this.form || this.loading) return;
      this.setLoading(true);
      this.setStatus('');

      try {
        const res = await fetch('/cart/add.js', {
          method: 'POST',
          headers: { Accept: 'application/json' },
          body: new FormData(this.form),
        });
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.description || data.message || 'Could not add to cart.');
        }

        this.setStatus('Added to your cart ✓', 'success');
        document.dispatchEvent(new CustomEvent('vig:cart:added', { detail: { item: data } }));

        // Refresh Dawn-style cart drawers / bubbles if present.
        const cartRes = await fetch('/cart.js', { headers: { Accept: 'application/json' } });
        const cart = await cartRes.json();
        document.dispatchEvent(new CustomEvent('cart:refresh', { detail: { cart }, bubbles: true }));
      } catch (err) {
        this.setStatus(err.message, 'error');
      } finally {
        this.setLoading(false);
      }
    }

    setLoading(state) {
      this.loading = state;
      if (this.atc) this.atc.classList.toggle('is-loading', state);
      if (this.atcSpinner) this.atcSpinner.hidden = !state;
    }

    setStatus(message, type) {
      if (!this.status) return;
      this.status.textContent = message;
      this.status.className = 'vig-form__status' + (type ? ' is-' + type : '');
    }
  }

  function init() {
    document.querySelectorAll('[data-section-type="product-main"]').forEach((el) => {
      if (el.__vigReady) return;
      el.__vigReady = true;
      new VariantImageSection(el);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Theme editor support (Shopify 2.0)
  document.addEventListener('shopify:section:load', init);
})();
