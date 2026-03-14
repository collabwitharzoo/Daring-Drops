/* Daring Drops — Shop Page */

const ShopPage = (() => {
  let currentCollection = null;
  let cursor = null;
  let hasMore = false;
  let loading = false;

  const grid = document.getElementById('shop-grid');
  const countEl = document.getElementById('shop-count');
  const loadMoreBtn = document.getElementById('load-more-btn');
  const loadMoreWrap = document.getElementById('load-more-wrap');

  function renderSkeletons(n = 6) {
    return Array.from({ length: n }).map(() => `
      <div class="product-card-skeleton">
        <div class="skeleton-img"></div>
        <div class="skeleton-line short"></div>
        <div class="skeleton-line full"></div>
      </div>
    `).join('');
  }

  function renderCard(product) {
    const image = product.images.edges[0]?.node;
    const price = product.priceRange.minVariantPrice;
    const compareAt = product.compareAtPriceRange?.minVariantPrice?.amount;
    const firstVariant = product.variants.edges[0]?.node;
    const variantId = firstVariant?.id || '';
    const inStock = firstVariant?.availableForSale ?? true;

    return `
      <div class="product-card" onclick="location.href='product.html?handle=${product.handle}'">
        <div class="product-card-image">
          ${image
            ? `<img src="${image.url}" alt="${image.altText || product.title}" loading="lazy">`
            : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:var(--gold);font-size:32px;">✦</div>`
          }
          <button class="product-card-wishlist" data-id="${product.id}" aria-label="Wishlist" onclick="event.stopPropagation()">♡</button>
          ${!inStock ? `<div style="position:absolute;bottom:8px;left:8px;background:rgba(28,35,64,0.8);color:#fff;font-size:10px;letter-spacing:0.1em;text-transform:uppercase;padding:4px 10px;border-radius:999px;">Sold Out</div>` : ''}
        </div>
        <div class="product-card-body">
          <div class="product-card-name">${product.title}</div>
          <div class="product-card-price">
            ${formatPrice(price.amount, price.currencyCode)}
            ${compareAt && parseFloat(compareAt) > parseFloat(price.amount)
              ? `<span style="font-weight:400;text-decoration:line-through;color:var(--text-secondary);margin-left:6px;">${formatPrice(compareAt, price.currencyCode)}</span>`
              : ''}
          </div>
          <button class="product-card-add"
            data-variant="${variantId}"
            ${!inStock ? 'disabled' : ''}
            onclick="event.stopPropagation(); ShopPage.addToCart('${variantId}', this)">
            ${inStock ? 'Add to Cart' : 'Sold Out'}
          </button>
        </div>
      </div>
    `;
  }

  async function loadProducts(append = false) {
    if (loading) return;
    loading = true;
    if (!append) {
      grid.innerHTML = renderSkeletons(6);
      cursor = null;
    } else if (loadMoreBtn) {
      loadMoreBtn.textContent = 'Loading...';
      loadMoreBtn.disabled = true;
    }

    try {
      const result = await ShopifyAPI.fetchAllProducts(currentCollection, cursor);
      cursor = result.cursor;
      hasMore = result.hasNextPage;

      if (!append) grid.innerHTML = '';

      if (!result.products.length && !append) {
        grid.innerHTML = `
          <div class="no-products">
            <div class="no-products-icon">✦</div>
            <h3>No products found</h3>
            <p style="color:var(--text-secondary)">Try a different category or check back soon.</p>
          </div>`;
        if (countEl) countEl.textContent = '';
      } else {
        result.products.forEach(p => {
          grid.insertAdjacentHTML('beforeend', renderCard(p));
        });
        if (countEl) {
          const total = grid.querySelectorAll('.product-card').length;
          countEl.textContent = `Showing ${total} product${total !== 1 ? 's' : ''}`;
        }
      }

      if (loadMoreWrap) {
        loadMoreWrap.style.display = hasMore ? 'block' : 'none';
      }
    } catch (e) {
      console.error('Failed to load products:', e);
      if (!append) {
        grid.innerHTML = `
          <div class="no-products">
            <div class="no-products-icon">⚠</div>
            <h3>Could not load products</h3>
            <p style="color:var(--text-secondary)">Please check your Shopify configuration in js/main.js</p>
          </div>`;
      }
    } finally {
      loading = false;
      if (loadMoreBtn) {
        loadMoreBtn.textContent = 'Load More';
        loadMoreBtn.disabled = false;
      }
    }
  }

  async function addToCart(variantId, btn) {
    if (!variantId) return;
    const originalText = btn.textContent;
    btn.textContent = '...';
    btn.disabled = true;
    try {
      await CartModule.addItem(variantId);
    } finally {
      btn.textContent = originalText;
      btn.disabled = false;
    }
  }

  function init() {
    if (!grid) return;

    // Filter pills
    document.querySelectorAll('.filter-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        document.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        currentCollection = pill.dataset.collection || null;
        loadProducts();
      });
    });

    // Load more
    if (loadMoreBtn) {
      loadMoreBtn.addEventListener('click', () => loadProducts(true));
    }

    loadProducts();
  }

  return { init, addToCart };
})();

document.addEventListener('DOMContentLoaded', ShopPage.init);
