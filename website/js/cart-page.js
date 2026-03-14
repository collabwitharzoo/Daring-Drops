/* Daring Drops — Cart Page Renderer */

function renderCartPage() {
  const layout = document.getElementById('cart-layout');
  if (!layout) return;

  const items = CartModule.getLineItems();
  const subtotal = CartModule.getSubtotal();
  const checkoutUrl = CartModule.getCheckoutUrl();
  const currency = DD_CONFIG.currency;

  if (!items.length) {
    layout.innerHTML = `
      <div class="cart-empty" style="grid-column:1/-1">
        <div class="cart-empty-icon">✦</div>
        <h2>Your cart is empty</h2>
        <p>Looks like you haven't added anything yet.</p>
        <a href="shop.html" class="btn btn-primary">Shop Now</a>
      </div>`;
    return;
  }

  const itemsHTML = items.map(item => {
    const v = item.merchandise;
    const img = v.product.images.edges[0]?.node;
    return `
      <div class="cart-item" data-line-id="${item.id}">
        <div class="cart-item-image">
          ${img ? `<img src="${img.url}" alt="${v.product.title}" loading="lazy">` : '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:var(--gold);font-size:24px">✦</div>'}
        </div>
        <div class="cart-item-info">
          <div class="cart-item-name">${v.product.title}</div>
          ${v.title !== 'Default Title' ? `<div class="cart-item-variant">${v.title}</div>` : ''}
          <div class="cart-item-qty">
            <button class="cart-qty-btn" onclick="changeQty('${item.id}', ${item.quantity - 1})">−</button>
            <span class="cart-qty-num">${item.quantity}</span>
            <button class="cart-qty-btn" onclick="changeQty('${item.id}', ${item.quantity + 1})">+</button>
          </div>
        </div>
        <div class="cart-item-right">
          <div class="cart-item-price">${formatPrice(parseFloat(v.priceV2.amount) * item.quantity, v.priceV2.currencyCode)}</div>
          <button class="cart-item-remove" onclick="removeItem('${item.id}')">Remove</button>
        </div>
      </div>`;
  }).join('');

  const waMsg = CartModule.buildWhatsAppOrderMessage();

  layout.innerHTML = `
    <div class="cart-items">${itemsHTML}</div>
    <div class="order-summary">
      <h3>Order Summary</h3>
      <div class="summary-line">
        <span>Subtotal</span>
        <span>${formatPrice(subtotal, currency)}</span>
      </div>
      <div class="summary-line">
        <span>Shipping</span>
        <span style="color:var(--gold)">Calculated at checkout</span>
      </div>
      <div class="summary-line total">
        <span>Total</span>
        <span>${formatPrice(subtotal, currency)}</span>
      </div>
      <div class="summary-delivery-note">
        ✦ Free shipping on orders above ₹999 · Delivery in 3–7 business days
      </div>
      <button class="btn btn-primary checkout-btn" onclick="goToCheckout()">
        Proceed to Checkout →
      </button>
      <a class="wa-order-btn" href="${buildWhatsAppLink(waMsg)}" target="_blank" rel="noopener">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
        Order via WhatsApp
      </a>
      <a href="shop.html" class="continue-shopping">← Continue Shopping</a>
    </div>`;
}

window.changeQty = async function(lineId, qty) {
  await CartModule.updateQuantity(lineId, qty);
};

window.removeItem = async function(lineId) {
  await CartModule.removeItem(lineId);
};

window.goToCheckout = function() {
  const url = CartModule.getCheckoutUrl();
  if (url) {
    window.location.href = url;
  } else {
    showToast('Your cart is empty', '✦');
  }
};

document.addEventListener('DOMContentLoaded', () => {
  CartModule.onChange(renderCartPage);
  // Render once cart is loaded (slight delay for cart to init)
  setTimeout(renderCartPage, 200);
});
