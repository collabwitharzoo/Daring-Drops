/* Daring Drops — Cart Manager */

const CartModule = (() => {
  const CART_KEY = 'dd_cart_id';
  let cart = null;
  const listeners = [];

  function getCartId() {
    return localStorage.getItem(CART_KEY);
  }

  function saveCartId(id) {
    localStorage.setItem(CART_KEY, id);
  }

  function notify() {
    updateBadge();
    listeners.forEach(fn => fn(cart));
  }

  function updateBadge() {
    const badges = document.querySelectorAll('.cart-badge');
    const count = cart?.totalQuantity || 0;
    badges.forEach(b => {
      b.textContent = count;
      b.classList.toggle('visible', count > 0);
    });
  }

  async function loadCart() {
    const cartId = getCartId();
    if (!cartId) return;
    try {
      cart = await ShopifyAPI.fetchCart(cartId);
      if (!cart) {
        localStorage.removeItem(CART_KEY);
      }
    } catch (e) {
      console.warn('Cart load failed:', e);
    }
    notify();
  }

  async function addItem(variantId, quantity = 1) {
    const lines = [{ merchandiseId: variantId, quantity }];
    try {
      if (!cart) {
        cart = await ShopifyAPI.createCart(lines);
        saveCartId(cart.id);
      } else {
        // Check if variant already in cart
        const existing = cart.lines.edges.find(
          e => e.node.merchandise.id === variantId
        );
        if (existing) {
          cart = await ShopifyAPI.updateCartLines(cart.id, [{
            id: existing.node.id,
            quantity: existing.node.quantity + quantity
          }]);
        } else {
          cart = await ShopifyAPI.addCartLines(cart.id, lines);
        }
      }
      notify();
      showToast('Added to cart!', '✦');
      return cart;
    } catch (e) {
      console.error('Add to cart failed:', e);
      showToast('Could not add to cart. Please try again.', '✕');
      throw e;
    }
  }

  async function updateQuantity(lineId, quantity) {
    if (!cart) return;
    try {
      if (quantity <= 0) {
        return removeItem(lineId);
      }
      cart = await ShopifyAPI.updateCartLines(cart.id, [{ id: lineId, quantity }]);
      notify();
    } catch (e) {
      console.error('Update quantity failed:', e);
    }
  }

  async function removeItem(lineId) {
    if (!cart) return;
    try {
      cart = await ShopifyAPI.removeCartLines(cart.id, [lineId]);
      notify();
    } catch (e) {
      console.error('Remove item failed:', e);
    }
  }

  function getCart() {
    return cart;
  }

  function getCheckoutUrl() {
    return cart?.checkoutUrl || null;
  }

  function getLineItems() {
    return cart?.lines?.edges?.map(e => e.node) || [];
  }

  function getSubtotal() {
    return cart?.cost?.subtotalAmount?.amount || '0';
  }

  function buildWhatsAppOrderMessage() {
    const items = getLineItems();
    if (!items.length) return '';
    let msg = '🛍️ *Daring Drops Order Inquiry*\n\n';
    items.forEach(item => {
      const v = item.merchandise;
      msg += `• ${v.product.title}`;
      if (v.title !== 'Default Title') msg += ` (${v.title})`;
      msg += ` × ${item.quantity} — ${formatPrice(v.priceV2.amount)}\n`;
    });
    msg += `\n💰 *Subtotal: ${formatPrice(getSubtotal())}*\n\nPlease confirm availability and share payment details. Thank you! 🌸`;
    return msg;
  }

  function onChange(fn) {
    listeners.push(fn);
  }

  // Initialize
  document.addEventListener('DOMContentLoaded', loadCart);

  return {
    addItem,
    updateQuantity,
    removeItem,
    getCart,
    getCheckoutUrl,
    getLineItems,
    getSubtotal,
    buildWhatsAppOrderMessage,
    onChange,
    loadCart
  };
})();

window.CartModule = CartModule;
