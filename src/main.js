import './styles.css';
import './privacy-consent.js';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { featuredProjects, projects } from './data/projects.js';
import { studies } from './data/studies.js';

gsap.registerPlugin(ScrollTrigger);
document.documentElement.classList.add('js');

const asset = (filename) => `${import.meta.env.BASE_URL}assets/${filename}`;
const twoDigits = (value) => String(value).padStart(2, '0');

function renderFeaturedProjects() {
  const root = document.querySelector('#featured-panels');
  root.innerHTML = featuredProjects.map((project, index) => `
    <article class="feature-card${index === 0 ? ' is-active' : ''}" data-feature-card="${index}" aria-hidden="${index === 0 ? 'false' : 'true'}">
      <img class="feature-card__image" src="${asset(project.image)}" alt="Captura do projeto ${project.title}" loading="lazy" />
      <p class="feature-card__meta">Projeto em destaque · ${twoDigits(index + 1)} / ${twoDigits(featuredProjects.length)}</p>
      <h3>${project.title}</h3>
      <p class="feature-card__summary">${project.summary}</p>
      <p class="feature-card__stack">${project.stack}</p>
      <div class="feature-card__actions">
        <button class="button button--primary" type="button" data-open-project="${project.id}">Ver detalhes <span aria-hidden="true">↗</span></button>
        <a class="text-link" href="${project.link}" target="_blank" rel="noopener noreferrer">Visitar projeto <span aria-hidden="true">↗</span></a>
      </div>
    </article>
  `).join('');
  document.querySelector('#featured-total').textContent = twoDigits(featuredProjects.length);
}

function renderProjectList() {
  const root = document.querySelector('#project-list');
  root.innerHTML = projects.map((project, index) => `
    <li>
      <article class="project-row" data-project-row="${project.id}">
        <span class="project-row__number">${twoDigits(index + 1)}</span>
        <div class="project-row__title">
          <h3>${project.title}</h3>
          <p>${project.summary}</p>
        </div>
        <p class="project-row__stack">${project.stack}</p>
        <button class="project-row__action" type="button" data-open-project="${project.id}">Ver detalhes <span aria-hidden="true">↗</span></button>
        <a class="project-row__visit" href="${project.link}" target="_blank" rel="noopener noreferrer" aria-label="Visitar o projeto ${project.title}">↗</a>
        <img class="project-row__preview" src="${asset(project.image)}" alt="" aria-hidden="true" loading="lazy" />
      </article>
    </li>
  `).join('');
  document.querySelector('#project-count').textContent = twoDigits(projects.length);
}

function renderStudies() {
  const root = document.querySelector('#study-list');
  root.innerHTML = studies.map((study, index) => `
    <article class="study-item" data-reveal>
      <span class="study-item__number">${twoDigits(index + 1)}</span>
      <div>
        <h3>${study.title}</h3>
        <span class="study-item__meta">${study.level}</span>
      </div>
      <p>${study.description}</p>
      <a class="study-item__link" href="${study.link}" target="_blank" rel="noopener noreferrer">Ver material <span aria-hidden="true">↗</span></a>
    </article>
  `).join('');
}

renderFeaturedProjects();
renderProjectList();
renderStudies();

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
if (prefersReducedMotion.matches) document.documentElement.classList.add('static-motion');

