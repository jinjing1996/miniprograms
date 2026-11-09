/* ================== 模拟数据 ================== */
const mockStory = {
  title: '小兔子的月亮之旅',
  pages: [
    {
      image: 'assets/story/p1.jpg',
      sentences: [
        { text: '从前,有一只爱做梦的小兔子。', pinyin: 'cóng qián, yǒu yì zhī ài zuò mèng de xiǎo tù zi.' },
        { text: '每天晚上,它都抬头看着天上的月亮。', pinyin: 'měi tiān wǎn shang, tā dōu tái tóu kàn zhe tiān shàng de yuè liang.' },
        { text: '"月亮上会有什么呢?"小兔子想。', pinyin: '"yuè liang shàng huì yǒu shén me ne?" xiǎo tù zi xiǎng.' },
      ],
    },
    {
      image: 'assets/story/p2.jpg',
      sentences: [
        { text: '小兔子找来一个大纸箱,做成了火箭。', pinyin: 'xiǎo tù zi zhǎo lái yí gè dà zhǐ xiāng, zuò chéng le huǒ jiàn.' },
        { text: '它深吸一口气,勇敢地按下了按钮。', pinyin: 'tā shēn xī yì kǒu qì, yǒng gǎn de àn xià le àn niǔ.' },
        { text: '"嗖——"火箭飞上了夜空!', pinyin: '"sōu——" huǒ jiàn fēi shàng le yè kōng!' },
      ],
    },
    {
      image: 'assets/story/p3.jpg',
      sentences: [
        { text: '月亮上住着一位温柔的月亮奶奶。', pinyin: 'yuè liang shàng zhù zhe yí wèi wēn róu de yuè liang nǎi nai.' },
        { text: '她请小兔子吃了香甜的星星饼干。', pinyin: 'tā qǐng xiǎo tù zi chī le xiāng tián de xīng xing bǐng gān.' },
        { text: '小兔子发现,黑夜一点也不可怕。', pinyin: 'xiǎo tù zi fā xiàn, hēi yè yì diǎn yě bù kě pà.' },
      ],
    },
    {
      image: 'assets/story/p4.jpg',
      sentences: [
        { text: '回家的时候,小兔子带回了一颗小星星。', pinyin: 'huí jiā de shí hou, xiǎo tù zi dài huí le yì kē xiǎo xīng xing.' },
        { text: '它把星星挂在窗前,再也不怕黑了。', pinyin: 'tā bǎ xīng xing guà zài chuāng qián, zài yě bú pà hēi le.' },
        { text: '晚安,勇敢的小兔子。', pinyin: 'wǎn ān, yǒng gǎn de xiǎo tù zi.' },
      ],
    },
  ],
};

const state = {
  keywords: [],
  page: 0,          // 故事当前页
  readIdx: 0,       // 跟读当前句
  listening: false,
};

const $ = (s) => document.querySelector(s);
const $$ = (s) => Array.from(document.querySelectorAll(s));

/* ================== 页面切换 ================== */
function go(id) {
  $$('.page').forEach((p) => p.classList.toggle('active', p.id === id));
  const showTab = id === 'page-home' || id === 'page-library' || id === 'page-profile';
  $('#tabbar').classList.toggle('hidden', !showTab);
  $$('.tab').forEach((t) => t.classList.toggle('active', t.dataset.go === id));
  stopSpeak();
  if (id === 'page-story') renderStory();
  if (id === 'page-read') renderRead();
}
document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-go]');
  if (el) go(el.dataset.go);
});

