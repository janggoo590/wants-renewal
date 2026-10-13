/* =========================================================
   WANTS Renewal - Scroll Interaction
   - Lenis : 관성 스무스 스크롤
   - GSAP ScrollTrigger : 섹션 고정(Pin), 스크롤 연동 모션
   - CDN 로드 실패 / 모션 최소화 설정 시 main.js 의 기본 reveal 로 동작
   ========================================================= */
(function () {
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion || !window.gsap || !window.ScrollTrigger) return;

  gsap.registerPlugin(ScrollTrigger);
  document.documentElement.classList.add('gsap-on');

  /* ---------- 1. Smooth Scroll (Lenis) ---------- */
  if (window.Lenis) {
    var lenis = new Lenis({ duration: 1.2, easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); } });
    window.lenis = lenis;
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
    gsap.ticker.lagSmoothing(0);
  }

  /* ---------- 2. Scroll Progress Bar ---------- */
  var progress = document.createElement('div');
  progress.className = 'scroll-progress';
  document.body.appendChild(progress);
  gsap.to(progress, {
    scaleX: 1, ease: 'none',
    scrollTrigger: { start: 0, end: 'max', scrub: 0.3 }
  });

  /* ---------- 3. 섹션 타이틀 : 줄 단위 마스크 리빌 ---------- */
  document.querySelectorAll('.sec-title').forEach(function (title) {
    if (title.closest('.main-about')) return; // 섹션 2 는 타이핑 효과 (아래 3-1)
    title.classList.remove('reveal', 'd1', 'd2', 'd3');
    title.innerHTML = title.innerHTML
      .split(/<br\s*\/?>/i)
      .map(function (line) { return '<span class="line"><span class="line-inner">' + line.trim() + '</span></span>'; })
      .join('');
    gsap.from(title.querySelectorAll('.line-inner'), {
      yPercent: 110, duration: 1.1, ease: 'power4.out', stagger: 0.12,
      scrollTrigger: { trigger: title, start: 'top 85%' }
    });
  });

  /* ---------- 3-1. 섹션 2 타이틀 : 타이핑 효과 ---------- */
  var typeTitle = document.querySelector('.main-about .sec-title');
  if (typeTitle) {
    typeTitle.classList.remove('reveal', 'd1', 'd2', 'd3');
    typeTitle.setAttribute('aria-label', typeTitle.innerHTML.replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim());

    // 글자 단위로 감싸기 (색상 span, 줄바꿈 br 유지)
    var chars = [];
    var afterBreak = false;
    (function wrap(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (child) {
        if (child.nodeType === 3) {
          var frag = document.createDocumentFragment();
          Array.from(child.textContent).forEach(function (ch) {
            var s = document.createElement('span');
            s.className = 'char';
            s.setAttribute('aria-hidden', 'true');
            s.textContent = ch;
            if (afterBreak) { s.dataset.pause = '1'; afterBreak = false; }
            frag.appendChild(s);
            chars.push(s);
          });
          child.parentNode.replaceChild(frag, child);
        } else if (child.nodeName === 'BR') {
          afterBreak = true;
        } else if (child.nodeType === 1) {
          wrap(child);
        }
      });
    })(typeTitle);

    var caret = document.createElement('span');
    caret.className = 'type-caret';
    caret.setAttribute('aria-hidden', 'true');
    chars[0].parentNode.insertBefore(caret, chars[0]);

    var typeNext = function (i) {
      if (i >= chars.length) {
        setTimeout(function () { caret.classList.add('done'); }, 2000); // 완료 후 2초 깜빡이다 사라짐
        return;
      }
      var c = chars[i];
      var delay = c.textContent === ' ' ? 40 : 70 + Math.random() * 50;
      if (c.dataset.pause) delay += 250; // 줄바꿈에서 잠깐 멈춤
      setTimeout(function () {
        c.classList.add('on');
        c.parentNode.insertBefore(caret, c.nextSibling);
        typeNext(i + 1);
      }, delay);
    };

    ScrollTrigger.create({
      trigger: typeTitle, start: 'top 80%', once: true,
      onEnter: function () { typeNext(0); }
    });
  }

  /* ---------- 4. 공통 Fade-up (기존 .reveal 대체) ---------- */
  var revealEls = gsap.utils.toArray('.reveal').filter(function (el) { return !el.closest('.main-hero'); });
  revealEls.forEach(function (el) { el.classList.remove('reveal'); });
  gsap.set(revealEls, { autoAlpha: 0, y: 60 });
  ScrollTrigger.batch(revealEls, {
    start: 'top 88%',
    once: true,
    onEnter: function (batch) {
      gsap.to(batch, { autoAlpha: 1, y: 0, duration: 1.1, ease: 'power3.out', stagger: 0.12, overwrite: true });
    }
  });

  var mm = gsap.matchMedia();

  /* ---------- 5. 섹션 1 → 2, 섹션 2 → 3 : 고정(Pin) + 다음 섹션이 위로 덮으며 어두워지는 전환 ---------- */
  var stackOver = function (section) {
    // 화면보다 긴 섹션은 하단이 화면 하단에 닿을 때 고정 (내용이 잘리지 않도록)
    var start = function () { return section.offsetHeight > window.innerHeight ? 'bottom bottom' : 'top top'; };
    var end = function () { return '+=' + Math.min(section.offsetHeight, window.innerHeight); };
    ScrollTrigger.create({ trigger: section, start: start, end: end, pin: true, pinSpacing: false, invalidateOnRefresh: true });
    // 다음 섹션이 올라오는 동안 점점 어두워짐 (0 → 0.9) + 텍스트 페이드아웃
    gsap.timeline({
      scrollTrigger: { trigger: section, start: start, end: end, scrub: 0.5, invalidateOnRefresh: true }
    })
      .to(section, { '--dim': 0.9, ease: 'power1.in', duration: 1 }, 0)
      .to(section.querySelector('.inner'), { autoAlpha: 0, ease: 'none', duration: 0.6 }, 0);
  };
  ['.main-hero', '.main-about'].forEach(function (sel) {
    var section = document.querySelector(sel);
    if (section) stackOver(section);
  });

  /* ---------- 6. 섹션 2 : 임시 비주얼 패럴랙스 ---------- */
  var aboutVisual = document.querySelector('.main-about .about-visual');
  if (aboutVisual) {
    gsap.fromTo(aboutVisual, { y: 120, rotate: -8 }, {
      y: -120, rotate: 8, ease: 'none',
      scrollTrigger: { trigger: '.main-about', start: 'top bottom', end: 'bottom top', scrub: true }
    });
  }

  /* ---------- 7. 섹션 3 : 배경 이미지 제자리 페이드인 + 서비스 카드 순차 등장 ---------- */
  var serviceSection = document.querySelector('.main-service');
  if (serviceSection) {
    gsap.fromTo(serviceSection, { '--bg-op': 0 }, {
      '--bg-op': 1, duration: 1.8, ease: 'power2.inOut',
      scrollTrigger: { trigger: serviceSection, start: 'top 70%', toggleActions: 'play none none reverse' }
    });
  }
  var serviceCards = gsap.utils.toArray('.service-list li');
  if (serviceCards.length) {
    gsap.from(serviceCards, {
      y: 80, scale: 0.92, autoAlpha: 0, duration: 1, ease: 'power3.out', stagger: 0.08,
      scrollTrigger: { trigger: '.service-list', start: 'top 85%' }
    });
  }
  var serviceVisual = document.querySelector('.main-service .service-visual');
  if (serviceVisual) {
    gsap.fromTo(serviceVisual, { y: 150, scale: 0.85 }, {
      y: -100, scale: 1.05, ease: 'none',
      scrollTrigger: { trigger: '.main-service', start: 'top bottom', end: 'bottom top', scrub: true }
    });
  }

  /* ---------- 8. 섹션 4 : 포트폴리오 고정 + 가로 스크롤 (PC) ---------- */
  var pfSection = document.querySelector('.main-portfolio');
  var pfViewport = document.querySelector('.pf-viewport');
  if (pfSection && pfViewport) {
    mm.add('(min-width: 1025px)', function () {
      pfSection.classList.add('is-scrub');
      var distance = function () { return pfViewport.scrollWidth - pfViewport.clientWidth; };
      var pfTween = gsap.to(pfViewport, {
        scrollLeft: distance, ease: 'none',
        scrollTrigger: {
          trigger: pfSection, start: 'center center',
          end: function () { return '+=' + distance() * 1.5; },
          pin: true, scrub: 0.8, invalidateOnRefresh: true
        }
      });
      // 드래그 시 스크롤 위치와 동기화하기 위해 main.js 에 전달
      pfViewport._pfScrub = { st: pfTween.scrollTrigger, distance: distance };
      return function () { pfSection.classList.remove('is-scrub'); pfViewport.scrollLeft = 0; delete pfViewport._pfScrub; };
    });
  }

  /* ---------- 9. 섹션 5 : 인스타 그리드 / 블로그 카드 ---------- */
  var instaItems = gsap.utils.toArray('.insta-grid li');
  if (instaItems.length) {
    gsap.from(instaItems, {
      scale: 0.8, autoAlpha: 0, duration: 0.9, ease: 'back.out(1.6)', stagger: { each: 0.08, from: 'random' },
      scrollTrigger: { trigger: '.insta-grid', start: 'top 85%' }
    });
  }
  var blogItems = gsap.utils.toArray('.blog-list li');
  if (blogItems.length) {
    gsap.from(blogItems, {
      x: 60, autoAlpha: 0, duration: 1, ease: 'power3.out', stagger: 0.12,
      scrollTrigger: { trigger: '.blog-list', start: 'top 85%' }
    });
  }

  /* ---------- 10. CTA : 화면 가득 펼쳐지는 전환 ---------- */
  gsap.utils.toArray('.main-cta').forEach(function (cta) {
    gsap.fromTo(cta, { clipPath: 'inset(0% 8% 0% 8% round 40px)' }, {
      clipPath: 'inset(0% 0% 0% 0% round 0px)', ease: 'none',
      scrollTrigger: { trigger: cta, start: 'top bottom', end: 'top 30%', scrub: true }
    });
  });

  /* ---------- 11. 서브 비주얼 : 타이틀 패럴랙스 ---------- */
  var subVisual = document.querySelector('.sub-visual');
  if (subVisual) {
    gsap.to(subVisual.children, {
      y: 80, autoAlpha: 0, ease: 'none',
      scrollTrigger: { trigger: subVisual, start: 'top top', end: 'bottom top', scrub: true }
    });
  }

  /* ---------- 12. 커스텀 커서 (마우스 사용 환경만) ---------- */
  mm.add('(hover: hover) and (pointer: fine)', function () {
    var cursor = document.createElement('div');
    cursor.className = 'cursor';
    document.body.appendChild(cursor);
    document.documentElement.classList.add('has-cursor');

    var xTo = gsap.quickTo(cursor, 'x', { duration: 0.35, ease: 'power3' });
    var yTo = gsap.quickTo(cursor, 'y', { duration: 0.35, ease: 'power3' });
    var onMove = function (e) { xTo(e.clientX); yTo(e.clientY); cursor.classList.add('show'); };
    var onOver = function (e) { cursor.classList.toggle('hover', !!e.target.closest('a, button, label, input, select, textarea')); };
    var onLeave = function () { cursor.classList.remove('show'); };

    window.addEventListener('mousemove', onMove);
    document.addEventListener('mouseover', onOver);
    document.addEventListener('mouseleave', onLeave);

    return function () {
      window.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseover', onOver);
      document.removeEventListener('mouseleave', onLeave);
      cursor.remove();
      document.documentElement.classList.remove('has-cursor');
    };
  });

  /* 이미지 / 웹폰트 로드 후 위치 재계산 */
  window.addEventListener('load', function () { ScrollTrigger.refresh(); });
})();