function setupReveal() {
  const revealItems = document.querySelectorAll('[data-reveal]');
  if (prefersReducedMotion.matches || !('IntersectionObserver' in window)) {
    revealItems.forEach((item) => item.classList.add('is-visible'));
    return;
  }
  const observer = new IntersectionObserver((entries, currentObserver) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      currentObserver.unobserve(entry.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -4% 0px' });
  revealItems.forEach((item, index) => {
    item.style.transitionDelay = `${Math.min(index % 4, 3) * 65}ms`;
    observer.observe(item);
  });
}

setupReveal();

function setupNavigation() {
  const header = document.querySelector('#site-header');
  const nav = document.querySelector('#primary-nav');
  const toggle = document.querySelector('.nav-toggle');
  let previousY = window.scrollY;
  let scrollQueued = false;

  toggle.addEventListener('click', () => {
    const isOpen = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!isOpen));
    toggle.setAttribute('aria-label', isOpen ? 'Abrir menu' : 'Fechar menu');
    nav.classList.toggle('is-open', !isOpen);
    header.dataset.visible = 'true';
  });

  nav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      nav.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'Abrir menu');
    });
  });

  function updateHeader() {
    const currentY = window.scrollY;
    const direction = currentY - previousY;
    const menuOpen = toggle.getAttribute('aria-expanded') === 'true';
    if (currentY < window.innerHeight * 0.35 || menuOpen) {
      header.dataset.visible = 'true';
      header.dataset.veil = 'false';
    } else if (direction > 2) {
      header.dataset.visible = 'false';
    } else if (direction < -2) {
      header.dataset.visible = 'true';
      header.dataset.veil = 'true';
    }
    previousY = currentY;
    scrollQueued = false;
  }

  window.addEventListener('scroll', () => {
    if (scrollQueued) return;
    scrollQueued = true;
    requestAnimationFrame(updateHeader);
  }, { passive: true });
}

setupNavigation();

function setupScrollProgress() {
  const progress = document.querySelector('.scroll-progress span');
  let queued = false;
  const update = () => {
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.transform = `scaleX(${maxScroll > 0 ? window.scrollY / maxScroll : 0})`;
    queued = false;
  };
  window.addEventListener('scroll', () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(update);
  }, { passive: true });
  window.addEventListener('resize', update, { passive: true });
  update();
}

setupScrollProgress();

function setActiveFeature(index, progress) {
  document.querySelectorAll('[data-feature-card]').forEach((card, cardIndex) => {
    const isActive = cardIndex === index;
    card.classList.toggle('is-active', isActive);
    card.setAttribute('aria-hidden', String(!isActive));
  });
  document.querySelector('#featured-current').textContent = twoDigits(index + 1);
  document.querySelector('#featured-progress').style.transform = `scaleX(${progress})`;
}

const featureStage = document.querySelector('.featured-stage');
const featureCanvas = document.querySelector('.featured-stage__canvas');
const mediaMotion = gsap.matchMedia();
const desktopSceneMedia = window.matchMedia('(min-width: 901px) and (prefers-reduced-motion: no-preference)');

function exposeStaticFeatures() {
  document.querySelectorAll('[data-feature-card]').forEach((card) => card.setAttribute('aria-hidden', 'false'));
}

if (!desktopSceneMedia.matches) exposeStaticFeatures();
desktopSceneMedia.addEventListener('change', (event) => {
  if (!event.matches) exposeStaticFeatures();
});

mediaMotion.add('(min-width: 901px) and (prefers-reduced-motion: no-preference)', () => {
  let scene = null;
  let disposed = false;
  let trigger = null;
  let observer = null;

  const activateScene = async () => {
    try {
      const { createProjectScene } = await import('./scene.js');
      if (disposed) return;
      scene = createProjectScene(featureCanvas, projects, featuredProjects, asset);
      if (!scene) {
        document.documentElement.classList.add('no-webgl');
        exposeStaticFeatures();
        trigger?.kill();
        trigger = null;
        return;
      }
      featureStage.classList.add('scene-ready');
      scene.setProgress(trigger?.progress || 0);
    } catch (error) {
      console.warn('Não foi possível iniciar a galeria 3D; exibindo a versão estática.', error);
      document.documentElement.classList.add('no-webgl');
      exposeStaticFeatures();
      trigger?.kill();
      trigger = null;
    }
  };

  trigger = ScrollTrigger.create({
    trigger: featureStage,
    start: 'top top',
    end: () => `+=${window.innerHeight * 3.7}`,
    pin: true,
    scrub: 0.7,
    invalidateOnRefresh: true,
    onUpdate(self) {
      const activeIndex = Math.round(self.progress * (featuredProjects.length - 1));
      scene?.setProgress(self.progress);
      setActiveFeature(activeIndex, self.progress);
    },
  });

  observer = new IntersectionObserver((entries) => {
    if (!entries.some((entry) => entry.isIntersecting)) return;
    observer.disconnect();
    activateScene();
  }, { rootMargin: '520px 0px' });
  observer.observe(featureStage);

  return () => {
    disposed = true;
    observer?.disconnect();
    trigger?.kill();
    scene?.dispose();
    featureStage.classList.remove('scene-ready');
  };
});

