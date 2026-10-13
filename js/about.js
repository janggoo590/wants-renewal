/* =========================================================
   WANTS Renewal - ABOUT 페이지 스크롤 시나리오 (about.html 전용)
   - GSAP ScrollTrigger : 섹션 고정(Pin) + 스크롤 연동(Scrub)
   - js/scroll.js (Lenis 스무스 스크롤) 다음에 로드
   - CDN 로드 실패 / 모션 최소화 설정 시 완성된 레이아웃을 그대로 보여줌
   - 타임라인의 duration 단위 = '화면 높이' (duration 1 = 화면 높이만큼 스크롤)
   ========================================================= */
(function () {
  var root = document.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion || !window.gsap || !window.ScrollTrigger) {
    root.classList.remove('ab-anim');
    return;
  }
  gsap.registerPlugin(ScrollTrigger);

  var mm = gsap.matchMedia();
  var toArr = function (list) { return Array.prototype.slice.call(list); };

  /* 스크롤 속도 : 메인 페이지(머무름 0.8화면, 카드당 약 0.3화면)와 비슷한 체감이 되도록
     요소 하나가 등장하는 데 약 0.5화면, 큰 전환(확장·이동)에 약 1화면을 사용 */
  var PACE_PC = 1;
  var PACE_MOBILE = 0.8; // 모바일은 화면이 작아 같은 비율이면 길게 느껴지므로 조금 짧게
  var pace = function () { return window.innerWidth <= 768 ? PACE_MOBILE : PACE_PC; };

  // 타임라인 길이(화면 단위)만큼 섹션을 고정하고 스크롤에 연동
  var pinScrub = function (section, tl, priority, scrub) {
    return ScrollTrigger.create({
      trigger: section, start: 'top top',
      end: function () { return '+=' + Math.round(tl.duration() * window.innerHeight * pace()); },
      animation: tl, pin: true, scrub: scrub || 1, invalidateOnRefresh: true, refreshPriority: priority
    });
  };

  /* 2줄 타이틀 : 가운데 정렬처럼 보이도록 짧은 줄을 밀어 두는 거리 (최종 상태는 왼쪽 정렬) */
  var lineWidth = function (lines) { return Math.max.apply(null, lines.map(function (l) { return l.offsetWidth; })); };
  var centerShift = function (lines) {
    return function (i) { return (lineWidth(lines) - lines[i].offsetWidth) / 2; };
  };

  /* 스크롤 연동 타이핑 : setProgress(0~1) 에 맞춰 글자 수를 1:1 로 표시 (스크롤을 멈추면 타이핑도 멈춤) */
  var createTyping = function (el) {
    el.setAttribute('aria-label', el.textContent.replace(/\s+/g, ' ').trim());
    var chars = [];
    (function wrap(node) {
      toArr(node.childNodes).forEach(function (child) {
        if (child.nodeType === 3) {
          var frag = document.createDocumentFragment();
          Array.from(child.textContent).forEach(function (ch) {
            var s = document.createElement('span');
            s.className = 'char';
            s.setAttribute('aria-hidden', 'true');
            s.textContent = ch;
            frag.appendChild(s);
            chars.push(s);
          });
          child.parentNode.replaceChild(frag, child);
        } else if (child.nodeType === 1 && child.nodeName !== 'BR') {
          wrap(child);
        }
      });
    })(el);
    // 줄 맨 앞·끝의 공백(들여쓰기 등)은 글자 수에서 제외
    chars = chars.filter(function (c, i) {
      if (/\S/.test(c.textContent)) return true;
      var prev = chars[i - 1], next = chars[i + 1];
      return prev && next && /\S/.test(prev.textContent) && /\S/.test(next.textContent);
    });

    var caret = document.createElement('span');
    caret.className = 'type-caret';
    caret.setAttribute('aria-hidden', 'true');
    var shown = -1;

    return {
      count: chars.length,
      setProgress: function (p) {
        var n = Math.round(Math.max(0, Math.min(1, p)) * chars.length);
        if (n === shown) return;
        shown = n;
        chars.forEach(function (c, i) { c.classList.toggle('on', i < n); });
        if (n === 0) {
          if (caret.parentNode) caret.parentNode.removeChild(caret); // 시작 전 : 커서 숨김
          return;
        }
        var last = chars[n - 1];
        last.parentNode.insertBefore(caret, last.nextSibling);   // 커서는 마지막으로 보인 글자 뒤
        caret.classList.toggle('done', n === chars.length);  // 완결되면 커서 사라짐
      }
    };
  };

  /* ---------- 섹션 1 : 원형 마스크 → 전체 화면 확장 → 텍스트가 스크롤마다 차례로 등장 ---------- */
  var hero = document.querySelector('.ab-hero');
  if (hero) {
    var heroBg = hero.querySelector('.ab-hero-bg');
    var heroDesc = hero.querySelector('.ab-hero-desc');
    var r0 = function () { return Math.max(110, Math.min(window.innerWidth * 0.123, window.innerHeight * 0.25)); };
    var r1 = function () { return Math.ceil(Math.sqrt(Math.pow(window.innerWidth, 2) + Math.pow(window.innerHeight, 2)) / 2) + 10; };

    var typing = createTyping(heroDesc);
    var typingProxy = { p: 0 };
    gsap.set(heroDesc, { autoAlpha: 1 }); // 글자 단위로 숨김 (.char)

    var heroTl = gsap.timeline()
      .to('.ab-scroll', { autoAlpha: 0, duration: 0.2, ease: 'none' }, 0)
      // ① 원형 마스크 확장 (1.2화면)
      .fromTo(heroBg,
        { clipPath: function () { return 'circle(' + r0() + 'px at 50% 50%)'; } },
        { clipPath: function () { return 'circle(' + r1() + 'px at 50% 50%)'; }, ease: 'power2.inOut', duration: 1.2 }, 0)
      .fromTo('.ab-hero-img', { scale: 1.25 }, { scale: 1, ease: 'power2.inOut', duration: 1.2 }, 0)
      .fromTo('.ab-hero-dim', { autoAlpha: 0 }, { autoAlpha: 1, ease: 'none', duration: 0.6 }, 0.6)
      // ② 타이틀 ← 좌측
      .fromTo('.ab-hero-title', { x: -140, autoAlpha: 0 }, { x: 0, autoAlpha: 1, ease: 'power3.out', duration: 0.5 }, 1.3)
      // ③ 메인 카피 ← 우측
      .fromTo('.ab-hero-copy', { x: 140, autoAlpha: 0 }, { x: 0, autoAlpha: 1, ease: 'power3.out', duration: 0.5 }, 1.9)
      // ④ 서브 문구 : 스크롤한 만큼 타이핑 (글자당 약 0.022화면 → 79자 약 1.7화면, 되돌리면 지워짐)
      .fromTo(typingProxy, { p: 0 }, { p: 1, ease: 'none', duration: typing.count * 0.022, onUpdate: function () { typing.setProgress(typingProxy.p); } }, 2.5)
      .to({}, { duration: 0.3 }); // 문구가 완결된 화면에서 잠깐 머문 뒤 섹션 2 로

    /* 섹션 1 → 2 전환 : 메인 페이지 섹션 1 → 2 와 같은 효과
       (섹션 1 은 고정된 채로 섹션 2 가 아래에서 올라와 덮고, 그동안 섹션 1 은 어두워지며 텍스트가 사라짐) */
    var heroAnimLen = function () { return Math.round(heroTl.duration() * window.innerHeight * pace()); }; // 섹션 1 연출 구간
    var heroNext = hero.nextElementSibling;
    var setHeroGap = function () { if (heroNext) heroNext.style.marginTop = heroAnimLen() + 'px'; }; // 연출이 끝난 뒤 섹션 2 가 올라오도록 (투명 여백)
    setHeroGap();
    ScrollTrigger.addEventListener('refreshInit', setHeroGap);

    // ① 연출 : 스크롤 진행률과 글자 수를 정확히 맞추기 위해 scrub: true (지연 없음)
    ScrollTrigger.create({
      trigger: hero, start: 0, end: heroAnimLen,
      animation: heroTl, scrub: true, invalidateOnRefresh: true, refreshPriority: 4
    });
    // ② 고정 : 연출 구간 + 섹션 2 가 화면을 다 덮을 때까지 (pinSpacing: false → 섹션 2 가 위로 겹쳐 올라옴)
    ScrollTrigger.create({
      trigger: hero, start: 0, end: function () { return heroAnimLen() + window.innerHeight; },
      pin: true, pinSpacing: false, invalidateOnRefresh: true, refreshPriority: 4
    });
    // ③ 덮이는 동안 : 0 → 0.9 어두워짐 + 텍스트 페이드아웃
    gsap.timeline({
      scrollTrigger: {
        trigger: hero, start: heroAnimLen, end: function () { return heroAnimLen() + window.innerHeight; },
        scrub: 1, invalidateOnRefresh: true, refreshPriority: 4
      }
    })
      .fromTo(hero, { '--dim': 0 }, { '--dim': 0.9, ease: 'power1.in', duration: 1 }, 0)
      .fromTo(hero.querySelector('.inner'), { autoAlpha: 1 }, { autoAlpha: 0, ease: 'none', duration: 0.6 }, 0);
  }

  /* ---------- 섹션 2 : 가운데 타이틀 → 서브 문구 순차 등장 → 좌측 박스로 축소 이동 → 우측 카드 순차 등장 (PC) ---------- */
  var pb = document.querySelector('.ab-problem');
  if (pb) {
    var pbStage = pb.querySelector('.pb-stage');
    var pbHead = pb.querySelector('.pb-head');
    var pbTitle = pb.querySelector('.pb-title');
    var pbLines = toArr(pbTitle.querySelectorAll('.ln'));
    var pbIntro = pb.querySelector('.pb-intro-sub');
    var pbCards = toArr(pb.querySelectorAll('.pb-list li'));
    var PB_SCALE = 1.55; // 처음 가운데 타이틀 크기 (박스 안 타이틀 대비)

    // 타이틀 : 스크롤 연동 타이핑 (글자 수를 스크롤 진행률에 1:1 로 맞춤, 히어로 서브문구와 동일한 방식)
    // 글자 단위 wrap은 1회만 해야 하므로 mm.add 콜백 밖(= 화면 폭이 바뀌어도 재실행되지 않는 범위)에서 실행
    var titleTyping = createTyping(pbTitle);
    var titleProxy = { p: 0 };
    var TITLE_START = 0.2;
    var titleDur = titleTyping.count * 0.03;
    var SUB_START = TITLE_START + titleDur + 0.25; // 타이핑이 끝나고 잠깐 멈춘 뒤 서브 문구 등장
    var SUB_DUR = 0.5;
    var BOX_START = SUB_START + SUB_DUR + 0.5;     // 서브 문구가 보인 채 잠깐 머문 뒤 박스로 축소 이동 (기존 2.3 위치)

    mm.add('(min-width: 1025px)', function () {
      // 박스(최종 위치)를 기준으로 '화면 가운데 큰 타이틀' 위치를 역산 (transform 영향 없는 offset 값 사용)
      // 박스에 transform 이 걸리면 타이틀의 offsetParent 가 박스로 바뀌므로 안쪽 여백은 padding 값으로 계산
      var pad = function (side) { return parseFloat(getComputedStyle(pbHead)['padding' + side]) || 0; };
      var startX = function () {
        var padL = pad('Left');
        var targetLeft = pbStage.clientWidth / 2 - lineWidth(pbLines) * PB_SCALE / 2;
        return targetLeft - pbHead.offsetLeft - padL * PB_SCALE;
      };
      var startY = function () {
        var padT = pad('Top');
        var targetTop = pbStage.clientHeight / 2 - pbTitle.offsetHeight * PB_SCALE - 10;
        return targetTop - pbHead.offsetTop - padT * PB_SCALE;
      };

      var pbTl = gsap.timeline()
        // ① 타이틀 타이핑
        .fromTo(titleProxy, { p: 0 }, { p: 1, ease: 'none', duration: titleDur, onUpdate: function () { titleTyping.setProgress(titleProxy.p); } }, TITLE_START)
        // ② 서브 문구 5줄 한번에 등장 (개별 stagger 없이 전체를 하나로 페이드인)
        .fromTo(pbIntro, { y: 26, autoAlpha: 0 }, { y: 0, autoAlpha: 1, ease: 'power2.out', duration: SUB_DUR }, SUB_START)
        // ③ 타이틀 + 문구가 좌측 박스로 축소 이동 (1.1화면)
        .fromTo(pbHead,
          { x: startX, y: startY, scale: PB_SCALE, transformOrigin: '0 0', backgroundColor: 'rgba(13, 17, 36, 0)', color: '#222' },
          { x: 0, y: 0, scale: 1, backgroundColor: 'rgba(13, 17, 36, 1)', color: '#fff', ease: 'power3.inOut', duration: 1.1 }, BOX_START)
        .fromTo(pbLines, { x: centerShift(pbLines) }, { x: 0, ease: 'power3.inOut', duration: 1.1 }, BOX_START)
        .fromTo(pbTitle.querySelector('em'), { color: '#222' }, { color: '#2fd37f', ease: 'power2.inOut', duration: 0.8 }, BOX_START + 0.1)
        .to(pbIntro, { x: function () { return -pbStage.clientWidth * 0.22; }, y: -40, scale: 0.7, autoAlpha: 0, ease: 'power2.in', duration: 0.6 }, BOX_START)
        .fromTo('.pb-sub', { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, ease: 'power2.out', duration: 0.4 }, BOX_START + 0.8)
        // ④ 우측 카드 순차 등장 (카드당 약 0.55화면)
        .fromTo(pbCards, { x: 90, autoAlpha: 0 }, { x: 0, autoAlpha: 1, ease: 'power3.out', duration: 0.6, stagger: 0.55 }, BOX_START + 1.3)
        .to({}, { duration: 0.6 }); // 완성된 화면에서 머무름

      pinScrub(pb, pbTl, 2);
    });
  }

  /* ---------- 섹션 3 : 가운데 타이틀 → 위로 밀리며 중앙 이미지 → 좌측 정렬 + 이미지가 카드로 펼쳐짐 (PC) ---------- */
  var vl = document.querySelector('.ab-value');
  if (vl) {
    var vlStage = vl.querySelector('.vl-stage');
    var vlTitle = vl.querySelector('.vl-title');
    var vlLines = toArr(vlTitle.querySelectorAll('.ln'));
    var vlThumb = vl.querySelector('.vl-thumb');
    var vlWrap = vl.querySelector('.vl-cards');
    var vlCards = toArr(vlWrap.children);
    var VL_SCALE = 0.84;  // 처음 가운데 타이틀 크기
    var VL_LIFT = 130;    // 이미지가 나타날 때 타이틀이 위로 밀려나는 거리

    // 4장의 카드가 하나의 사진을 이어서 보여주도록 위치값 전달
    var setStrip = function () {
      var desktop = window.innerWidth > 1024;
      vlCards.forEach(function (li) {
        li.style.setProperty('--off', desktop ? li.offsetLeft + 'px' : '');
        li.style.setProperty('--sw', desktop ? vlWrap.offsetWidth + 'px' : '');
      });
    };
    setStrip();
    ScrollTrigger.addEventListener('refreshInit', setStrip);

    mm.add('(min-width: 1025px)', function () {
      var thumbW = function () { return Math.max(220, Math.min(304, window.innerWidth * 0.16)); };
      var thumbH = function () { return thumbW() * 0.68; };
      var titleX = function () { return vlStage.clientWidth / 2 - lineWidth(vlLines) * VL_SCALE / 2 - vlTitle.offsetLeft; };
      var titleY = function () { return vlStage.clientHeight / 2 - vlTitle.offsetHeight * VL_SCALE / 2 - vlTitle.offsetTop; };

      var vlTl = gsap.timeline()
        // ① 타이틀이 위로 밀리며 작은 중앙 이미지 등장 (1화면)
        .fromTo(vlTitle,
          { x: titleX, y: titleY, scale: VL_SCALE, transformOrigin: '0 0' },
          { y: function () { return titleY() - VL_LIFT; }, ease: 'power2.inOut', duration: 1 }, 0.2)
        .fromTo(vlThumb,
          {
            left: function () { return vlStage.clientWidth / 2 - thumbW() / 2; },
            top: function () { return vlStage.clientHeight / 2 - thumbH() / 2 + VL_LIFT * 0.55; },
            width: thumbW, height: thumbH, autoAlpha: 0, scale: 0.7
          },
          { autoAlpha: 1, scale: 1, ease: 'power2.out', duration: 0.8 }, 0.4)
        // ② 타이틀이 먼저 좌측으로 비켜서고, 이미지가 뒤따라 우측 카드 영역으로 펼쳐짐 (겹쳐서 글자가 묻히지 않도록)
        .to(vlTitle, { x: 0, y: 0, scale: 1, ease: 'power3.inOut', duration: 1.2 }, 1.5)
        .fromTo(vlLines, { x: centerShift(vlLines) }, { x: 0, ease: 'power3.inOut', duration: 1.2 }, 1.5)
        .to(vlThumb, {
          left: function () { return vlWrap.offsetLeft; },
          top: function () { return vlWrap.offsetTop; },
          width: function () { return vlWrap.offsetWidth; },
          height: function () { return vlWrap.offsetHeight; },
          ease: 'power3.inOut', duration: 1.1
        }, 2.0)
        .fromTo('.vl-desc', { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, ease: 'power2.out', duration: 0.5 }, 2.5)
        // ③ 펼쳐진 이미지가 4장의 카드로 나뉘며 순차 등장 → 카드 문구 팝업 (카드당 약 0.3화면)
        .fromTo(vlCards, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', ease: 'power3.out', duration: 0.6, stagger: 0.3 }, 2.9)
        .to(vlThumb, { autoAlpha: 0, ease: 'none', duration: 0.4 }, 3.7)
        .fromTo(vl.querySelectorAll('.vl-txt strong'), { y: 30, scale: 0.85, autoAlpha: 0 }, { y: 0, scale: 1, autoAlpha: 1, ease: 'back.out(1.6)', duration: 0.5, stagger: 0.3 }, 3.3)
        .fromTo(vl.querySelectorAll('.vl-txt span'), { y: 20, autoAlpha: 0 }, { y: 0, autoAlpha: 1, ease: 'power2.out', duration: 0.4, stagger: 0.3 }, 3.45)
        .to({}, { duration: 0.6 }); // 완성된 화면에서 머무름

      pinScrub(vl, vlTl, 1);
    });
  }

  /* ---------- 모바일 / 태블릿 : 고정 없이 아래에서 순차 등장 ---------- */
  mm.add('(max-width: 1024px)', function () {
    gsap.utils.toArray('.pb-head, .pb-list li, .vl-head, .vl-cards').forEach(function (el) {
      gsap.from(el, {
        y: 50, autoAlpha: 0, duration: 1, ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 88%' }
      });
    });
    gsap.from('.vl-txt', {
      y: 24, autoAlpha: 0, duration: 0.8, ease: 'power3.out', stagger: 0.12,
      scrollTrigger: { trigger: '.vl-cards', start: 'top 80%' }
    });
  });

  /* ---------- 섹션 4 : CTA 박스가 스크롤에 따라 가운데에서 양옆·위아래로 펼쳐짐 → 문구 순차 등장 ---------- */
  var ctaBox = document.querySelector('.ab-cta-box');
  if (ctaBox) {
    // 박스 펼침 : 스크롤 연동 (위로 떠오르며 좁은 캡슐 → 원래 크기)
    gsap.fromTo(ctaBox,
      { clipPath: 'inset(18% 30% 18% 30% round 200px)', y: 80 },
      {
        clipPath: function () { return 'inset(0% 0% 0% 0% round ' + (parseFloat(getComputedStyle(ctaBox).borderTopLeftRadius) || 0) + 'px)'; }, // 박스 모서리(PC 30 / 모바일 20)와 같게
        y: 0, ease: 'power2.out',
        scrollTrigger: { trigger: ctaBox, start: 'top 98%', end: 'center 55%', scrub: 1, invalidateOnRefresh: true }
      });
    // 문구 : 박스가 거의 펼쳐졌을 때 아래에서 순차 등장 (위로 되돌아가면 다시 숨김)
    gsap.fromTo(ctaBox.children, { y: 30, autoAlpha: 0 }, {
      y: 0, autoAlpha: 1, duration: 0.8, ease: 'power3.out', stagger: 0.12,
      scrollTrigger: { trigger: ctaBox, start: 'top 62%', toggleActions: 'play none none reverse' }
    });
  }

  /* 웹폰트 적용 후 타이틀 폭이 바뀌므로 위치 재계산 */
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () { ScrollTrigger.refresh(); });
  }
})();
