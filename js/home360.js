/* Homepage 360° panorama explorer + VR tools + passport */
(function () {
  'use strict';

  function init() {
    const modal = document.getElementById('panoHomeModal');
    const stage = document.getElementById('panoHomeStage');
    const canvas = document.getElementById('panoHomeCanvas');
    const range = document.getElementById('panoHomeRange');
    const angle = document.getElementById('panoHomeAngle');
    const deg = document.getElementById('panoHomeDeg');
    const title = document.getElementById('panoHomeTitle');
    const note = document.getElementById('panoHomeNote');
    const cards = Array.prototype.slice.call(document.querySelectorAll('[data-pano]'));
    const gyroBtn = document.getElementById('panoGyro');
    const voiceBtn = document.getElementById('panoVoice');
    const mini = document.getElementById('panoPassportMini');
    const toastEl = document.getElementById('vrToast');
    if (!modal || !stage || !canvas || !window.HOME_PANOS || !window.Pano360 || !cards.length) return;

    let ctl = null;
    let index = 0;
    let drag = false, sx = 0, sy = 0, startYaw = 0, startPitch = 0;
    let speaking = false, gyroOn = false, gyroHandler = null, gyroOffset = null;
    let toastTimer = null;

    // 护照只在本次打开页面期间有效，刷新或重新打开后从 0 开始。
    let visited = new Set();
    try { localStorage.removeItem('mengyixing_vr_passport_v1'); } catch (e) {}

    function toast(msg) {
      if (!toastEl) return;
      toastEl.textContent = msg;
      toastEl.classList.add('is-on');
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => toastEl.classList.remove('is-on'), 2400);
    }
    function setAngle(v) {
      const n = Math.round(((Number(v) % 360) + 360) % 360);
      if (angle) angle.textContent = '旋转视角 ' + n + '°';
      if (deg) deg.textContent = n + '°';
    }
    function apply() {
      const v = Number(range.value);
      if (ctl) ctl.setYaw(v);
      setAngle(v);
    }
    function loadSource(item, cb) {
      if (item.src) return cb(item.src);
      const cached = window.PANO_SOURCES && window.PANO_SOURCES[item.key];
      if (cached) { item.src = cached; return cb(cached); }
      const key = item.key;
      const s = document.createElement('script');
      s.src = 'js/pano-src-' + key + '.js';
      s.onload = function () {
        item.src = (window.PANO_SOURCES || {})[key] || null;
        cb(item.src);
      };
      s.onerror = function () { cb(null); };
      document.head.appendChild(s);
    }

    /* ---------- passport ---------- */
    /* 证书编号：每次打开页面随机生成一次，后续盖章/重开护照不再变动 */
    const certNo = String(Math.floor(1000 + Math.random() * 9000));
    function renderPassport() {
      const stamps = document.getElementById('vrStamps');
      const count = visited.size;
      const total = window.HOME_PANOS.length;
      if (stamps) {
        stamps.innerHTML = window.HOME_PANOS.map(function (p, i) {
          return '<div class="vr-stamp ' + (visited.has(i) ? 'is-on' : '') + '"><b>' + p.name + '</b>' + p.city + '</div>';
        }).join('');
      }
      const c = document.getElementById('vrPassportCount');
      if (c) c.textContent = count;
      if (mini) mini.textContent = count + '/' + total;
      const cc = document.getElementById('vrCertCount');
      if (cc) cc.textContent = count;
      const no = document.getElementById('vrCertNo');
      if (no) no.textContent = certNo;
      const cert = document.getElementById('vrCert');
      if (cert) cert.classList.toggle('is-unlocked', count >= 5);
      const date = document.getElementById('vrCertDate');
      if (date) {
        const d = new Date();
        date.textContent = d.getFullYear() + '.' + String(d.getMonth() + 1).padStart(2, '0') + '.' + String(d.getDate()).padStart(2, '0');
      }
      const print = document.getElementById('vrPrint');
      if (print) print.disabled = count < 5;
    }
    function stamp(i) {
      if (visited.has(i)) { renderPassport(); return; }
      visited.add(i);
      renderPassport();
      const p = window.HOME_PANOS[i];
      toast('已盖章 · ' + p.city + ' · ' + p.name);
    }
    function openPassport() {
      const m = document.getElementById('vrPassportModal');
      if (!m) return;
      renderPassport();
      m.classList.add('is-open');
      m.style.transition = 'none';
      m.style.opacity = '1';
      m.style.visibility = 'visible';
      m.setAttribute('aria-hidden', 'false');
      document.body.classList.add('is-locked');
    }
    function closePassport() {
      const m = document.getElementById('vrPassportModal');
      if (!m) return;
      m.classList.remove('is-open');
      m.style.transition = 'none';
      m.style.opacity = '0';
      m.style.visibility = 'hidden';
      m.setAttribute('aria-hidden', 'true');
      if (!modal.classList.contains('is-open')) document.body.classList.remove('is-locked');
    }

    /* ---------- voice guide ---------- */
    function stopVoice() {
      if (window.speechSynthesis) window.speechSynthesis.cancel();
      speaking = false;
      if (voiceBtn) { voiceBtn.textContent = '语音讲解'; voiceBtn.classList.remove('is-active'); }
    }
    function toggleVoice() {
      if (!('speechSynthesis' in window)) { toast('当前浏览器不支持语音讲解'); return; }
      if (speaking) { stopVoice(); return; }
      const p = window.HOME_PANOS[index];
      if (!p) return;
      const text = p.city + '，' + p.name + '。' + (p.desc || '');
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'zh-CN';
      u.rate = 0.92;
      u.pitch = 1;
      u.onend = stopVoice;
      u.onerror = stopVoice;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
      speaking = true;
      if (voiceBtn) { voiceBtn.textContent = '停止讲解'; voiceBtn.classList.add('is-active'); }
      toast('开始语音讲解');
    }

    /* ---------- gyroscope ---------- */
    function stopGyro() {
      if (gyroHandler) window.removeEventListener('deviceorientation', gyroHandler, true);
      gyroHandler = null;
      gyroOn = false;
      gyroOffset = null;
      if (gyroBtn) { gyroBtn.textContent = '陀螺仪环视'; gyroBtn.classList.remove('is-active'); }
    }
    async function toggleGyro() {
      if (gyroOn) { stopGyro(); toast('陀螺仪已关闭'); return; }
      if (!window.DeviceOrientationEvent) { toast('当前设备没有陀螺仪'); return; }
      try {
        if (typeof DeviceOrientationEvent.requestPermission === 'function') {
          const r = await DeviceOrientationEvent.requestPermission();
          if (r !== 'granted') { toast('未获得陀螺仪权限'); return; }
        }
        gyroOffset = null;
        gyroHandler = function (e) {
          if (e.alpha == null) return;
          const base = (360 - e.alpha) % 360;
          if (gyroOffset === null) gyroOffset = ((Number(range.value) - base) % 360 + 360) % 360;
          const yaw = (base + gyroOffset) % 360;
          range.value = yaw;
          if (ctl) {
            ctl.setYaw(yaw);
            const pitch = Math.max(-0.75, Math.min(0.75, (e.beta - 90) * Math.PI / 180));
            ctl.setPitch(pitch);
          }
          setAngle(yaw);
        };
        window.addEventListener('deviceorientation', gyroHandler, true);
        gyroOn = true;
        if (gyroBtn) { gyroBtn.textContent = '陀螺仪已开'; gyroBtn.classList.add('is-active'); }
        toast('转动手机即可环视');
      } catch (err) {
        toast('无法启用陀螺仪');
      }
    }

    /* ---------- open / close ---------- */
    function open(i) {
      const item = window.HOME_PANOS[i];
      if (!item) return;
      index = i;
      const myIndex = index;
      stopVoice();
      stopGyro();
      if (title) title.textContent = item.city + ' · ' + item.name;
      if (note) note.textContent = item.city + ' · ' + item.name + ' · 全景加载中…';
      range.value = 0;
      modal.classList.add('is-open');
      modal.style.transition = 'none';
      modal.style.opacity = '1';
      modal.style.visibility = 'visible';
      modal.setAttribute('aria-hidden', 'false');
      document.body.classList.add('is-locked');
      stamp(i);
      if (!ctl) ctl = window.Pano360.create(canvas);
      if (!ctl) {
        if (angle) angle.textContent = '当前浏览器不支持 360°';
        return;
      }
      setTimeout(function () {
        ctl.resize(stage.clientWidth, stage.clientHeight);
        ctl.setPitch(0);
        apply();
        if (item.thumb) ctl.setSource(item.thumb);
        loadSource(item, function (src) {
          if (index !== myIndex) return;
          if (!src) {
            if (note) note.textContent = '这张全景加载失败，请刷新后重试';
            return;
          }
          ctl.setSource(src);
          if (note) note.textContent = item.city + ' · ' + item.name + ' · 高清球面全景 · 左右拖动环视';
        });
        const closeBtn = modal.querySelector('.pano-home-close');
        if (closeBtn) closeBtn.focus();
      }, 80);
    }
    function close() {
      stopVoice();
      stopGyro();
      closePassport();
      modal.classList.remove('is-open');
      modal.style.transition = 'none';
      modal.style.opacity = '0';
      modal.style.visibility = 'hidden';
      modal.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('is-locked');
      const card = cards[index];
      if (card) card.focus();
    }

    cards.forEach(function (card) {
      card.addEventListener('click', function () { open(Number(card.dataset.pano)); });
    });
    modal.querySelectorAll('[data-pano-close]').forEach(function (el) {
      el.addEventListener('click', close);
    });
    if (gyroBtn) gyroBtn.addEventListener('click', toggleGyro);
    if (voiceBtn) voiceBtn.addEventListener('click', toggleVoice);
    const passBtn = document.getElementById('panoPassportBtn');
    if (passBtn) passBtn.addEventListener('click', openPassport);
    const passOpen = document.getElementById('vrPassportOpen');
    if (passOpen) passOpen.addEventListener('click', openPassport);
    document.querySelectorAll('[data-vr-close]').forEach(function (el) {
      el.addEventListener('click', closePassport);
    });
    const print = document.getElementById('vrPrint');
    if (print) print.addEventListener('click', function () {
      document.body.classList.add('is-printing-cert');
      window.print();
    });

    range.addEventListener('input', function () {
      if (gyroOn) stopGyro();
      apply();
    });
    window.addEventListener('resize', function () {
      if (modal.classList.contains('is-open') && ctl) {
        ctl.resize(stage.clientWidth, stage.clientHeight);
        apply();
      }
    });
    window.addEventListener('keydown', function (e) {
      const panoOpen = modal.classList.contains('is-open');
      const passOpenNow = document.getElementById('vrPassportModal').classList.contains('is-open');
      if (!panoOpen && !passOpenNow) return;
      if (e.key === 'Escape') {
        if (passOpenNow) closePassport();
        else close();
      }
      if (!panoOpen || passOpenNow) return;
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        range.value = Math.max(0, Number(range.value) - 6);
        apply();
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        range.value = Math.min(360, Number(range.value) + 6);
        apply();
      }
    });
    stage.addEventListener('pointerdown', function (e) {
      if (!ctl) return;
      if (gyroOn) stopGyro();
      drag = true; sx = e.clientX; sy = e.clientY;
      startYaw = Number(range.value);
      startPitch = ctl.getPitch();
      try { stage.setPointerCapture(e.pointerId); } catch (err) {}
    });
    stage.addEventListener('pointermove', function (e) {
      if (!drag || !ctl) return;
      const yaw = startYaw - ((e.clientX - sx) / stage.clientWidth) * 360;
      range.value = ((yaw % 360) + 360) % 360;
      ctl.setYaw(Number(range.value));
      ctl.setPitch(startPitch + ((e.clientY - sy) / stage.clientHeight) * 0.9);
      setAngle(range.value);
    });
    stage.addEventListener('pointerup', function (e) {
      drag = false;
      try { stage.releasePointerCapture(e.pointerId); } catch (err) {}
    });
    stage.addEventListener('pointercancel', function () { drag = false; });

    renderPassport();
  }

  /* 打印证书：按钮或 Ctrl+P 都只输出证书那一页（配合 CSS 的 body.is-printing-cert） */
  window.addEventListener('beforeprint', function () {
    const m = document.getElementById('vrPassportModal');
    if (m && m.classList.contains('is-open')) document.body.classList.add('is-printing-cert');
  });
  window.addEventListener('afterprint', function () {
    document.body.classList.remove('is-printing-cert');
  });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
