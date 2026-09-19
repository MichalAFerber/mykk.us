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

  // Checkout email modal (owner ruling 2026-09-18): collect the email that
  // the license will be tied to, then navigate to the checkout-redirect
  // endpoint with it attached. Pure helpers live in checkout-email.js.
  const overlay = document.getElementById('checkout-email-modal');
  if (overlay) {
    const { isValidEmail, buildCheckoutUrl } = window.MykkCheckoutEmail;

    const input = document.getElementById('checkout-email-input');
    const errorEl = document.getElementById('checkout-email-error');
    const cancelBtn = document.getElementById('checkout-email-cancel');
    const continueBtn = document.getElementById('checkout-email-continue');
    const setError = (message) => { errorEl.textContent = message; };
    const close = () => {
      overlay.classList.remove('visible');
      setError('');
    };
    const open = () => {
      input.value = '';
      setError('');
      overlay.classList.add('visible');
      input.focus();
    };
    const submit = () => {
      const raw = input.value;
      if (!isValidEmail(raw)) {
        setError('Enter a valid email address.');
        return;
      }
      window.location.href = buildCheckoutUrl(raw);
    };

    document.querySelectorAll('[data-checkout-trigger]').forEach((el) => {
      el.addEventListener('click', open);
    });
    continueBtn.addEventListener('click', submit);
    cancelBtn.addEventListener('click', close);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) close();
    });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        submit();
      }
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && overlay.classList.contains('visible')) close();
    });
  }
});
