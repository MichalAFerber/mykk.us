// Header/menu/theme behavior lives in the family nav's inline script (per
// @wizard/ui Nav.astro); anchor scrolling is native CSS scroll-behavior.
document.addEventListener('DOMContentLoaded', () => {
  // FAQ accordion
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(item => {
    item.addEventListener('toggle', () => {
      if (item.open) {
        faqItems.forEach(other => {
          if (other !== item && other.open) other.open = false;
        });
      }
    });
  });

  // Scroll animations
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) entry.target.classList.add('visible');
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

  document.querySelectorAll('.feature-card, .step, .pricing-card, .roadmap-item, .widget-card').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    observer.observe(el);
  });

  const style = document.createElement('style');
  style.textContent = '.feature-card.visible,.step.visible,.pricing-card.visible,.roadmap-item.visible,.widget-card.visible{opacity:1!important;transform:translateY(0)!important}';
  document.head.appendChild(style);

  // Stripe Checkout
  const checkoutBtn = document.getElementById('checkout-pro');
  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', async () => {
      checkoutBtn.disabled = true;
      checkoutBtn.textContent = 'Redirecting...';

      try {
        const response = await fetch('https://api.mykk.us/api/checkout/create-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        });

        const data = await response.json();

        if (data.url) {
          window.location.href = data.url;
        } else {
          throw new Error(data.error || 'Failed to create checkout session');
        }
      } catch (error) {
        console.error('Checkout error:', error);
        checkoutBtn.disabled = false;
        checkoutBtn.textContent = 'Subscribe to Pro';
        alert('Something went wrong. Please try again or contact support@mykk.us');
      }
    });
  }
});