const projectDialog = document.querySelector('#project-dialog');
const projectMap = new Map(projects.map((project) => [project.id, project]));
document.addEventListener('click', (event) => {
  const openButton = event.target.closest('[data-open-project]');
  if (!openButton) return;
  const project = projectMap.get(openButton.dataset.openProject);
  if (!project) return;
  document.querySelector('#dialog-title').textContent = project.title;
  document.querySelector('#dialog-stack').textContent = project.stack;
  document.querySelector('#dialog-description').textContent = project.description;
  const link = document.querySelector('#dialog-link');
  link.href = project.link;
  projectDialog.showModal();
});

document.querySelectorAll('.project-row').forEach((row) => {
  const preview = row.querySelector('.project-row__preview');
  row.addEventListener('pointermove', (event) => {
    if (event.pointerType !== 'mouse') return;
    const padding = 170;
    const x = Math.min(window.innerWidth - padding, Math.max(padding, event.clientX + 24));
    const y = Math.min(window.innerHeight - 100, Math.max(100, event.clientY + 16));
    preview.style.left = `${x}px`;
    preview.style.top = `${y}px`;
  });
});

function buildContactUrl(channel, name, message) {
  const body = `Olá, Hugo! Meu nome é ${name}.\n\n${message}`;
  if (channel === 'whatsapp') {
    return `https://wa.me/5514988365367?text=${encodeURIComponent(body)}`;
  }
  const subject = `Contato pelo portfólio — ${name}`;
  return `mailto:ohugodev@outlook.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

const contactForm = document.querySelector('#contact-form');
const contactStatus = document.querySelector('#contact-status');
const sendButton = contactForm.querySelector('[type="submit"]');
const channelInputs = [...contactForm.querySelectorAll('input[name="channel"]')];

function updateContactChannel() {
  const selected = channelInputs.find((input) => input.checked)?.value || 'whatsapp';
  sendButton.innerHTML = `Enviar ${selected === 'whatsapp' ? 'pelo WhatsApp' : 'por e-mail'} <span aria-hidden="true">↗</span>`;
  contactStatus.textContent = selected === 'whatsapp'
    ? 'A mensagem será preenchida no WhatsApp para você revisar e enviar.'
    : 'A mensagem será preenchida no seu aplicativo de e-mail para você revisar e enviar.';
}

channelInputs.forEach((input) => input.addEventListener('change', updateContactChannel));
updateContactChannel();

contactForm.addEventListener('submit', (event) => {
  event.preventDefault();
  if (!contactForm.reportValidity()) return;
  const nameInput = contactForm.elements.name;
  const messageInput = contactForm.elements.message;
  const name = nameInput.value.trim();
  const message = messageInput.value.trim();
  const channel = contactForm.elements.channel.value;
  nameInput.setCustomValidity(name ? '' : 'Informe seu nome.');
  messageInput.setCustomValidity(message ? '' : 'Escreva uma mensagem.');
  if (!name || !message) {
    contactForm.reportValidity();
    nameInput.setCustomValidity('');
    messageInput.setCustomValidity('');
    return;
  }
  const url = buildContactUrl(channel, name, message);
  window.open(url, '_blank', 'noopener,noreferrer');
  contactStatus.textContent = channel === 'whatsapp'
    ? 'WhatsApp aberto com a mensagem pronta. Confira e toque em Enviar na conversa.'
    : 'Seu aplicativo de e-mail foi aberto com a mensagem pronta. Confira e toque em Enviar.';
});

if (document.fonts?.ready) {
  document.fonts.ready.then(() => ScrollTrigger.refresh());
}
document.addEventListener('privacy:fonts-loaded', () => ScrollTrigger.refresh());
window.addEventListener('load', () => ScrollTrigger.refresh(), { once: true });
