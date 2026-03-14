/* Daring Drops — Global Config & Utilities */

window.DD_CONFIG = {
  shopDomain: 'YOUR-STORE.myshopify.com',    // ← Replace with your Shopify store domain
  storefrontToken: 'YOUR-STOREFRONT-TOKEN',  // ← Replace with your Storefront API token
  waNumber: '919999999999',                  // ← Replace with your WhatsApp number (with country code, no +)
  currency: 'INR'
};

// ── Format currency ──
window.formatPrice = function(amount, currency = DD_CONFIG.currency) {
  const num = parseFloat(amount);
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(num);
};

// ── Toast notifications ──
window.showToast = function(message, icon = '✓') {
  let toast = document.getElementById('dd-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'dd-toast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.innerHTML = `<span class="toast-icon">${icon}</span><span>${message}</span>`;
  toast.classList.add('show');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove('show'), 3000);
};

// ── WhatsApp link builder ──
window.buildWhatsAppLink = function(message) {
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${DD_CONFIG.waNumber}?text=${encoded}`;
};

// ── Debounce ──
window.debounce = function(fn, ms) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
};

// ── Intersection observer for scroll animations ──
window.initScrollReveal = function() {
  const els = document.querySelectorAll('[data-reveal]');
  if (!els.length) return;
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('revealed');
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.15 });
  els.forEach(el => obs.observe(el));
};

// ── Active nav link ──
window.setActiveNavLink = function() {
  const path = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a, .nav-mobile a').forEach(a => {
    const href = a.getAttribute('href');
    if (href === path || (path === '' && href === 'index.html')) {
      a.classList.add('active');
    }
  });
};

// Run on every page
document.addEventListener('DOMContentLoaded', () => {
  window.setActiveNavLink();
  window.initScrollReveal();

  // Add CSS for scroll reveal animations
  const style = document.createElement('style');
  style.textContent = `
    [data-reveal] { opacity: 0; transform: translateY(24px); transition: opacity 0.6s ease, transform 0.6s ease; }
    [data-reveal].revealed { opacity: 1; transform: none; }
    [data-reveal][data-delay="1"] { transition-delay: 0.1s; }
    [data-reveal][data-delay="2"] { transition-delay: 0.2s; }
    [data-reveal][data-delay="3"] { transition-delay: 0.3s; }
    [data-reveal][data-delay="4"] { transition-delay: 0.4s; }
  `;
  document.head.appendChild(style);
});