/* ================== 首页:关键词 & 短语 ================== */
function renderTags() {
  $$('.chip[data-chip]').forEach((c) => c.classList.toggle('active', state.keywords.includes(c.dataset.chip)));
  $('#kw-count').textContent = `${state.keywords.length}/5`;
}
function toggleKeyword(k) {
  const i = state.keywords.indexOf(k);
  if (i > -1) state.keywords.splice(i, 1);
  else if (state.keywords.length < 5) state.keywords.push(k);
  else return alert('最多选择 5 个关键词哦');
  renderTags();
}
$('#chip-group').addEventListener('click', (e) => {
  const c = e.target.closest('.chip[data-chip]');
  if (c) toggleKeyword(c.dataset.chip);
});
// 自定义关键词:点「+ 自定义」变成输入框,回车后生成新 chip
const kwInput = $('#kw-input');
const chipAdd = $('#chip-add');
chipAdd.addEventListener('click', () => {
  chipAdd.hidden = true;
  kwInput.hidden = false;
  kwInput.focus();
});
function closeKwInput() {
  kwInput.value = '';
  kwInput.hidden = true;
  chipAdd.hidden = false;
}
kwInput.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') return closeKwInput();
  if (e.key !== 'Enter') return;
  const v = kwInput.value.trim();
  if (v) {
    if (!$(`.chip[data-chip="${v}"]`)) {
      const b = document.createElement('button');
      b.className = 'chip';
      b.dataset.chip = v;
      b.textContent = v;
      chipAdd.before(b);
    }
    if (!state.keywords.includes(v)) toggleKeyword(v);
  }
  closeKwInput();
});
kwInput.addEventListener('blur', closeKwInput);

$('#phrase').addEventListener('input', (e) => {
  $('#phrase-count').textContent = `${e.target.value.length}/60`;
});
const inspirations = [
  '小兔子想去月亮上看看,但它害怕黑夜',
  '恐龙学会了和朋友分享玩具',
  '海底的小鱼迷路了,要找妈妈',
  '不爱睡觉的公主遇见了梦精灵',
  '宇航员在森林里捡到一颗会说话的星星',
];
let inspireIdx = 0;
$('#btn-inspire').addEventListener('click', () => {
  $('#phrase').value = inspirations[inspireIdx++ % inspirations.length];
  $('#phrase').dispatchEvent(new Event('input'));
});

/* ================== 用户喜好(持久化,只设一次) ================== */
const PREF_KEY = 'cs_prefs';
const defaultPrefs = { age: '2-5岁', len: '短篇', style: '蜡笔童趣' };
const prefs = Object.assign({}, defaultPrefs, JSON.parse(localStorage.getItem(PREF_KEY) || '{}'));

function savePrefs() { localStorage.setItem(PREF_KEY, JSON.stringify(prefs)); }
// 把 prefs 同步到所有 [data-pref] 选择器(我的页 + 引导页)和首页摘要
function renderPrefs() {
  $$('[data-pref]').forEach((group) => {
    const v = prefs[group.dataset.pref];
    group.querySelectorAll('[data-v]').forEach((b) => b.classList.toggle('active', b.dataset.v === v));
  });
  $('#profile-sub').textContent = `${prefs.age} · 已创作 12 个故事`;
}
$$('[data-pref]').forEach((group) =>
  group.addEventListener('click', (e) => {
    const b = e.target.closest('[data-v]');
    if (!b) return;
    prefs[group.dataset.pref] = b.dataset.v;
    savePrefs();
    renderPrefs();
  })
);

/* ================== 首次引导 ================== */
const GUIDE_KEY = 'cs_guided';
const onboard = $('#onboard');
let obStep = 0;
function showOnboard() {
  obStep = 0;
  onboard.hidden = false;
  renderOnboard();
}
function renderOnboard() {
  $$('.ob-step').forEach((s) => s.classList.toggle('active', +s.dataset.step === obStep));
  $$('.ob-dots i').forEach((d, i) => d.classList.toggle('active', i === obStep));
  const last = obStep === 2;
  $('#ob-next span').textContent = last ? '开始创作' : '下一步';
  $('#ob-next .ic').style.display = last ? 'none' : '';
  $('#ob-skip').style.visibility = last ? 'hidden' : 'visible';
}
function finishOnboard() {
  localStorage.setItem(GUIDE_KEY, '1');
  savePrefs();
  onboard.hidden = true;
}
$('#ob-next').addEventListener('click', () => { if (obStep < 2) { obStep++; renderOnboard(); } else finishOnboard(); });
$('#ob-skip').addEventListener('click', finishOnboard);
$('#btn-replay-guide').addEventListener('click', showOnboard);

