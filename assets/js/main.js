/**
 * Nhumba Services — Main JavaScript
 * Form validation, navbar, smooth scroll, counters, AOS
 */

'use strict';

/* ============================================================
   NAVBAR — sticky + scroll class
   ============================================================ */
const initNavbar = () => {
  const nav = document.getElementById('mainNav');
  if (!nav) return;

  const onScroll = () => {
    nav.classList.toggle('scrolled', window.scrollY > 50);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Active link highlighting
  const navLinks = nav.querySelectorAll('.nav-link');
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  navLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPage || (currentPage === '' && href === 'index.html')) {
      link.classList.add('active');
    }
  });

  // Collapse mobile menu on link click
  const navbarCollapse = document.getElementById('navbarNav');
  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      if (navbarCollapse && navbarCollapse.classList.contains('show')) {
        const toggler = nav.querySelector('.navbar-toggler');
        if (toggler) toggler.click();
      }
    });
  });
};

/* ============================================================
   SMOOTH SCROLL — anchor links
   ============================================================ */
const initSmoothScroll = () => {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', e => {
      const target = document.querySelector(anchor.getAttribute('href'));
      if (target) {
        e.preventDefault();
        const offset = 80;
        const top = target.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });
};

/* ============================================================
   COUNTER ANIMATION
   ============================================================ */
const animateCounter = (el, target, duration = 2000) => {
  const start = performance.now();
  const update = (now) => {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
    el.textContent = Math.round(eased * target).toLocaleString();
    if (progress < 1) requestAnimationFrame(update);
    else el.textContent = target.toLocaleString() + (el.dataset.suffix || '');
  };
  requestAnimationFrame(update);
};

const initCounters = () => {
  const counters = document.querySelectorAll('[data-counter]');
  if (!counters.length) return;

  const obs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !entry.target.dataset.counted) {
        entry.target.dataset.counted = 'true';
        const target = parseInt(entry.target.dataset.counter, 10);
        animateCounter(entry.target, target);
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  counters.forEach(el => obs.observe(el));
};

/* ============================================================
   FORM VALIDATION — contact / hero forms
   ============================================================ */
const validators = {
  required: (val) => val.trim() !== '',
  email: (val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val),
  phone: (val) => /^[\d\s\+\-\(\)]{7,20}$/.test(val),
  minLen: (val, len) => val.trim().length >= len
};

const showError = (field, msg) => {
  field.classList.add('is-invalid');
  let fb = field.nextElementSibling;
  if (!fb || !fb.classList.contains('invalid-feedback')) {
    fb = document.createElement('div');
    fb.className = 'invalid-feedback';
    field.parentNode.insertBefore(fb, field.nextSibling);
  }
  fb.textContent = msg;
};

const clearError = (field) => {
  field.classList.remove('is-invalid');
  field.classList.add('is-valid');
};

const validateField = (field) => {
  const val = field.value;
  const type = field.dataset.validate;

  if (!type) return true;

  if (type.includes('required') && !validators.required(val)) {
    showError(field, 'Este campo é obrigatório.');
    return false;
  }
  if (type.includes('email') && !validators.email(val)) {
    showError(field, 'Por favor insira um e-mail válido.');
    return false;
  }
  if (type.includes('phone') && val && !validators.phone(val)) {
    showError(field, 'Por favor insira um número de telefone válido.');
    return false;
  }
  if (type.includes('min5') && !validators.minLen(val, 5)) {
    showError(field, 'Por favor insira pelo menos 5 caracteres.');
    return false;
  }
  if (type.includes('min10') && !validators.minLen(val, 10)) {
    showError(field, 'Por favor insira pelo menos 10 caracteres.');
    return false;
  }

  clearError(field);
  return true;
};

const initForms = () => {
  document.querySelectorAll('form[data-validate-form]').forEach(form => {
    const fields = form.querySelectorAll('[data-validate]');

    // Real-time validation
    fields.forEach(field => {
      field.addEventListener('blur', () => validateField(field));
      field.addEventListener('input', () => {
        if (field.classList.contains('is-invalid')) validateField(field);
      });
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      // Validate all fields
      let valid = true;
      fields.forEach(field => {
        if (!validateField(field)) valid = false;
      });

      if (!valid) return;

      // Show loading
      const btn = form.querySelector('[type="submit"]');
      const btnText = btn.querySelector('.btn-text');
      const spinner = btn.querySelector('.spinner-btn');
      if (btnText) btnText.style.display = 'none';
      if (spinner) spinner.style.display = 'block';
      btn.disabled = true;

      // If using Netlify (form has netlify attr) or Formspree action
      const action = form.getAttribute('action');
      const isNetlify = form.hasAttribute('data-netlify') || form.hasAttribute('netlify');

      try {
        if (action && !isNetlify) {
          // Formspree or custom endpoint
          const data = new FormData(form);
          await fetch(action, {
            method: 'POST',
            body: data,
            headers: { 'Accept': 'application/json' }
          });
        }
        // Show success
        setTimeout(() => {
          const successEl = form.parentElement.querySelector('.form-success');
          if (successEl) {
            form.style.display = 'none';
            successEl.style.display = 'block';
            successEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
          } else {
            showToast('Mensagem enviada com sucesso! Entraremos em contacto em breve.', 'success');
            form.reset();
            fields.forEach(f => { f.classList.remove('is-valid', 'is-invalid'); });
          }
          btn.disabled = false;
          if (btnText) btnText.style.display = '';
          if (spinner) spinner.style.display = 'none';
        }, 1200);
      } catch {
        showToast('Ocorreu um erro. Por favor tente novamente.', 'error');
        btn.disabled = false;
        if (btnText) btnText.style.display = '';
        if (spinner) spinner.style.display = 'none';
      }
    });
  });
};

