/* Daring Drops — Product Detail Page */

const ProductPage = (() => {
  let product = null;
  let selectedVariantId = null;
  let quantity = 1;

  function getHandle() {
    return new URLSearchParams(window.location.search).get('handle');
  }

  function renderImages(images) {
    const mainImg = document.getElementById('product-main-img');
    const thumbs = document.getElementById('product-thumbs');
    if (!images.length) return;

    const first = images[0];
    if (mainImg) mainImg.src = first.url;

    if (thumbs) {
      thumbs.innerHTML = images.map((img, i) => `
        <div class="product-thumb ${i === 0 ? 'active' : ''}" onclick="ProductPage.setImage('${img.url}', this)">
          <img src="${img.url}" alt="${img.altText || ''}">
        </div>
      `).join('');
    }
  }

  function renderVariants(variants) {
    const container = document.getElementById('variant-options');
    if (!container) return;

    // Group by option name
    const options = {};
    variants.forEach(v => {
      if (!v.availableForSale && variants.length > 1) return;
      v.selectedOptions.forEach(opt => {
        if (!options[opt.name]) options[opt.name] = new Set();
        options[opt.name].add(opt.value);
      });
    });

    // If only one "Default Title" variant, hide
    if (variants.length === 1 && variants[0].title === 'Default Title') {
      container.closest('.variant-section')?.remove();
      return;
    }

    container.innerHTML = Object.entries(options).map(([name, values]) => `
      <div class="variant-group" data-option="${name}">
        <div class="variant-label">${name}</div>
        <div class="variant-options">
          ${[...values].map(val => `
            <button class="variant-btn" data-value="${val}" onclick="ProductPage.selectVariant('${name}', '${val}', this)">${val}</button>
          `).join('')}
        </div>
      </div>
    `).join('');

    // Select first variant by default
    const firstVariant = variants.find(v => v.availableForSale) || variants[0];
    if (firstVariant) {
      selectedVariantId = firstVariant.id;
      firstVariant.selectedOptions.forEach(opt => {
        const btn = container.querySelector(`[data-option="${opt.name}"] [data-value="${opt.value}"]`);
        if (btn) btn.classList.add('active');
      });
    }
  }

  function setImage(url, thumb) {
    const mainImg = document.getElementById('product-main-img');
    if (mainImg) {
      mainImg.style.opacity = '0.6';
      mainImg.src = url;
      mainImg.onload = () => { mainImg.style.opacity = '1'; };
    }
    document.querySelectorAll('.product-thumb').forEach(t => t.classList.remove('active'));
    if (thumb) thumb.classList.add('active');
  }

  function selectVariant(optionName, value, btn) {
    // Update UI
    const group = btn.closest('.variant-group');
    group.querySelectorAll('.variant-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    // Find matching variant
    if (!product) return;
    const selectedOptions = {};
    document.querySelectorAll('.variant-group').forEach(g => {
      const active = g.querySelector('.variant-btn.active');
      if (active) selectedOptions[g.dataset.option] = active.dataset.value;
    });

    const match = product.variants.edges.map(e => e.node).find(v =>
      v.selectedOptions.every(o => selectedOptions[o.name] === o.value)
    );

    if (match) {
      selectedVariantId = match.id;
      const priceEl = document.getElementById('product-price');
      if (priceEl) priceEl.textContent = formatPrice(match.priceV2.amount, match.priceV2.currencyCode);

      const addBtn = document.getElementById('add-to-cart-btn');
      if (addBtn) {
        if (!match.availableForSale) {
          addBtn.textContent = 'Sold Out';
          addBtn.disabled = true;
        } else {
          addBtn.textContent = 'Add to Cart';
          addBtn.disabled = false;
        }
      }
    }
  }

  function setQty(n) {
    quantity = Math.max(1, n);
    const input = document.getElementById('qty-input');
    if (input) input.value = quantity;
  }

  async function addToCart() {
    if (!selectedVariantId) return;
    const btn = document.getElementById('add-to-cart-btn');
    const original = btn.textContent;
    btn.textContent = 'Adding...';
    btn.disabled = true;
    try {
      await CartModule.addItem(selectedVariantId, quantity);
    } finally {
      btn.textContent = original;
      btn.disabled = false;
    }
  }

  async function loadRelated(collection) {
    const section = document.getElementById('related-grid');
    if (!section || !collection) return;
    try {
      const result = await ShopifyAPI.fetchAllProducts(collection);
      const others = result.products.filter(p => p.handle !== product.handle).slice(0, 4);
      if (!others.length) {
        section.closest('.related-section')?.remove();
        return;
      }
      section.innerHTML = others.map(p => {
        const img = p.images.edges[0]?.node;
        const price = p.priceRange.minVariantPrice;
        return `
          <div class="product-card" onclick="location.href='product.html?handle=${p.handle}'">
            <div class="product-card-image">
              ${img ? `<img src="${img.url}" alt="${p.title}" loading="lazy">` : ''}
              <button class="product-card-wishlist" onclick="event.stopPropagation()">♡</button>
            </div>
            <div class="product-card-body">
              <div class="product-card-name">${p.title}</div>
              <div class="product-card-price">${formatPrice(price.amount, price.currencyCode)}</div>
              <button class="product-card-add">View Product</button>
            </div>
          </div>`;
      }).join('');
    } catch (e) {
      section.closest('.related-section')?.remove();
    }
  }

  async function init() {
    const handle = getHandle();
    if (!handle) {
      window.location.href = 'shop.html';
      return;
    }

    // Show skeleton
    const titleEl = document.getElementById('product-title');
    const priceEl = document.getElementById('product-price');
    const descEl = document.getElementById('product-description');
    const collEl = document.getElementById('product-collection');
    const addBtn = document.getElementById('add-to-cart-btn');

    try {
      product = await ShopifyAPI.fetchProductByHandle(handle);
      if (!product) {
        window.location.href = 'shop.html';
        return;
      }

      document.title = `${product.title} — Daring Drops`;

      if (titleEl) titleEl.textContent = product.title;

      const price = product.priceRange.minVariantPrice;
      if (priceEl) priceEl.textContent = formatPrice(price.amount, price.currencyCode);

      if (descEl) descEl.textContent = product.description || '';

      const col = product.collections.edges[0]?.node;
      if (collEl && col) collEl.textContent = col.title;

      renderImages(product.images.edges.map(e => e.node));
      renderVariants(product.variants.edges.map(e => e.node));

      // WhatsApp button
      const waBtn = document.getElementById('wa-btn');
      if (waBtn) {
        waBtn.href = buildWhatsAppLink(`Hi! I'm interested in "${product.title}" — ${window.location.href}`);
      }

      // Breadcrumb
      const bcProduct = document.getElementById('bc-product');
      if (bcProduct) bcProduct.textContent = product.title;

      if (col) loadRelated(col.handle);

    } catch (e) {
      console.error('Product load failed:', e);
    }
  }

  return { init, setImage, selectVariant, setQty, addToCart };
})();

document.addEventListener('DOMContentLoaded', ProductPage.init);

// Qty buttons
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('qty-minus')?.addEventListener('click', () => {
    const input = document.getElementById('qty-input');
    ProductPage.setQty(parseInt(input?.value || 1) - 1);
  });
  document.getElementById('qty-plus')?.addEventListener('click', () => {
    const input = document.getElementById('qty-input');
    ProductPage.setQty(parseInt(input?.value || 1) + 1);
  });
  document.getElementById('add-to-cart-btn')?.addEventListener('click', ProductPage.addToCart);
});
