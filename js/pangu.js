/* ============================================================
   蒙益行 — shared interactions
   ============================================================ */
(function () {
  'use strict';

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const IMG_BASE = document.body.dataset.page === 'city' ? '../assets/img/' : 'assets/img/';

  /* ---------------- nav / chrome ---------------- */
  function initChrome() {
    const nav = $('#nav');
    const progress = $('#scrollProgress');
    const onScroll = () => {
      const y = window.scrollY || document.documentElement.scrollTop;
      if (nav) nav.classList.toggle('is-scrolled', y > 30);
      if (progress) {
        const h = document.documentElement.scrollHeight - window.innerHeight;
        progress.style.width = (h > 0 ? Math.min(100, (y / h) * 100) : 0) + '%';
      }
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    const burger = $('#navBurger');
    const mobile = $('#mobileMenu');
    if (burger && mobile) {
      const setOpen = (open) => {
        mobile.classList.toggle('is-open', open);
        burger.setAttribute('aria-expanded', String(open));
        document.body.classList.toggle('is-locked', open);
        burger.innerHTML = open
          ? '<span style="transform:translateY(5px) rotate(45deg)"></span><span style="opacity:0"></span><span style="transform:translateY(-5px) rotate(-45deg)"></span>'
          : '<span></span><span></span><span></span>';
      };
      burger.addEventListener('click', () => setOpen(!mobile.classList.contains('is-open')));
      $$('a', mobile).forEach(a => a.addEventListener('click', () => setOpen(false)));
      window.addEventListener('keydown', e => { if (e.key === 'Escape') setOpen(false); });
    }

    // reveal
    if ('IntersectionObserver' in window && !reduceMotion) {
      const io = new IntersectionObserver(entries => {
        entries.forEach(en => {
          if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -40px' });
      $$('.reveal').forEach(el => io.observe(el));
    } else {
      $$('.reveal').forEach(el => el.classList.add('is-in'));
    }

    // counters
    const counters = $$('[data-count]');
    if (counters.length && 'IntersectionObserver' in window) {
      const cio = new IntersectionObserver(entries => {
        entries.forEach(en => {
          if (!en.isIntersecting) return;
          const el = en.target;
          const target = parseFloat(el.dataset.count);
          const suffix = el.dataset.suffix || '';
          const finalText = Math.round(target).toLocaleString('zh-CN') + suffix;
          el.textContent = finalText;
          const start = performance.now();
          const dur = 1400;
          const tick = now => {
            const p = Math.min(1, (now - start) / dur);
            const eased = 1 - Math.pow(1 - p, 3);
            el.textContent = Math.round(target * eased).toLocaleString('zh-CN') + suffix;
            if (p < 1) requestAnimationFrame(tick);
            else el.textContent = finalText;
          };
          requestAnimationFrame(tick);
          cio.unobserve(el);
        });
      }, { threshold: 0.6 });
      counters.forEach(c => cio.observe(c));
    }

    // guide
    const guideBtn = $('#guideToggle');
    const guidePanel = $('#guidePanel');
    if (guideBtn && guidePanel) {
      guideBtn.addEventListener('click', e => {
        e.stopPropagation();
        const open = !guidePanel.classList.contains('is-open');
        guidePanel.classList.toggle('is-open', open);
        guideBtn.setAttribute('aria-expanded', String(open));
      });
      document.addEventListener('click', e => {
        if (!guidePanel.contains(e.target) && !guideBtn.contains(e.target)) {
          guidePanel.classList.remove('is-open');
          guideBtn.setAttribute('aria-expanded', 'false');
        }
      });
    }
  }

  /* ---------------- modal ---------------- */
  const modal = {
    root: null,
    lastFocus: null,
    init() {
      this.root = $('#panguModal');
      if (!this.root) return;
      this.root.addEventListener('click', e => {
        if (e.target.closest('[data-close]')) this.close();
      });
      window.addEventListener('keydown', e => {
        if (e.key === 'Escape' && this.root.classList.contains('is-open')) this.close();
      });
    },
    open(data) {
      if (!this.root) return;
      this.lastFocus = document.activeElement;
      this.root.classList.remove('is-quiz');
      const img = $('#modalImg', this.root);
      const cat = $('#modalCat', this.root);
      const title = $('#modalTitle', this.root);
      const sub = $('#modalSub', this.root);
      const content = $('#modalContent', this.root);
      if (data.img) { img.src = data.img; img.alt = data.title || ''; }
      cat.textContent = data.cat || '';
      title.textContent = data.title || '';
      sub.textContent = data.sub || '';
      let html = '';
      if (data.meta && data.meta.length) {
        html += '<div class="modal-meta">' + data.meta.map(m =>
          `<div><b>${m[0]}</b>${m[1]}</div>`).join('') + '</div>';
      }
      if (data.video) {
        html += `<div class="heritage-video"><video controls playsinline preload="metadata"${data.poster ? ` poster="${data.poster}"` : ''}><source src="${data.video}" type="video/mp4">您的浏览器不支持视频播放。</video><button class="heritage-play" type="button" aria-label="播放非遗视频">▶ 播放非遗影像</button><span class="heritage-video-note">非遗影像 · 点击播放 · 素材来源 Bilibili</span></div>`;
      }
      if (data.lead) html += `<p class="lead">${data.lead}</p>`;
      if (data.body) html += `<p>${data.body}</p>`;
      if (data.tip) html += `<div class="modal-tip"><b>研学提示 · </b>${data.tip}</div>`;
      if (data.actions && data.actions.length) {
        html += '<div class="modal-actions">' + data.actions.map(a =>
          `<a class="btn btn-dark" data-close href="${a.href}">${a.label}</a>`).join('') + '</div>';
      }
      content.innerHTML = html;
      content.querySelectorAll('.heritage-video').forEach(box => {
        const video = box.querySelector('video');
        const play = box.querySelector('.heritage-play');
        if (!video || !play) return;
        play.addEventListener('click', () => {
          const p = video.play();
          if (p && p.catch) p.catch(() => play.classList.remove('is-hidden'));
        });
        video.addEventListener('play', () => play.classList.add('is-hidden'));
        video.addEventListener('pause', () => {
          if (!video.currentTime) play.classList.remove('is-hidden');
        });
      });
      this.root.classList.add('is-open');
      this.root.style.opacity = '1';
      this.root.style.visibility = 'visible';
      this.root.style.transition = 'none';
      this.root.setAttribute('aria-hidden', 'false');
      document.body.classList.add('is-locked');
      setTimeout(() => { const c = $('.modal-close', this.root); if (c) c.focus(); }, 30);
    },
    close() {
      if (!this.root) return;
      this.root.classList.remove('is-open');
      this.root.style.transition = 'none';
      this.root.style.opacity = '0';
      this.root.style.visibility = 'hidden';
      this.root.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('is-locked');
      const video = this.root.querySelector('.heritage-video video');
      if (video) video.pause();
      if (this.lastFocus) this.lastFocus.focus();
    }
  };
  modal.init();

  /* ---------------- map rendering ---------------- */
  function starPoints(cx, cy, outer, inner) {
    const pts = [];
    for (let i = 0; i < 10; i++) {
      const r = i % 2 === 0 ? outer : inner;
      const a = -Math.PI / 2 + i * Math.PI / 5;
      pts.push((cx + Math.cos(a) * r).toFixed(1) + ',' + (cy + Math.sin(a) * r).toFixed(1));
    }
    return pts.join(' ');
  }

  function mapSvg(cities, opts = {}) {
    const { full = false } = opts;
    const regions = cities.map(c =>
      `<path class="city-region" d="${c.path}" data-city="${c.id}" tabindex="0" role="button" aria-label="${c.full}，点击进入城市页"></path>`
    ).join('');
    const labels = cities.map(c => {
      const [lx, ly] = c.label;
      const [cx, cy] = c.center;
      const dist = Math.hypot(lx - cx, ly - cy);
      const line = dist > 26
        ? `<line x1="${cx}" y1="${cy}" x2="${lx}" y2="${ly}" stroke="rgba(227,201,143,.35)" stroke-width="1" stroke-dasharray="2 3"/>`
        : '';
      const dot = `<circle cx="${cx}" cy="${cy}" r="2.6" fill="#e3c98f" opacity=".9"/>`;
      const star = c.id === 'hohhot'
        ? `<polygon points="${starPoints(cx, cy, 8, 3.4)}" fill="#e3c98f" stroke="#0a1610" stroke-width="1"/>`
        : '';
      const small = c.name.length > 4 ? ' is-small' : '';
      return `${line}${dot}${star}<text class="city-label${small}" x="${lx}" y="${ly}" text-anchor="${c.anchor}">${c.name}</text>`;
    }).join('');
    return `<svg viewBox="0 0 1000 720" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="内蒙古自治区十二盟市交互地图" ${full ? 'class="map-svg-full"' : ''}>
      <defs>
        <filter id="mapGlow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="6" stdDeviation="7" flood-color="#c9a15e" flood-opacity=".35"/>
        </filter>
      </defs>
      <g class="map-regions">${regions}</g>
      <g class="map-labels">${labels}</g>
    </svg>`;
  }

  function bindMap(root, cities, onPick, opts = {}) {
    const svg = $('svg', root);
    if (!svg) return;
    const preview = opts.preview;
    const setActive = id => {
      $$('.city-region', svg).forEach(p => p.classList.toggle('is-active', p.dataset.city === id));
      $$('.map-chip', opts.chipRoot || root).forEach(ch => ch.classList.toggle('is-active', ch.dataset.city === id));
    };
    const pick = (id, navigate) => {
      const city = cities.find(c => c.id === id);
      if (!city) return;
      setActive(id);
      if (preview) preview(city);
      if (navigate && onPick) onPick(city);
    };
    $$('.city-region', svg).forEach(path => {
      const id = path.dataset.city;
      path.addEventListener('mouseenter', () => pick(id, false));
      path.addEventListener('focus', () => pick(id, false));
      path.addEventListener('click', () => pick(id, true));
      path.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(id, true); }
      });
    });
    $$('.map-chip', opts.chipRoot || root).forEach(chip => {
      chip.addEventListener('mouseenter', () => pick(chip.dataset.city, false));
      chip.addEventListener('focus', () => pick(chip.dataset.city, false));
      chip.addEventListener('click', () => pick(chip.dataset.city, true));
    });
    return { setActive, pick };
  }

  /* ---------------- home ---------------- */
  function initHome() {
    const cities = (window.PANGU_MAP && window.PANGU_MAP.cities) || [];
    if (!cities.length) return;

    const stage = $('#homeMapSvg');
    const preview = $('#mapPreview');
    const previewImg = $('#previewImg');
    const previewNum = $('#previewNum');
    const previewName = $('#previewName');
    const previewTag = $('#previewTagline');
    const previewTags = $('#previewTags');
    const previewLink = $('#previewLink');

    function renderPreview(city) {
      if (!preview) return;
      previewImg.style.opacity = '0';
      setTimeout(() => {
        previewImg.src = 'assets/img/' + city.hero + '.webp';
        previewImg.alt = city.name + '城市风光';
        previewImg.style.opacity = '1';
      }, 120);
      previewNum.textContent = city.num + ' / 12 · ' + city.alias;
      previewName.textContent = city.full;
      previewTag.textContent = city.tagline;
      previewTags.innerHTML = city.impression.map(t => `<span>${t}</span>`).join('');
      previewLink.href = 'cities/' + city.id + '.html';
      previewLink.setAttribute('aria-label', '进入' + city.full + '城市页');
    }

    if (stage) {
      stage.innerHTML = mapSvg(cities);
      bindMap(stage, cities, city => { window.location.href = 'cities/' + city.id + '.html'; }, { preview: renderPreview, chipRoot: document });
      renderPreview(cities[0]);
    }

    // city grid filter? no. keep all.
    // quiz
    initQuiz();

    // heritage filter + modal
    const heritage = window.PANGU_HERITAGE || [];
    const cards = $$('.heritage-card');
    $$('.filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        $$('.filter-btn').forEach(b => b.classList.remove('is-active'));
        btn.classList.add('is-active');
        const cat = btn.dataset.filter;
        cards.forEach(card => {
          const show = cat === 'all' || card.dataset.cat === cat;
          card.classList.toggle('is-hidden', !show);
        });
      });
    });
    cards.forEach(card => {
      card.addEventListener('click', () => {
        const item = heritage[Number(card.dataset.heritage)];
        if (!item) return;
        modal.open({
          img: IMG_BASE + item.img + '.webp',
          video: item.video || '',
          poster: IMG_BASE + item.img + '.webp',
          cat: item.cat + ' · ' + item.level,
          title: item.name,
          sub: item.sub || '',
          lead: item.lead || item.desc,
          body: item.detail,
          meta: item.meta || [],
          tip: item.tip || ''
        });
      });
    });

    // hero explore buttons: smooth anchors already via CSS; add small feedback
    $$('[data-scroll]').forEach(el => {
      el.addEventListener('click', e => {
        const target = $(el.dataset.scroll);
        if (target) { e.preventDefault(); target.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
      });
    });
  }

  /* ---------------- quiz ---------------- */
  const QUIZ = window.PANGU_QUIZ || [];
  const QUIZ_SIZE = 10;

  function shuffleArray(list) {
    const a = list.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function buildQuizSession() {
    const pool = shuffleArray(QUIZ).slice(0, Math.min(QUIZ_SIZE, QUIZ.length));
    return pool.map(item => {
      const opts = item.opts.map((text, i) => ({ text, correct: i === item.a }));
      const shuffled = shuffleArray(opts);
      return {
        q: item.q,
        opts: shuffled.map(o => o.text),
        a: shuffled.findIndex(o => o.correct),
        note: item.note
      };
    });
  }

  function quizResult(score) {
    const table = {
      10: ['北疆通识官', '十题全中。山河、召庙、草原和非遗都在你脑子里，十二城的故事可以倒着讲。'],
      9: ['草原万事通', '只差一题。你已经把北疆的骨架摸清了，再补一个细节就圆满了。'],
      8: ['山河熟客', '很稳。再走两座城、看几段非遗，你就能带着别人逛北疆。'],
      7: ['北疆行家', '底子很好。把错题对应的城市页翻一遍，下一次就是 9 分。'],
      6: ['及格旅人', '及格线之上。你已经认得大半张北疆地图，继续往西走。'],
      5: ['半程探索者', '一半一半。选一座最想去的城，从它的景点和故事开始补课。'],
      4: ['初入北疆', '刚摸到门。别急着背，先去地图上点开两座城看看。'],
      3: ['山门外的学生', '还在山门外。蒙益行建议你先看“十二城”，再回来答题。'],
      2: ['刚刚启程', '别灰心，北疆很大。先记住呼和浩特、包头、鄂尔多斯三座城。'],
      1: ['有缘人', '第一题就中，说明和北疆有缘。把地图打开，慢慢走。'],
      0: ['从零出发', '没关系，北疆的故事本来就是走出来的。先点开第一座城。']
    };
    return table[score] || table[0];
  }

  function initQuiz() {
    const startBtn = $('#startQuiz');
    if (!startBtn || !QUIZ.length) return;
    let idx = 0, score = 0, locked = false, body = null, session = [];

    function render() {
      if (idx >= session.length) return renderResult();
      const q = session[idx];
      locked = false;
      body.innerHTML = `
        <div class="quiz-shell">
          <div class="quiz-progress">${session.map((_, i) => `<span class="${i <= idx ? 'is-on' : ''}"></span>`).join('')}</div>
          <div class="quiz-q">${q.q}</div>
          <div class="quiz-options">${q.opts.map((o, i) => `<button class="quiz-opt" data-i="${i}">${String.fromCharCode(65 + i)} · ${o}</button>`).join('')}</div>
          <div class="quiz-foot"><span>第 ${idx + 1} / ${session.length} 题</span><span>答对 ${score} 题</span></div>
        </div>`;
      $$('.quiz-opt', body).forEach(btn => btn.addEventListener('click', () => {
        if (locked) return;
        locked = true;
        const pick = Number(btn.dataset.i);
        const correct = pick === q.a;
        if (correct) score++;
        $$('.quiz-opt', body).forEach((b, i) => {
          if (i === q.a) b.classList.add('is-correct');
          else if (i === pick) b.classList.add('is-wrong');
        });
        const foot = $('.quiz-foot', body);
        if (foot) foot.innerHTML = `<span>${correct ? '✓ 答对了' : '× 再想想'} · ${q.note}</span><button class="text-link" id="nextQ">${idx === session.length - 1 ? '查看结果' : '下一题'} →</button>`;
        const next = $('#nextQ', body);
        if (next) next.addEventListener('click', () => { idx++; render(); });
      }));
    }

    function renderResult() {
      const r = quizResult(score);
      body.innerHTML = `<div class="quiz-result">
        <div class="quiz-kicker">RESULT · ${score} / ${session.length}</div>
        <div class="score">${score}<span> / ${session.length}</span></div>
        <h3>${r[0]}</h3>
        <p>${r[1]}</p>
        <div class="quiz-result-bar"><span style="width:${(score / session.length) * 100}%"></span></div>
        <div class="quiz-result-actions">
          <button class="btn btn-dark" id="restartQuiz">再测一次（换 10 题）</button>
          <a class="btn" href="map.html">打开城市地图</a>
        </div>
      </div>`;
      const restart = $('#restartQuiz');
      if (restart) restart.addEventListener('click', () => {
        session = buildQuizSession();
        idx = 0; score = 0;
        render();
        const panel = body.closest('.modal-panel');
        if (panel) panel.scrollTop = 0;
      });
    }

    function start() {
      session = buildQuizSession();
      idx = 0; score = 0;
      modal.open({
        img: IMG_BASE + 'home-hero.webp',
        cat: '蒙益行小课堂',
        title: '北疆知识小测',
        sub: '50 道题库 · 每次随机 10 道 · 选项顺序也会变',
        body: '',
        meta: []
      });
      const root = $('#panguModal');
      if (root) {
        root.classList.add('is-quiz');
        root.style.opacity = '1';
        root.style.visibility = 'visible';
        root.style.transition = 'none';
      }
      const content = $('#modalContent');
      content.innerHTML = '<div id="quizBody"></div>';
      body = $('#quizBody');
      render();
    }

    startBtn.addEventListener('click', start);
  }

  /* ---------------- map page ---------------- */
  function initMapPage() {
    const cities = (window.PANGU_MAP && window.PANGU_MAP.cities) || [];
    const wrap = $('#fullMapSvg');
    if (!wrap || !cities.length) return;
    wrap.innerHTML = mapSvg(cities, { full: true });

    const detail = $('#mapDetail');
    const detailImg = $('#mapDetailImg');
    const detailNum = $('#mapDetailNum');
    const detailName = $('#mapDetailName');
    const detailDesc = $('#mapDetailDesc');
    const detailLink = $('#mapDetailLink');
    const tooltip = $('#mapTooltip');
    const list = $('#cityList');
    const search = $('#mapSearchInput');

    const setDetail = city => {
      if (!detail) return;
      detail.hidden = false;
      detailImg.src = 'assets/img/' + city.hero + '.webp';
      detailImg.alt = city.name;
      detailNum.textContent = city.num + ' / 12 · ' + city.alias;
      detailName.textContent = city.full;
      detailDesc.textContent = city.tagline;
      detailLink.href = 'cities/' + city.id + '.html';
      $$('.city-list-item').forEach(li => li.classList.toggle('is-active', li.dataset.city === city.id));
      $$('.city-region').forEach(p => p.classList.toggle('is-active', p.dataset.city === city.id));
    };

    const byId = id => cities.find(c => c.id === id);

    $$('.city-region').forEach(path => {
      const id = path.dataset.city;
      path.addEventListener('mouseenter', e => {
        const city = byId(id);
        setDetail(city);
        if (tooltip) {
          tooltip.innerHTML = `<b>${city.name}</b>${city.alias}`;
          tooltip.classList.add('is-on');
        }
      });
      path.addEventListener('mousemove', e => {
        if (!tooltip) return;
        const rect = wrap.getBoundingClientRect();
        tooltip.style.left = (e.clientX - rect.left) + 'px';
        tooltip.style.top = (e.clientY - rect.top) + 'px';
      });
      path.addEventListener('mouseleave', () => tooltip && tooltip.classList.remove('is-on'));
      path.addEventListener('click', () => {
        if (suppressClick) { suppressClick = false; return; }
        window.location.href = 'cities/' + id + '.html';
      });
      path.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          window.location.href = 'cities/' + id + '.html';
        }
      });
    });

    // city list
    if (list) {
      cities.forEach(c => {
        const a = document.createElement('a');
        a.className = 'city-list-item';
        a.href = 'cities/' + c.id + '.html';
        a.dataset.city = c.id;
        a.innerHTML = `<span class="li-num">${c.num}</span><span class="li-name">${c.full}<small>${c.alias} · ${c.en}</small></span><span class="li-dot"></span>`;
        a.addEventListener('mouseenter', () => setDetail(c));
        list.appendChild(a);
      });
      setDetail(cities[0]);
    }

    if (search) {
      search.addEventListener('input', () => {
        const q = search.value.trim().toLowerCase();
        $$('.city-list-item').forEach(li => {
          const city = byId(li.dataset.city);
          const hit = !q || city.name.includes(q) || city.full.includes(q) || city.alias.includes(q) || city.en.toLowerCase().includes(q);
          li.style.display = hit ? '' : 'none';
          const p = document.querySelector(`.city-region[data-city="${li.dataset.city}"]`);
          if (p) p.style.opacity = hit ? '' : '.18';
        });
      });
    }

    // zoom + pan
    const canvas = $('#mapCanvas');
    const svgWrap = $('#mapSvgWrap');
    let scale = 1, tx = 0, ty = 0, dragging = false, moved = 0, sx = 0, sy = 0;
    let suppressClick = false;
    const apply = () => {
      if (svgWrap) svgWrap.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
      const level = $('#zoomLevel');
      if (level) level.textContent = Math.round(scale * 100) + '%';
    };
    $('#zoomIn') && $('#zoomIn').addEventListener('click', () => { scale = Math.min(2.4, scale + .2); apply(); });
    $('#zoomOut') && $('#zoomOut').addEventListener('click', () => { scale = Math.max(.7, scale - .2); apply(); });
    $('#zoomReset') && $('#zoomReset').addEventListener('click', () => { scale = 1; tx = 0; ty = 0; apply(); });
    if (canvas) {
      canvas.addEventListener('pointerdown', e => {
        if (e.target.closest('.map-detail, .map-toolbar, .map-legend, .map-badge')) return;
        dragging = true; moved = 0; sx = e.clientX - tx; sy = e.clientY - ty;
        canvas.classList.add('is-dragging');
        canvas.setPointerCapture(e.pointerId);
      });
      canvas.addEventListener('pointermove', e => {
        if (!dragging) return;
        tx = e.clientX - sx; ty = e.clientY - sy;
        moved += Math.abs(e.movementX) + Math.abs(e.movementY);
        apply();
      });
      canvas.addEventListener('pointerup', e => {
        dragging = false;
        canvas.classList.remove('is-dragging');
        suppressClick = moved > 6;
        try { canvas.releasePointerCapture(e.pointerId); } catch (err) {}
      });
      canvas.addEventListener('pointerleave', () => { dragging = false; canvas.classList.remove('is-dragging'); });
    }
  }

  /* ---------------- city page ---------------- */
  function initCityPage() {
    const city = window.CITY_DATA;
    if (!city) return;

    // subnav scrollspy
    const sections = $$('section[id]');
    const links = $$('.city-subnav a[href^="#"]');
    if (sections.length && links.length && 'IntersectionObserver' in window) {
      const io = new IntersectionObserver(entries => {
        entries.forEach(en => {
          if (!en.isIntersecting) return;
          const id = '#' + en.target.id;
          links.forEach(a => a.classList.toggle('active', a.getAttribute('href') === id));
        });
      }, { rootMargin: '-30% 0px -60% 0px' });
      sections.forEach(s => io.observe(s));
    }

    // spot modals
    $$('[data-spot]').forEach(el => {
      el.addEventListener('click', () => {
        const i = Number(el.dataset.spot);
        const a = city.attractions[i];
        if (!a) return;
        modal.open({
          img: IMG_BASE + a.img + '.webp',
          cat: a.cat,
          title: a.name,
          sub: a.sub,
          lead: a.desc,
          body: a.detail,
          meta: a.meta,
          tip: a.tips,
          actions: [{ href: '#route', label: '加入一日路线' }]
        });
      });
    });

    // heritage modals
    $$('[data-heritage]').forEach(el => {
      el.addEventListener('click', () => {
        const i = Number(el.dataset.heritage);
        const h = city.heritage[i];
        if (!h) return;
        modal.open({
          img: IMG_BASE + h.img + '.webp',
          cat: h.cat + ' · ' + h.level,
          title: h.name,
          sub: h.cat,
          lead: h.desc,
          body: h.detail,
          meta: [['级别', h.level], ['类别', h.cat], ['流传地', city.full]],
          tip: '非遗是活态文化，观看表演或体验技艺时，请尊重传承人与当地习俗。'
        });
      });
    });

    initGallery(city);
  }

  /* ---------------- photo viewer ---------------- */
  function initGallery(city) {
    const viewer = $('#photoViewer');
    if (!viewer) return;
    const items = (city.attractions || []).map(a => ({ key: a.img, img: IMG_BASE + a.img + '.webp', name: a.name, cat: a.cat }));
    if (!items.length) return;
    const panoMap = window.PANO360_MAP || {};
    const img = $('#photoImg'), pan = $('#photoPan'), stage = $('#photoStage');
    const pano360 = $('#pano360'), canvas = $('#panoCanvas'), panoAngle = $('#panoAngle');
    const range = $('#photoRange'), count = $('#photoCount'), panoBtn = $('#photoPano');
    const sliderLabel = $('#photoSliderLabel');
    const nameEl = $('#photoName'), catEl = $('#photoCat'), titleEl = $('#photoTitle');
    const thumbs = $('#photoThumbs');
    let idx = 0, lastTrigger = null, is360 = false, panoCtl = null, currentPano = null, pitch = 0;
    range.min = 0; range.max = 100; range.value = 0;
    panoBtn.textContent = '360° 环视';
    thumbs.innerHTML = items.map((it, i) => `<button type="button" data-i="${i}" aria-label="${it.name}"><img src="${it.img}" alt="${it.name}" loading="lazy"></button>`).join('');
    const thumbBtns = $$('button', thumbs);

    function applyPan() {
      if (is360) return;
      const overflow = Math.max(0, pan.clientWidth - stage.clientWidth);
      const t = Number(range.value) / 100;
      img.style.transform = `translateX(${-overflow * t}px)`;
    }
    function apply360() {
      if (!is360) return;
      const deg = Number(range.value);
      if (panoCtl) panoCtl.setYaw(deg);
      if (panoAngle) panoAngle.textContent = '旋转视角 ' + Math.round(deg) + '°';
    }
    function updatePano() {
      currentPano = panoMap[items[idx].key] || null;
      panoBtn.hidden = !currentPano;
      if (!currentPano && is360) exit360(false);
    }
    function select(i, reset) {
      if (is360) exit360(false);
      idx = (i + items.length) % items.length;
      const it = items[idx];
      img.src = it.img;
      img.alt = it.name;
      nameEl.textContent = it.name;
      catEl.textContent = it.cat;
      titleEl.textContent = city.full + ' · ' + it.name;
      count.textContent = (idx + 1) + ' / ' + items.length;
      thumbBtns.forEach((b, j) => b.classList.toggle('is-active', j === idx));
      updatePano();
      if (reset) range.value = 0;
      applyPan();
      const active = thumbBtns[idx];
      if (active) {
        const target = active.offsetLeft - thumbs.offsetLeft - (thumbs.clientWidth - active.clientWidth) / 2;
        thumbs.scrollTo({ left: Math.max(0, target), behavior: 'smooth' });
      }
    }
    function enter360() {
      if (!currentPano) return;
      is360 = true;
      pitch = 0;
      viewer.classList.add('is-360');
      pan.hidden = true;
      pano360.hidden = false;
      range.min = 0; range.max = 360; range.value = 0;
      sliderLabel.textContent = '左右旋转视角';
      panoBtn.textContent = '退出 360°';
      panoBtn.classList.add('is-active');
      titleEl.textContent = city.full + ' · ' + items[idx].name + ' · 360°';
      nameEl.textContent = '360° 实景';
      catEl.textContent = '拖动画面 / 滑杆旋转';
      count.textContent = '360°';
      if (!panoCtl && window.Pano360) panoCtl = window.Pano360.create(canvas);
      if (!panoCtl) {
        if (panoAngle) panoAngle.textContent = '当前浏览器不支持 360°';
        return;
      }
      requestAnimationFrame(() => {
        panoCtl.resize(stage.clientWidth, stage.clientHeight);
        panoCtl.setSource(currentPano);
        panoCtl.setPitch(0);
        apply360();
      });
    }
    function exit360(restore) {
      is360 = false;
      viewer.classList.remove('is-360');
      pan.hidden = false;
      pano360.hidden = true;
      range.min = 0; range.max = 100; range.value = 0;
      sliderLabel.textContent = '左右移动照片';
      panoBtn.textContent = '360° 环视';
      panoBtn.classList.remove('is-active');
      if (restore) select(idx, true);
    }
    function open(i) {
      lastTrigger = document.activeElement;
      viewer.classList.add('is-open');
      viewer.setAttribute('aria-hidden', 'false');
      document.body.classList.add('is-locked');
      select(i, true);
      setTimeout(() => {
        applyPan();
        const c = $('.photo-close', viewer);
        if (c) c.focus();
      }, 80);
    }
    function close() {
      viewer.classList.remove('is-open');
      viewer.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('is-locked');
      if (lastTrigger && lastTrigger.focus) lastTrigger.focus();
    }
    $$('[data-open-gallery]').forEach(btn => btn.addEventListener('click', () => open(0)));
    $$('[data-photo-close]', viewer).forEach(btn => btn.addEventListener('click', close));
    range.addEventListener('input', () => { is360 ? apply360() : applyPan(); });
    thumbBtns.forEach(btn => btn.addEventListener('click', () => select(Number(btn.dataset.i), true)));
    panoBtn.addEventListener('click', () => { is360 ? exit360(true) : enter360(); });
    window.addEventListener('resize', () => {
      if (is360 && panoCtl) {
        panoCtl.resize(stage.clientWidth, stage.clientHeight);
        apply360();
      } else {
        applyPan();
      }
    });
    window.addEventListener('keydown', e => {
      if (!viewer.classList.contains('is-open')) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        range.value = Math.max(0, Number(range.value) - 6);
        is360 ? apply360() : applyPan();
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        range.value = Math.min(is360 ? 360 : 100, Number(range.value) + 6);
        is360 ? apply360() : applyPan();
      }
    });
    let sx = 0, sy = 0, startVal = 0, startPitch = 0, drag = false;
    stage.addEventListener('pointerdown', e => {
      drag = true; sx = e.clientX; sy = e.clientY; startVal = Number(range.value);
      startPitch = panoCtl ? panoCtl.getPitch() : 0;
      try { stage.setPointerCapture(e.pointerId); } catch (err) {}
    });
    stage.addEventListener('pointermove', e => {
      if (!drag) return;
      if (is360 && panoCtl) {
        const yaw = startVal - ((e.clientX - sx) / stage.clientWidth) * 360;
        range.value = ((yaw % 360) + 360) % 360;
        panoCtl.setYaw(Number(range.value));
        panoCtl.setPitch(startPitch + ((e.clientY - sy) / stage.clientHeight) * 0.9);
        if (panoAngle) panoAngle.textContent = '旋转视角 ' + Math.round(Number(range.value)) + '°';
      } else {
        const delta = (startVal * stage.clientWidth - (e.clientX - sx) * 100) / stage.clientWidth;
        range.value = Math.max(0, Math.min(100, delta));
        applyPan();
      }
    });
    stage.addEventListener('pointerup', e => {
      drag = false;
      try { stage.releasePointerCapture(e.pointerId); } catch (err) {}
    });
    stage.addEventListener('pointercancel', () => { drag = false; });
  }

  /* ---------------- in-page anchors ---------------- */
  function initHashLinks() {
    const reveal = target => {
      if (!target) return;
      target.classList.add('is-in');
      target.querySelectorAll('.reveal').forEach(el => el.classList.add('is-in'));
    };
    const jump = hash => {
      const target = document.getElementById(hash.slice(1));
      if (!target) return;
      reveal(target);
      const html = document.documentElement;
      const prev = html.style.scrollBehavior;
      html.style.scrollBehavior = 'auto';
      const top = target.getBoundingClientRect().top + window.scrollY - 88;
      window.scrollTo(0, Math.max(0, top));
      setTimeout(() => { html.style.scrollBehavior = prev; }, 30);
    };
    document.addEventListener('click', e => {
      const a = e.target.closest ? e.target.closest('a[href^="#"]') : null;
      if (!a) return;
      const href = a.getAttribute('href');
      if (!href || href === '#') return;
      const target = document.getElementById(href.slice(1));
      if (!target) return;
      e.preventDefault();
      if (a.closest('#panguModal')) modal.close();
      try {
        if (history.pushState) history.pushState(null, '', href);
        else location.hash = href;
      } catch (err) {
        location.hash = href;
      }
      setTimeout(() => jump(href), 50);
    });
    if (location.hash.length > 1) setTimeout(() => jump(location.hash), 120);
  }

  /* ---------------- boot ---------------- */
  document.addEventListener('DOMContentLoaded', () => {
    initChrome();
    initHashLinks();
    const page = document.body.dataset.page;
    if (page === 'home') initHome();
    if (page === 'map') initMapPage();
    if (page === 'city') initCityPage();
  });
})();
