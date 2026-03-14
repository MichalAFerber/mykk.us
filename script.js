document.addEventListener('DOMContentLoaded', () => {
  // Mobile menu toggle
  const navToggle = document.querySelector('.nav-toggle');
  const mobileMenu = document.querySelector('.mobile-menu');

  if (navToggle && mobileMenu) {
    navToggle.addEventListener('click', () => {
      mobileMenu.classList.toggle('active');
      navToggle.classList.toggle('active');
    });

    mobileMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        mobileMenu.classList.remove('active');
        navToggle.classList.remove('active');
      });
    });
  }

  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const href = anchor.getAttribute('href');
      if (href === '#') return;

      e.preventDefault();
      const target = document.querySelector(href);
      if (target) {
        const navHeight = document.querySelector('.nav').offsetHeight;
        window.scrollTo({
          top: target.offsetTop - navHeight - 20,
          behavior: 'smooth'
        });
      }
    });
  });

  // Nav background on scroll
  const nav = document.querySelector('.nav');
  window.addEventListener('scroll', () => {
    if (window.pageYOffset > 50) {
      nav.style.background = 'rgba(10, 10, 15, 0.98)';
    } else {
      nav.style.background = 'rgba(10, 10, 15, 0.9)';
    }
  });

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
