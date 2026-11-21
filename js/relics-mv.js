/* 3D city artifacts with local model-viewer; textures/UV preserved */
(function () {
  'use strict';

  const DATA = [
    { id:'hohhot', city:'呼和浩特', en:'HOHHOT', relic:'嵌贝鹿形青铜镇', link:'cities/hohhot.html',
      desc:'以鹿为形的青铜席镇，器身嵌贝。鹿伏卧回首，既是压席的实用器，也是北方草原与中原工艺交流的实物。', meta:'青铜 · 嵌贝 · 3D 扫描' },
    { id:'baotou', city:'包头', en:'BAOTOU', relic:'马头鹿角金步摇', link:'cities/baotou.html',
      desc:'北魏鲜卑贵族的金步摇。枝杈状鹿角上悬挂摇叶，行走时轻响，是草原贵族头饰中最有动感的一类。', meta:'金 · 北魏鲜卑 · 3D 扫描' },
    { id:'wuhai', city:'乌海', en:'WUHAI', relic:'盘羊铜杖首', link:'cities/wuhai.html',
      desc:'战国时期的盘羊铜杖首。盘羊角卷曲，铸在杖首，是北方草原青铜器常见的动物纹样。', meta:'青铜 · 战国 · 3D 扫描' },
    { id:'chifeng', city:'赤峰', en:'CHIFENG', relic:'红山文化 C 形玉龙', link:'cities/chifeng.html',
      desc:'红山文化 C 形玉龙，被称为“中华第一龙”。龙身弯成 C 字，头部有鬣，玉质温润，是红山文化最具代表性的器物。', meta:'玉 · 红山文化 · 3D 扫描' },
    { id:'tongliao', city:'通辽', en:'TONGLIAO', relic:'陈国公主黄金面具', link:'cities/tongliao.html',
      desc:'辽代陈国公主墓出土的黄金面具，覆盖墓主面部。面具按人脸打造，眉眼、鼻口清晰，是契丹贵族丧葬制度的代表。', meta:'金 · 辽代 · 3D 扫描' },
    { id:'hulunbuir', city:'呼伦贝尔', en:'HULUNBUIR', relic:'鲜卑神兽纹金饰牌', link:'cities/hulunbuir.html',
      desc:'鲜卑神兽纹金饰牌。神兽盘踞在方形牌面上，纹样受到草原动物风格影响，是拓跋鲜卑金银工艺的代表。', meta:'金 · 鲜卑 · 3D 扫描' },
    { id:'bayannur', city:'巴彦淖尔', en:'BAYANNUR', relic:'西夏莲花形金盏托', link:'cities/bayannur.html',
      desc:'西夏莲花形金盏托。托盘做成莲瓣，盏置于中，金银器在佛教供养与贵族生活中都很常见。', meta:'金 · 西夏 · 3D 扫描' },
    { id:'ulanqab', city:'乌兰察布', en:'ULANQAB', relic:'虎衔鹰金饰牌', link:'cities/ulanqab.html',
      desc:'虎衔鹰金饰牌。猛虎咬住鹰颈，动物搏斗的瞬间被压进金片，是草原动物纹最具张力的一类构图。', meta:'金 · 草原动物纹 · 3D 扫描' },
    { id:'hinggan', city:'兴安盟', en:'HINGGAN', relic:'辽代绿釉双孔鸡冠壶', link:'cities/hinggan.html',
      desc:'辽代绿釉双孔鸡冠壶。壶身仿契丹人的皮囊，顶部双孔、提梁如鸡冠，是游牧生活进入陶瓷的样本。', meta:'绿釉陶 · 辽代 · 3D 扫描' },
    { id:'xilingol', city:'锡林郭勒', en:'XILINGOL', relic:'元上都元青花高足杯', link:'cities/xilingol.html',
      desc:'元上都遗址所出元青花高足杯。青花发色浓艳，器形适合马上持握，是草原都城与景德镇窑火相遇的见证。', meta:'青花瓷 · 元代 · 3D 扫描' },
    { id:'alxa', city:'阿拉善', en:'ALXA', relic:'居延汉简', link:'cities/alxa.html',
      desc:'居延汉简出土于额济纳河流域，是汉代边塞屯戍的文书档案。一枚枚木简用绳编连，记录粮草、烽燧与官吏往来。', meta:'木质 · 汉代边塞 · 3D 扫描' },
    { id:'ordos', city:'鄂尔多斯', en:'ORDOS', relic:'鹰顶金冠饰', link:'cities/ordos.html',
      desc:'鄂尔多斯杭锦旗阿鲁柴登出土的鹰顶金冠，是战国时期匈奴贵族的金冠。冠顶立鹰，冠带饰虎马，是草原金属工艺的代表。', meta:'金 · 战国匈奴 · 3D 扫描' }
  ];

  const viewer = document.getElementById('relicViewer');
  if (!viewer) return;
  const status = document.getElementById('relicStatus');
  const list = document.getElementById('relicList');
  const title = document.getElementById('relicTitle');
  const type = document.getElementById('relicType');
  const desc = document.getElementById('relicDesc');
  const meta = document.getElementById('relicMeta');
  const link = document.getElementById('relicLink');
  const counter = document.getElementById('relicCounter');
  const autoBtn = document.getElementById('relicAuto');
  let index = 0, token = 0, loadSeq = 0;

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      const s = document.createElement('script');
      s.src = src;
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }
  function setStatus(text, show) {
    if (!status) return;
    status.textContent = text;
    status.hidden = !show;
  }
  async function loadModel(item) {
    const my = ++token;
    setStatus('正在加载 ' + item.relic + '…', true);
    viewer.classList.remove('is-ready');
    try {
      if (!window.RELIC_MODELS || !window.RELIC_MODELS[item.id]) {
        await loadScript('js/model-' + item.id + '.js');
      }
      if (my !== token) return;
      viewer.src = window.RELIC_MODELS[item.id];
      viewer.alt = item.city + ' · ' + item.relic + ' 3D 模型';
    } catch (err) {
      console.error(err);
      if (my === token) setStatus('模型加载失败：js/model-' + item.id + '.js', true);
    }
  }

  function select(i) {
    index = ((i % DATA.length) + DATA.length) % DATA.length;
    const d = DATA[index];
    title.textContent = d.relic;
    type.textContent = '城市 · ' + d.city;
    desc.textContent = d.desc;
    meta.textContent = d.meta;
    link.href = d.link;
    link.textContent = '进入' + d.city + '页 →';
    counter.textContent = String(index + 1).padStart(2, '0') + ' / ' + DATA.length;
    list.querySelectorAll('button').forEach(function (b, n) { b.classList.toggle('is-active', n === index); });
    const active = list.querySelector('.is-active');
    if (active && active.scrollIntoView) active.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    loadModel(d);
  }

  DATA.forEach(function (d, i) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'relic-item';
    b.innerHTML = '<span>' + String(i + 1).padStart(2, '0') + '</span><b>' + d.relic + '</b><small>' + d.city + ' · ' + d.en + '</small>';
    b.addEventListener('click', function () { select(i); });
    list.appendChild(b);
  });

  viewer.addEventListener('load', function () {
    setStatus('', false);
    viewer.classList.add('is-ready');
  });
  viewer.addEventListener('error', function () {
    setStatus('模型加载失败，请检查 GLB 文件。', true);
  });
  viewer.addEventListener('progress', function (e) {
    if (e.detail && e.detail.totalProgress < 1) {
      setStatus('正在加载 ' + Math.round(e.detail.totalProgress * 100) + '%', true);
    }
  });

  document.getElementById('relicPrev').addEventListener('click', function () { select(index - 1); });
  document.getElementById('relicNext').addEventListener('click', function () { select(index + 1); });
  document.getElementById('relicReset').addEventListener('click', function () {
    viewer.cameraOrbit = '0deg 75deg 140%';
    viewer.fieldOfView = '30deg';
  });
  autoBtn.addEventListener('click', function () {
    const on = !viewer.autoRotate;
    viewer.autoRotate = on;
    autoBtn.classList.toggle('is-on', on);
    autoBtn.textContent = on ? '自动旋转 · 开' : '自动旋转 · 关';
  });

  window.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowLeft') select(index - 1);
    if (e.key === 'ArrowRight') select(index + 1);
  });

  const QP = new URLSearchParams(location.search);
  if (QP.get('auto') === '0') { viewer.autoRotate = false; autoBtn.classList.remove('is-on'); autoBtn.textContent = '自动旋转 · 关'; }
  const startItem = Number(QP.get('item')) || 1;
  select(Math.max(0, Math.min(DATA.length - 1, startItem - 1)));
})();