/* ================== 生成流程(模拟) ================== */
$('#btn-generate').addEventListener('click', () => {
  if (!state.keywords.length && !$('#phrase').value.trim()) {
    return alert('先选几个关键词,或写一句话描述吧~');
  }
  go('page-loading');
  runLoading();
});

function runLoading() {
  const steps = $$('#loading-steps li');
  const titles = ['正在构思故事…', '正在绘制插画…', '正在录制朗读…', '马上就好!'];
  const subs = ['魔法师正在翻阅童话书', '画家正在调颜色', '朗读员正在清嗓子', '故事书正在装订'];
  let i = 0;
  const bar = $('#loading-bar');
  const tick = () => {
    if (!$('#page-loading').classList.contains('active')) return; // 已取消
    steps.forEach((li, idx) => {
      li.className = idx < i + 1 ? 'done' : idx === i + 1 ? 'doing' : '';
    });
    $('#loading-title').textContent = titles[i];
    $('#loading-sub').textContent = subs[i];
    bar.style.width = `${(i + 1) * 25}%`;
    i++;
    if (i < 4) setTimeout(tick, 900);
    else setTimeout(() => { state.page = 0; go('page-story'); }, 600);
  };
  // 重置
  bar.style.width = '0';
  steps.forEach((li, idx) => { li.className = idx === 0 ? 'doing' : ''; });
  tick();
}

/* ================== 故事页 ================== */
function renderStory() {
  const p = mockStory.pages[state.page];
  $('#story-title').textContent = mockStory.title;
  $('#illu-img').src = p.image;
  $('#page-badge').textContent = `${state.page + 1} / ${mockStory.pages.length}`;
  $('#dots').innerHTML = mockStory.pages.map((_, i) => `<i class="${i === state.page ? 'active' : ''}"></i>`).join('');
  $('#story-text').innerHTML = p.sentences
    .map((s, i) => `<span class="sent" data-i="${i}">${s.text}</span>`)
    .join('');
  $('#btn-prev').disabled = state.page === 0;
  $('#btn-prev').style.opacity = state.page === 0 ? 0.4 : 1;
  const last = state.page === mockStory.pages.length - 1;
  $('#btn-next span').textContent = last ? '读完啦' : '下一页';
  $('#btn-next .ic').style.display = last ? 'none' : '';
  $('#btn-listen').classList.remove('on');
}
$('#btn-prev').addEventListener('click', () => { if (state.page > 0) { state.page--; renderStory(); } });
$('#btn-next').addEventListener('click', () => {
  if (state.page < mockStory.pages.length - 1) { state.page++; renderStory(); }
  else go('page-library');
});
$('#story-text').addEventListener('click', (e) => {
  const s = e.target.closest('.sent');
  if (s) speakSentence(+s.dataset.i);
});
$('#btn-listen').addEventListener('click', () => {
  if (state.listening) return stopSpeak();
  playPage(0);
});
$('#btn-fav').addEventListener('click', (e) => {
  e.currentTarget.classList.toggle('on');
});
// 换插画:模拟重新生成(淡出 → 等待 → 淡入同一张)
$('.regen-btn').addEventListener('click', () => {
  const illu = $('#illustration');
  if (illu.classList.contains('loading')) return;
  illu.classList.add('loading');
  setTimeout(() => illu.classList.remove('loading'), 1500);
});

