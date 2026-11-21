/* Mascot interactive classroom: mini quiz, reading cards, shortcuts */
(function () {
  'use strict';

  const READ = [
    {
      tag: '草原 · GRASSLAND',
      title: '草原上的河，为什么总是弯的？',
      text: '草原地势平缓，河流没有山谷约束，一点小小的起伏就会让水流改道。莫尔格勒河因此弯出一道又一道曲线，被称为“天下第一曲水”。',
      link: 'cities/hulunbuir.html',
      more: '去呼伦贝尔看看 →'
    },
    {
      tag: '沙漠 · DESERT',
      title: '巴丹吉林的沙山为什么那么高？',
      text: '沙山不是一堆散沙。风向、沙粒粗细和地下水位共同作用，让沙丘一层层长高。巴丹吉林的沙山与湖泊相邻，是阿拉善最奇特的地貌组合。',
      link: 'cities/alxa.html',
      more: '去阿拉善看看 →'
    },
    {
      tag: '召庙 · TEMPLE',
      title: '召庙的金顶，为什么在草原上那么亮？',
      text: '金顶多为鎏金铜瓦，草原空气通透、天空开阔，阳光一照就格外醒目。白墙、金顶、红墙与蓝天形成强烈的色彩秩序，也是青城召庙最容易被记住的样子。',
      link: 'cities/hohhot.html',
      more: '去呼和浩特看看 →'
    },
    {
      tag: '非遗 · HERITAGE',
      title: '长调为什么没有固定节拍？',
      text: '长调跟着呼吸、风和情绪走。歌者可以自由延长乐句，用诺古拉颤音装饰旋律。它不是“唱错拍”，而是把时间交给草原。',
      link: 'index.html#heritage',
      more: '去非遗图谱听听 →'
    }
  ];

  function init() {
    const modal = document.getElementById('mascotModal');
    const quizBox = document.getElementById('mascotQuiz');
    const readBox = document.getElementById('mascotRead');
    const opener = document.getElementById('mascotOpen');
    const hint = document.getElementById('mascotHint');
    if (!modal || !quizBox) return;

    const QUIZ = window.PANGU_QUIZ || [];
    let mini = [], mi = 0, score = 0, locked = false;

    function shuffle(arr) {
      const a = arr.slice();
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    }
    function buildMini() {
      return shuffle(QUIZ).slice(0, 3).map(function (item) {
        const opts = shuffle(item.opts.map(function (text, i) {
          return { text: text, ok: i === item.a };
        }));
        return {
          q: item.q,
          opts: opts.map(function (o) { return o.text; }),
          a: opts.findIndex(function (o) { return o.ok; }),
          note: item.note
        };
      });
    }
    function startMini() {
      if (!QUIZ.length) {
        quizBox.innerHTML = '<p class="mascot-go-note">题库还没加载好，先去“带我去逛”看看地图吧。</p>';
        return;
      }
      mini = buildMini();
      mi = 0;
      score = 0;
      locked = false;
      renderQuiz();
    }
    function renderQuiz() {
      if (mi >= mini.length) return renderResult();
      const q = mini[mi];
      locked = false;
      quizBox.innerHTML = '<div class="mascot-quiz-top"><span>第 ' + (mi + 1) + ' / 3 题</span><span>答对 ' + score + ' 题</span></div>' +
        '<div class="mascot-quiz-q">' + q.q + '</div>' +
        '<div class="mascot-opts">' + q.opts.map(function (o, i) {
          return '<button class="mascot-opt" type="button" data-i="' + i + '">' + String.fromCharCode(65 + i) + ' · ' + o + '</button>';
        }).join('') + '</div>' +
        '<div class="mascot-quiz-foot"><span>选一个答案，蒙益行会告诉你为什么。</span></div>';
      quizBox.querySelectorAll('.mascot-opt').forEach(function (btn) {
        btn.addEventListener('click', function () {
          if (locked) return;
          locked = true;
          const pick = Number(btn.dataset.i);
          const ok = pick === q.a;
          if (ok) score++;
          quizBox.querySelectorAll('.mascot-opt').forEach(function (b, i) {
            if (i === q.a) b.classList.add('is-correct');
            else if (i === pick) b.classList.add('is-wrong');
          });
          const foot = quizBox.querySelector('.mascot-quiz-foot');
          foot.innerHTML = '<span>' + (ok ? '✓ 答对了' : '× 再想想') + ' · ' + q.note + '</span><button class="text-link" type="button" id="mascotNext">' + (mi === mini.length - 1 ? '看结果' : '下一题') + ' →</button>';
          const next = document.getElementById('mascotNext');
          if (next) next.addEventListener('click', function () { mi++; renderQuiz(); });
        });
      });
    }
    function renderResult() {
      let title = '从零出发';
      let msg = '没关系，北疆的故事本来就是走出来的。';
      if (score === 3) { title = '北疆小灵通'; msg = '三题全中。你已经可以和蒙益行一起带路了。'; }
      else if (score === 2) { title = '草原熟客'; msg = '差一点全对。再走一座城，就能补上那块拼图。'; }
      else if (score === 1) { title = '刚刚启程'; msg = '第一题就中，说明和北疆有缘。继续走。'; }
      quizBox.innerHTML = '<div class="mascot-quiz-result"><div class="score">' + score + '<span style="font-family:var(--sans);font-size:16px;color:var(--muted)"> / 3</span></div>' +
        '<h3>' + title + '</h3><p>' + msg + '</p>' +
        '<div class="mascot-quiz-actions"><button class="btn btn-dark" type="button" id="mascotAgain">再来三道</button>' +
        '<button class="btn" type="button" id="mascotFull">挑战完整 10 题 →</button></div></div>';
      document.getElementById('mascotAgain').addEventListener('click', startMini);
      document.getElementById('mascotFull').addEventListener('click', openFullQuiz);
    }
    function renderRead() {
      if (!readBox) return;
      readBox.innerHTML = READ.map(function (r) {
        return '<a class="mascot-read-card" href="' + r.link + '"><span class="tag">' + r.tag + '</span><h3>' + r.title + '</h3><p>' + r.text + '</p><span class="more">' + r.more + '</span></a>';
      }).join('');
    }
    function open() {
      modal.classList.add('is-open');
      modal.style.transition = 'none';
      modal.style.opacity = '1';
      modal.style.visibility = 'visible';
      modal.setAttribute('aria-hidden', 'false');
      document.body.classList.add('is-locked');
      startMini();
      renderRead();
      const closeBtn = modal.querySelector('.mascot-modal-close');
      if (closeBtn) closeBtn.focus();
    }
    function close() {
      modal.classList.remove('is-open');
      modal.style.transition = 'none';
      modal.style.opacity = '0';
      modal.style.visibility = 'hidden';
      modal.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('is-locked');
      if (opener) opener.focus();
    }
    function openFullQuiz() {
      close();
      setTimeout(function () {
        const btn = document.getElementById('startQuiz');
        if (btn) btn.click();
      }, 120);
    }

    [opener, hint].forEach(function (el) {
      if (!el) return;
      el.addEventListener('click', open);
    });
    if (opener) {
      opener.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); }
      });
    }
    modal.querySelectorAll('[data-mascot-close]').forEach(function (el) {
      el.addEventListener('click', close);
    });
    modal.querySelectorAll('[data-mascot-tab]').forEach(function (tab) {
      tab.addEventListener('click', function () {
        modal.querySelectorAll('[data-mascot-tab]').forEach(function (t) { t.classList.remove('is-active'); });
        tab.classList.add('is-active');
        const key = tab.dataset.mascotTab;
        modal.querySelectorAll('[data-mascot-panel]').forEach(function (p) {
          p.classList.toggle('is-active', p.dataset.mascotPanel === key);
        });
        if (key === 'read') renderRead();
      });
    });
    const full = document.getElementById('mascotFullQuiz');
    if (full) full.addEventListener('click', openFullQuiz);
    window.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && modal.classList.contains('is-open')) close();
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
