/* Interactive route builder: days -> drag cities -> generate itinerary */
(function () {
  'use strict';

  const SPOTS = {
    hohhot: ['大召寺', '塞上老街', '内蒙古博物院'],
    baotou: ['五当召', '美岱召', '赛汗塔拉'],
    wuhai: ['乌海湖', '甘德尔山', '金沙湾'],
    chifeng: ['阿斯哈图石林', '达里诺尔湖', '乌兰布统'],
    tongliao: ['大青沟', '库伦三大寺', '珠日河草原'],
    ordos: ['成吉思汗陵', '响沙湾', '康巴什'],
    hulunbuir: ['莫尔格勒河', '额尔古纳湿地', '呼伦湖'],
    bayannur: ['乌梁素海', '黄河三盛公', '纳林湖'],
    ulanqab: ['乌兰哈达火山', '辉腾锡勒草原', '岱海'],
    hinggan: ['阿尔山天池', '石塘林', '成吉思汗庙'],
    xilingol: ['元上都遗址', '贝子庙', '乌拉盖草原'],
    alxa: ['额济纳胡杨林', '巴丹吉林沙漠', '居延海']
  };
  const THEMES = {
    hohhot: '召庙与青城',
    baotou: '召庙与钢城',
    wuhai: '湖与沙',
    chifeng: '石林与草原',
    tongliao: '科尔沁叙事',
    ordos: '圣陵与沙海',
    hulunbuir: '草原与湿地',
    bayannur: '河套与湖',
    ulanqab: '火山与草原',
    hinggan: '森林与温泉',
    xilingol: '草原与元上都',
    alxa: '胡杨与居延'
  };

  const INFO = {
    hohhot: { station:'呼和浩特东站', rail:'京包客专 · 呼张高铁', airport:'白塔国际机场', heritage:['蒙古族长调民歌','马头琴音乐','烧麦制作技艺'], food:['烧麦','手把肉','奶茶','焙子'] },
    baotou: { station:'包头东站', rail:'京包客专 · 包兰铁路', airport:'包头东河机场', heritage:['二人台','包头剪纸','蒙古族祭火'], food:['莜面','黄河鲤鱼','固阳荞面','羊肉烧麦'] },
    wuhai: { station:'乌海东站', rail:'包兰铁路', airport:'乌海机场', heritage:['烫画','挂毯织造','蒙医沙疗'], food:['乌海葡萄','黄河鱼','羊肉蘸糕','沙葱'] },
    chifeng: { station:'赤峰站', rail:'京通铁路 · 赤喀高铁', airport:'赤峰玉龙机场', heritage:['巴林石雕','宁城皮影','翁牛特刺绣'], food:['对夹','哈达饼','敖汉小米','宁城老窖'] },
    tongliao: { station:'通辽站', rail:'通霍铁路 · 京通铁路', airport:'通辽机场', heritage:['安代舞','乌力格尔','科尔沁版画'], food:['通辽牛肉干','库伦荞面','蒙古馅饼','炒米'] },
    ordos: { station:'鄂尔多斯站', rail:'包西铁路 · 呼鄂动车', airport:'伊金霍洛机场', heritage:['成吉思汗祭典','鄂尔多斯婚礼','鄂尔多斯短调'], food:['手把肉','酸烩菜','碗托','沙葱'] },
    hulunbuir: { station:'海拉尔站', rail:'滨洲铁路', airport:'海拉尔机场', heritage:['鄂温克驯鹿文化','桦树皮制作','蒙古族长调'], food:['手把肉','俄式列巴','蓝莓','奶豆腐'] },
    bayannur: { station:'临河站', rail:'包兰铁路', airport:'巴彦淖尔机场', heritage:['爬山调','乌拉特民歌','河套面塑'], food:['巴盟烩酸菜','黄河鲤鱼','华莱士瓜','河套面食'] },
    ulanqab: { station:'乌兰察布站', rail:'呼张高铁 · 京包客专', airport:'集宁机场', heritage:['阿斯尔','察哈尔服饰','丰镇月饼技艺'], food:['莜面','卓资熏鸡','丰镇月饼','马铃薯'] },
    hinggan: { station:'乌兰浩特站', rail:'白阿铁路', airport:'乌兰浩特机场', heritage:['科尔沁民歌','兴安盟刺绣','树皮画'], food:['阿尔山山珍','兴安大米','烤羊腿','蒙古奶茶'] },
    xilingol: { station:'锡林浩特站', rail:'锡多铁路 · 太锡铁路', airport:'锡林浩特机场', heritage:['蒙古族那达慕','蒙古族搏克','奶制品制作'], food:['锡林郭勒羊肉','奶豆腐','奶茶','手把肉'] },
    alxa: { station:'巴彦浩特站', rail:'临哈铁路', airport:'阿拉善左旗机场', heritage:['阿拉善地毯织造','阿拉善烤全羊','查玛舞'], food:['烤全羊','驼肉','沙葱','居延蜜瓜'] }
  };
  function init() {
    const mapEl = document.getElementById('routeMap');
    const slotsEl = document.getElementById('routeSlots');
    const dayBtns = document.getElementById('routeDayBtns');
    const result = document.getElementById('routeResult');
    if (!mapEl || !slotsEl || !dayBtns || !result || !window.PANGU_MAP) return;

    const cities = window.PANGU_MAP.cities;
    const byId = {};
    cities.forEach(function (c) { byId[c.id] = c; });
    let days = 5;
    let slots = new Array(days).fill(null);

    function selected() {
      return slots.filter(Boolean).map(function (id) { return byId[id]; }).filter(Boolean);
    }
    function renderDayButtons() {
      dayBtns.innerHTML = [2, 3, 4, 5, 6, 7].map(function (n) {
        return '<button type="button" data-days="' + n + '" class="' + (n === days ? 'is-active' : '') + '">' + n + ' 天</button>';
      }).join('');
      dayBtns.querySelectorAll('button').forEach(function (b) {
        b.addEventListener('click', function () {
          setDays(Number(b.dataset.days));
        });
      });
    }
    function setDays(n) {
      days = n;
      const next = new Array(days).fill(null);
      slots.forEach(function (id, i) { if (i < days) next[i] = id; });
      slots = next;
      renderDayButtons();
      renderSlots();
      update();
    }
    function renderMap() {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('viewBox', window.PANGU_MAP.viewBox || '0 0 1000 720');
      svg.setAttribute('class', 'route-map-svg');
      svg.setAttribute('aria-label', '内蒙古十二盟市地图');
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      line.setAttribute('id', 'routeLine');
      line.setAttribute('class', 'route-line');
      cities.forEach(function (c) {
        const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        p.setAttribute('d', c.path);
        p.setAttribute('class', 'route-map-region');
        p.setAttribute('data-city', c.id);
        p.setAttribute('tabindex', '0');
        p.setAttribute('role', 'button');
        p.setAttribute('aria-label', c.name);
        p.setAttribute('draggable', 'true');
        p.addEventListener('keydown', function (e) {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleCity(c.id); }
        });
        svg.appendChild(p);
      });
      svg.appendChild(line);
      svg.addEventListener('click', function (e) {
        const p = e.target.closest ? e.target.closest('.route-map-region') : null;
        if (p) toggleCity(p.dataset.city);
      });
      svg.addEventListener('dragstart', function (e) {
        const p = e.target.closest ? e.target.closest('.route-map-region') : null;
        if (!p) return;
        e.dataTransfer.setData('text/plain', p.dataset.city);
        e.dataTransfer.effectAllowed = 'move';
      });
      cities.forEach(function (c) {
        const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        dot.setAttribute('cx', c.center[0]);
        dot.setAttribute('cy', c.center[1]);
        dot.setAttribute('r', 3.4);
        dot.setAttribute('class', 'route-map-dot');
        svg.appendChild(dot);
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', c.label[0]);
        text.setAttribute('y', c.label[1]);
        text.setAttribute('text-anchor', c.anchor || 'middle');
        text.setAttribute('class', 'route-map-label');
        text.textContent = c.name;
        svg.appendChild(text);
      });
      mapEl.innerHTML = '<span class="route-map-hint">拖动城市到右侧日程，或点击城市加入</span>';
      mapEl.appendChild(svg);
    }
    function toggleCity(id) {
      const at = slots.indexOf(id);
      if (at >= 0) {
        slots[at] = null;
      } else {
        const empty = slots.indexOf(null);
        if (empty >= 0) slots[empty] = id;
        else {
          const hint = mapEl.querySelector('.route-map-hint');
          if (hint) {
            hint.textContent = '日程已满，先移除一天或增加天数';
            hint.classList.add('is-warn');
          }
          return;
        }
      }
      renderSlots();
      update();
    }
    function renderSlots() {
      slotsEl.innerHTML = slots.map(function (id, i) {
        const c = id ? byId[id] : null;
        return '<div class="route-slot ' + (c ? 'is-filled' : '') + '" data-i="' + i + '">' +
          '<span class="slot-day">D' + (i + 1) + '</span>' +
          (c
            ? '<span class="slot-city"><span><b>' + c.name + '</b><small>' + c.en + '</small></span><button type="button" data-remove="' + i + '" aria-label="移除' + c.name + '">×</button></span>'
            : '<span class="slot-empty">拖入城市 / 点击地图</span>') +
          '</div>';
      }).join('');
      slotsEl.querySelectorAll('[data-remove]').forEach(function (b) {
        b.addEventListener('click', function (e) {
          e.stopPropagation();
          slots[Number(b.dataset.remove)] = null;
          renderSlots();
          update();
        });
      });
      slotsEl.querySelectorAll('.route-slot').forEach(function (slot) {
        slot.addEventListener('dragover', function (e) {
          e.preventDefault();
          slot.classList.add('is-over');
        });
        slot.addEventListener('dragleave', function () { slot.classList.remove('is-over'); });
        slot.addEventListener('drop', function (e) {
          e.preventDefault();
          slot.classList.remove('is-over');
          const id = e.dataTransfer.getData('text/plain');
          if (!byId[id]) return;
          const old = slots.indexOf(id);
          if (old >= 0) slots[old] = null;
          slots[Number(slot.dataset.i)] = id;
          renderSlots();
          update();
        });
      });
    }
    function update() {
      const picked = selected();
      const line = document.getElementById('routeLine');
      if (line) {
        line.setAttribute('d', picked.length > 1 ? picked.map(function (c, i) {
          return (i ? 'L' : 'M') + c.center[0] + ' ' + c.center[1];
        }).join(' ') : '');
      }
      document.querySelectorAll('.route-map-region').forEach(function (p) {
        p.classList.toggle('is-picked', slots.indexOf(p.dataset.city) > -1);
      });
      const planDays = document.getElementById('routePlanDays');
      const planCities = document.getElementById('routePlanCities');
      if (planDays) planDays.textContent = days;
      if (planCities) planCities.textContent = picked.length;
      const hint = mapEl.querySelector('.route-map-hint');
      if (hint) {
        hint.classList.toggle('is-hidden', picked.length > 0);
        hint.classList.remove('is-warn');
      }
      result.hidden = true;
    }
    function generate() {
      const picked = selected();
      if (picked.length < 2) {
        result.hidden = false;
        result.innerHTML = '<div class="route-empty"><b>至少选两座城</b><p>从地图上拖 2 座以上的城市到日程里，再生成路线。</p></div>';
        result.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
      const themes = Array.from(new Set(picked.map(function (c) { return THEMES[c.id] || c.alias; })));
      const dayNames = ['第一天', '第二天', '第三天', '第四天', '第五天', '第六天', '第七天'];
      const tomorrow = (function () {
        const d = new Date();
        d.setDate(d.getDate() + 1);
        const pad = function (n) { return String(n).padStart(2, '0'); };
        return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
      })();
      const dayCards = slots.map(function (id, i) {
        if (!id) {
          return '<article class="route-day is-free">' +
            '<div class="route-day-marker"><b>' + String(i + 1).padStart(2, '0') + '</b><span>DAY</span></div>' +
            '<div class="route-day-body"><span class="route-city">机动日 · FREE DAY</span>' +
            '<h4>' + (dayNames[i] || ('第' + (i + 1) + '天')) + ' · 沿途休整</h4>' +
            '<p class="route-day-plan">这一天留给路上、天气或临时发现的小地方。</p></div></article>';
        }
        const c = byId[id];
        const info = INFO[id] || {};
        const detail = (window.ROUTE_DETAIL || {})[id] || null;
        const spots = SPOTS[id] || [];
        const prev = i > 0 ? byId[slots[i - 1]] : null;
        const transport = i === 0
          ? '抵达 ' + c.name + '：' + info.station + '；' + info.rail + '；机场 ' + info.airport + '。'
          : '从 ' + prev.name + ' 到 ' + c.name + '：' + info.station + '；' + info.rail + '。建议动车/普速，远距离可飞；当日车次与耗时以 12306 为准。';
        const rail = prev
          ? 'https://kyfw.12306.cn/otn/leftTicket/init?linktypeid=dc&fs=' +
            encodeURIComponent((INFO[prev.id] || {}).station.replace(/站$/, '')) +
            '&ts=' + encodeURIComponent((info.station || '').replace(/站$/, '')) +
            '&date=' + tomorrow + '&flag=N,N,Y'
          : '';
        const schedule = detail && detail.schedule ? detail.schedule : [
          ['09:00–11:30', spots[0] || c.alias, '上午先看城市最有代表性的一处，慢慢走。'],
          ['12:00', '午餐', (info.food || []).slice(0, 2).join(' / ')],
          ['14:00–16:30', spots[1] || '城市漫步', '下午换一个场景，把上午看到的线索接起来。'],
          ['17:30–19:00', spots[2] || '在地晚餐', '傍晚留给日落和城市日常。'],
          ['19:30', '晚餐', (info.food || []).slice(0, 3).join(' / ')]
        ];
        const scheduleHtml = schedule.map(function (row) {
          return '<div class="schedule-row"><span class="schedule-time">' + row[0] + '</span><div><b>' + row[1] + '</b><p>' + row[2] + '</p></div></div>';
        }).join('');
        return '<article class="route-day">' +
          '<div class="route-day-marker"><b>' + String(i + 1).padStart(2, '0') + '</b><span>DAY</span></div>' +
          '<div class="route-day-body">' +
            '<div class="route-day-top"><span class="route-city">' + c.name + ' · ' + c.en + '</span><h4>' + (dayNames[i] || ('第' + (i + 1) + '天')) + ' · ' + (THEMES[id] || c.alias) + '</h4></div>' +
            '<p class="route-day-plan">' + (detail ? detail.intro : '按一条不赶路的节奏，把这座城最值得看的地方串起来。') + '</p>' +
            '<div class="route-schedule">' + scheduleHtml + '</div>' +
            (detail && detail.note ? '<p class="route-day-note"><b>路线提示 · </b>' + detail.note + '</p>' : '') +
            '<div class="route-day-info">' +
              '<div class="route-focus"><span>研学重点</span><p>' + (detail ? detail.focus : '城市地标与地方文化') + '</p></div>' +
              '<div><span>非遗推荐</span><p>' + (info.heritage || []).join(' · ') + '</p></div>' +
              '<div><span>美食推荐</span><p>' + (info.food || []).join(' · ') + '</p></div>' +
              '<div><span>住宿建议</span><p>' + (detail ? detail.stay : '市区交通便利处') + '</p></div>' +
              '<div class="route-transport"><span>交通建议</span><p>' + transport + '</p>' + (rail ? '<a href="' + rail + '" target="_blank" rel="noopener">查 12306 当日车次与耗时 →</a>' : '') + '</div>' +
            '</div>' +
            '<div class="route-spots">' + spots.map(function (s) { return '<span>' + s + '</span>'; }).join('') + '</div>' +
          '</div></article>';
      }).join('');
      result.innerHTML = '<div class="route-result-head"><span>YOUR STUDY ROUTE</span><h3>' + days + ' 天 · ' + picked.length + ' 座城</h3><p>' + themes.join(' · ') + '</p></div>' +
        '<div class="route-timeline">' + dayCards + '</div>' +
        '<p class="route-result-note">交通为建议路线；车次、时刻与耗时请以 12306 当日查询为准。</p>' +
        '<div class="route-result-actions"><button class="btn btn-dark" type="button" id="routePrint">打印路线</button><button class="btn" type="button" id="routeAgain">重新规划</button></div>';
      result.hidden = false;
      result.scrollIntoView({ behavior: 'smooth', block: 'start' });
      const print = document.getElementById('routePrint');
      if (print) print.addEventListener('click', function () { window.print(); });
      const again = document.getElementById('routeAgain');
      if (again) again.addEventListener('click', function () { document.getElementById('routes').scrollIntoView({ behavior: 'smooth', block: 'start' }); });
    }

    renderDayButtons();
    renderMap();
    renderSlots();
    update();
    document.getElementById('routeGenerate').addEventListener('click', generate);
    document.getElementById('routeClear').addEventListener('click', function () {
      slots = new Array(days).fill(null);
      renderSlots();
      update();
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