/* ============================================================
   TOAST NOTIFICATIONS
   ============================================================ */
const showToast = (msg, type = 'info') => {
  const colors = { success: '#28a745', error: '#dc3545', info: '#007BFF' };
  const icons  = { success: 'fa-check-circle', error: 'fa-exclamation-circle', info: 'fa-info-circle' };

  const toast = document.createElement('div');
  toast.innerHTML = `<i class="fas ${icons[type]}"></i> ${msg}`;
  Object.assign(toast.style, {
    position: 'fixed', bottom: '2rem', left: '50%',
    transform: 'translateX(-50%) translateY(20px)',
    background: colors[type], color: '#fff',
    padding: '.85rem 2rem', borderRadius: '30px',
    fontSize: '.95rem', fontWeight: '600',
    boxShadow: '0 8px 25px rgba(0,0,0,.25)',
    zIndex: '99999', opacity: '0',
    transition: 'all .4s ease',
    display: 'flex', alignItems: 'center', gap: '.5rem',
    whiteSpace: 'nowrap', maxWidth: '90vw'
  });
  document.body.appendChild(toast);
  requestAnimationFrame(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateX(-50%) translateY(0)';
  });
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(-50%) translateY(20px)';
    setTimeout(() => toast.remove(), 400);
  }, 4000);
};

/* ============================================================
   VISA FILTER (services page)
   ============================================================ */
const initVisaFilter = () => {
  const btns = document.querySelectorAll('[data-filter]');
  const cards = document.querySelectorAll('[data-category]');
  if (!btns.length || !cards.length) return;

  btns.forEach(btn => {
    btn.addEventListener('click', () => {
      btns.forEach(b => b.classList.remove('active', 'btn-primary-custom'));
      btns.forEach(b => b.classList.add('btn-outline-custom'));
      btn.classList.add('active', 'btn-primary-custom');
      btn.classList.remove('btn-outline-custom');

      const filter = btn.dataset.filter;
      cards.forEach(card => {
        const show = filter === 'all' || card.dataset.category === filter;
        card.style.transition = 'opacity .3s ease, transform .3s ease';
        if (show) {
          card.style.opacity = '1'; card.style.transform = 'scale(1)';
          card.style.display = '';
        } else {
          card.style.opacity = '0'; card.style.transform = 'scale(.95)';
          setTimeout(() => { if (!show) card.style.display = 'none'; }, 300);
        }
      });
    });
  });
};

/* ============================================================
   HERO SCROLL INDICATOR (hide on scroll)
   ============================================================ */
const initScrollIndicator = () => {
  const ind = document.querySelector('.scroll-indicator');
  if (!ind) return;
  window.addEventListener('scroll', () => {
    ind.style.opacity = window.scrollY > 100 ? '0' : '1';
  }, { passive: true });
};

/* ============================================================
   LAZY IMAGES
   ============================================================ */
const initLazyImages = () => {
  if (!('IntersectionObserver' in window)) return;
  const imgs = document.querySelectorAll('img[data-src]');
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(({ isIntersecting, target }) => {
      if (isIntersecting) {
        target.src = target.dataset.src;
        target.removeAttribute('data-src');
        obs.unobserve(target);
      }
    });
  }, { rootMargin: '200px' });
  imgs.forEach(img => obs.observe(img));
};

/* ============================================================
   BACK TO TOP
   ============================================================ */
const initBackToTop = () => {
  const btn = document.getElementById('backToTop');
  if (!btn) return;
  window.addEventListener('scroll', () => {
    btn.style.opacity = window.scrollY > 500 ? '1' : '0';
    btn.style.pointerEvents = window.scrollY > 500 ? 'auto' : 'none';
  }, { passive: true });
  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
};

/* ============================================================
   FAQ ACCORDION (blog/services)
   ============================================================ */
const initFAQ = () => {
  document.querySelectorAll('.faq-question').forEach(q => {
    q.addEventListener('click', () => {
      const item = q.closest('.faq-item');
      const answer = item.querySelector('.faq-answer');
      const isOpen = item.classList.contains('open');

      // Close all
      document.querySelectorAll('.faq-item.open').forEach(openItem => {
        openItem.classList.remove('open');
        openItem.querySelector('.faq-answer').style.maxHeight = null;
        openItem.querySelector('.faq-icon').style.transform = '';
      });

      if (!isOpen) {
        item.classList.add('open');
        answer.style.maxHeight = answer.scrollHeight + 'px';
        q.querySelector('.faq-icon').style.transform = 'rotate(45deg)';
      }
    });
  });
};

/* ============================================================
   WHATSAPP NUMBERS — dynamic link builder
   ============================================================ */
const WHATSAPP_NUMBERS = {
  guinea: '245955360314',
  portugal: '351932751354'
};

const initWhatsApp = () => {
  const defaultMsg = encodeURIComponent('Olá! Gostaria de informações sobre agendamento de visto para Portugal.');
  document.querySelectorAll('[data-whatsapp]').forEach(el => {
    const num = el.dataset.whatsapp === 'pt'
      ? WHATSAPP_NUMBERS.portugal
      : WHATSAPP_NUMBERS.guinea;
    el.href = `https://wa.me/${num}?text=${defaultMsg}`;
  });
};

/* ============================================================
   INIT ALL
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initSmoothScroll();
  initCounters();
  initForms();
  initVisaFilter();
  initScrollIndicator();
  initLazyImages();
  initBackToTop();
  initFAQ();
  initWhatsApp();

  // AOS init (if loaded)
  if (typeof AOS !== 'undefined') {
    AOS.init({
      duration: 700,
      easing: 'ease-out-cubic',
      once: true,
      offset: 80
    });
  }
});