/* ================== 语音(Web Speech 模拟 TTS) ================== */
function speak(text, onend) {
  if (!('speechSynthesis' in window)) { setTimeout(onend, text.length * 180); return; }
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'zh-CN'; u.rate = 0.85; u.pitch = 1.15;
  u.onend = onend; u.onerror = onend;
  speechSynthesis.speak(u);
}
function stopSpeak() {
  state.listening = false;
  if ('speechSynthesis' in window) speechSynthesis.cancel();
  $$('.sent').forEach((s) => s.classList.remove('playing'));
  $('#btn-listen').classList.remove('on');
}
function speakSentence(i) {
  stopSpeak();
  const el = $(`.sent[data-i="${i}"]`);
  el && el.classList.add('playing');
  speak(mockStory.pages[state.page].sentences[i].text, () => el && el.classList.remove('playing'));
}
function playPage(i) {
  const sents = mockStory.pages[state.page].sentences;
  if (i >= sents.length) return stopSpeak();
  state.listening = true;
  $('#btn-listen').classList.add('on');
  $$('.sent').forEach((s) => s.classList.toggle('playing', +s.dataset.i === i));
  speak(sents[i].text, () => { if (state.listening) playPage(i + 1); });
}

/* ================== 跟读页 ================== */
function setStars(n) {
  $$('#stars .ic').forEach((s, i) => s.classList.toggle('lit', i < n));
}
function renderRead() {
  const p = mockStory.pages[state.page];
  const s = p.sentences[state.readIdx];
  $('#read-illu').style.backgroundImage = `url(${p.image})`;
  $('#read-sentence').textContent = s.text;
  $('#read-pinyin').textContent = s.pinyin;
  $('#read-progress').textContent = `${state.readIdx + 1}/${p.sentences.length}`;
  setStars(0);
  $('#read-result').classList.remove('good');
  $('#result-text').textContent = '按住麦克风,大声读出来吧!';
}
$('#btn-read-listen').addEventListener('click', () => speak($('#read-sentence').textContent));
$('#btn-read-prev').addEventListener('click', () => { if (state.readIdx > 0) { state.readIdx--; renderRead(); } });
$('#btn-read-next').addEventListener('click', () => {
  const n = mockStory.pages[state.page].sentences.length;
  if (state.readIdx < n - 1) { state.readIdx++; renderRead(); }
  else if (state.page < mockStory.pages.length - 1) { state.page++; state.readIdx = 0; renderRead(); }
  else { alert('🎉 全部跟读完成,太棒了!'); go('page-story'); }
});

// 按住录音(模拟评分)
const mic = $('#btn-mic');
let pressTimer = null, pressStart = 0;
const startRec = (e) => {
  e.preventDefault();
  pressStart = Date.now();
  mic.classList.add('recording');
  mic.querySelector('small').textContent = '松开结束';
  $('#wave').classList.add('on');
  $('#result-text').textContent = '正在聆听…';
};
const stopRec = () => {
  if (!mic.classList.contains('recording')) return;
  mic.classList.remove('recording');
  mic.querySelector('small').textContent = '按住跟读';
  $('#wave').classList.remove('on');
  const dur = Date.now() - pressStart;
  if (dur < 600) { $('#result-text').textContent = '时间太短啦,再试一次~'; return; }
  $('#result-text').textContent = '正在评分…';
  setTimeout(() => {
    const score = Math.min(3, 1 + Math.floor(Math.random() * 3));
    setStars(score);
    $('#read-result').classList.add('good');
    $('#result-text').textContent = ['', '不错,再读清楚一点!', '很棒!发音很标准', '太厉害了,完美!'][score];
  }, 800);
};
mic.addEventListener('mousedown', startRec);
mic.addEventListener('touchstart', startRec, { passive: false });
['mouseup', 'mouseleave', 'touchend', 'touchcancel'].forEach((ev) => mic.addEventListener(ev, stopRec));

/* ================== 初始化 ================== */
renderTags();
renderPrefs();
go('page-home');
if (!localStorage.getItem(GUIDE_KEY)) showOnboard();
