(()=>{
window.LESSONS=window.LESSONS||{};
if(window.LESSON7){
  window.LESSONS[7]={title:'部屋が4つあります',topic:'家と職場',words:window.LESSON7.words||[],sentences:window.LESSON7.sentences||[]};
}
const LESSON_ICONS={1:'🌅',2:'💬',3:'🤝',4:'👨‍👩‍👧',5:'🍜',6:'🍔',7:'🏠'};
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
let currentLesson=Number(localStorage.getItem('irodoriCurrentLessonV10')||7);
if(!window.LESSONS[currentLesson])currentLesson=7;
let mode='words',group='全部',deferredPrompt=null,quiz=[],qi=0,score=0,answered=false;

const learned=new Set(JSON.parse(localStorage.getItem('irodoriLearnedV10')||'[]'));
if(!localStorage.getItem('irodoriMigratedV10')){
  try{
    const old=JSON.parse(localStorage.getItem('irodoriLearnedV3')||'[]');
    old.forEach(k=>learned.add('7|'+k));
    localStorage.setItem('irodoriMigratedV10','1');
    localStorage.setItem('irodoriLearnedV10',JSON.stringify([...learned]));
  }catch(e){}
}

function lesson(){return window.LESSONS[currentLesson]||{title:'',topic:'',words:[],sentences:[]}}
function words(){return lesson().words||[]}
function sentences(){return lesson().sentences||[]}
function id(type,x){return currentLesson+'|'+type+'|'+x.jp}
function save(){localStorage.setItem('irodoriLearnedV10',JSON.stringify([...learned]));progress()}
function currentLearnedCount(){
  const prefix=currentLesson+'|';
  return [...learned].filter(k=>k.startsWith(prefix)).length;
}
function progress(){
  const total=words().length+sentences().length,n=currentLearnedCount();
  $('#bar').style.width=(total? n/total*100:0)+'%';
  $('#ptext').textContent=n+' / '+total;
}
function speak(text){
  if(!('speechSynthesis'in window)){alert('這個瀏覽器不支援語音朗讀');return}
  const synth=window.speechSynthesis;synth.cancel();
  const u=new SpeechSynthesisUtterance(text);u.lang='ja-JP';u.rate=.8;u.pitch=1;
  const voices=synth.getVoices();const ja=voices.find(v=>/^ja/i.test(v.lang));if(ja)u.voice=ja;
  u.onerror=()=>{$('#soundStatus').textContent='播放失敗，請再按一次或重新整理頁面。'};
  u.onstart=()=>{$('#soundStatus').textContent='正在播放日文發音…'};
  u.onend=()=>{$('#soundStatus').textContent='發音正常 ✓'};
  setTimeout(()=>synth.speak(u),80);
}
function show(sel){$$('.screen').forEach(x=>x.classList.remove('active'));$(sel).classList.add('active');window.scrollTo(0,0)}
function setNav(n){$$('.nav button').forEach(b=>b.classList.toggle('active',b.dataset.nav===n))}
function all(){return[...words().map(x=>({...x,type:'word'})),...sentences().map(x=>({...x,type:'sentence'}))]}
function lessonLabel(){return 'LESSON '+String(currentLesson).padStart(2,'0')}

function renderLessonTabs(){
  let box=$('#lessonTabs');
  if(!box){
    box=document.createElement('div');box.id='lessonTabs';box.className='lesson-tabs';
    $('.top').insertAdjacentElement('afterend',box);
  }
  box.innerHTML='';
  for(let n=1;n<=7;n++){
    const l=window.LESSONS[n];if(!l)continue;
    const b=document.createElement('button');b.type='button';b.className='lesson-tab'+(n===currentLesson?' active':'');
    b.innerHTML='<span class="lesson-tab-icon">'+(LESSON_ICONS[n]||'📘')+'</span><span>第'+n+'課</span>';
    b.setAttribute('aria-label','切換到第'+n+'課 '+l.title);
    b.addEventListener('click',()=>switchLesson(n));
    box.appendChild(b);
  }
  const active=box.querySelector('.active');if(active)active.scrollIntoView({behavior:'smooth',block:'nearest',inline:'center'});
}
function updateHome(){
  const l=lesson();
  $('.hero .eyebrow').textContent=lessonLabel();
  $('.hero h2').textContent=l.title;
  $('.hero p').textContent=l.topic+'｜'+words().length+' 個單字・'+sentences().length+' 個句子';
  $('.hero').style.setProperty('--hero-icon','"'+(LESSON_ICONS[currentLesson]||'📘')+'"');
  const studyMeta=$('#study .head small');if(studyMeta)studyMeta.textContent=lessonLabel();
  const quizMeta=$('#quizScreen .head small');if(quizMeta)quizMeta.textContent=lessonLabel();
  const wsmall=$('[data-open="words"] small');if(wsmall)wsmall.textContent=words().length+' 個單字＋圖示＋發音';
  const ssmall=$('[data-open="sentences"] small');if(ssmall)ssmall.textContent=sentences().length+' 個重點句子＋發音';
  const qsmall=$('[data-open="quiz"] small');if(qsmall)qsmall.textContent='從第'+currentLesson+'課隨機 10 題';
  renderLessonTabs();progress();
}
function switchLesson(n){
  if(!window.LESSONS[n])return;
  currentLesson=n;localStorage.setItem('irodoriCurrentLessonV10',String(n));
  mode='words';group='全部';$('#search').value='';
  if('speechSynthesis'in window)window.speechSynthesis.cancel();
  updateHome();show('#home');setNav('home');
}
function openStudy(m){
  mode=m;group='全部';$('#search').value='';
  $('#studyTitle').textContent=m==='words'?'單字':m==='sentences'?'句子':'已學會';
  renderChips();renderCards();show('#study');setNav(m==='words'?'words':'home');
}
function studyItems(){
  let data=mode==='words'?words().map(x=>({...x,type:'word'})):mode==='sentences'?sentences().map(x=>({...x,type:'sentence'})):all().filter(x=>learned.has(id(x.type,x)));
  const q=$('#search').value.trim().toLowerCase();
  if(group!=='全部')data=data.filter(x=>x.group===group);
  if(q)data=data.filter(x=>[x.jp,x.kana,x.zh,x.group,x.note].filter(Boolean).some(v=>String(v).toLowerCase().includes(q)));
  return data;
}
function renderChips(){
  let data=mode==='words'?words():mode==='sentences'?sentences():all();
  const gs=['全部',...new Set(data.map(x=>x.group).filter(Boolean))];
  $('#chips').innerHTML='';
  gs.forEach(g=>{
    const b=document.createElement('button');b.className='chip'+(g===group?' active':'');b.textContent=g;
    b.addEventListener('click',()=>{group=g;renderChips();renderCards()});$('#chips').appendChild(b);
  });
}
function renderCards(){
  const data=studyItems(),box=$('#cards');box.innerHTML='';
  $('#studyCount').textContent=data.length+' 筆';$('#empty').style.display=data.length?'none':'block';
  data.forEach(x=>{
    const k=id(x.type,x),done=learned.has(k),c=document.createElement('article');c.className='card';
    const top=document.createElement('div');top.className='cardtop';
    const vis=document.createElement('button');vis.type='button';vis.className='visual';vis.textContent=x.emoji||'🌸';
    vis.setAttribute('aria-label','播放 '+x.jp+' 的日文發音');vis.title='點圖聽發音';vis.addEventListener('click',()=>speak(x.kana||x.jp));
    const text=document.createElement('div');text.innerHTML='<div class="jp"></div><div class="kana"></div><div class="zh"></div><span class="tag"></span>';
    text.querySelector('.jp').textContent=x.jp;text.querySelector('.kana').textContent=x.kana||'';text.querySelector('.zh').textContent=x.zh||'';text.querySelector('.tag').textContent=x.group||'';
    const sp=document.createElement('button');sp.className='speak';sp.textContent='🔊';sp.setAttribute('aria-label','播放日文發音');sp.addEventListener('click',()=>speak(x.kana||x.jp));
    top.append(vis,text,sp);
    const bottom=document.createElement('div');bottom.className='cardbottom';
    const learn=document.createElement('button');learn.className='learn'+(done?' done':'');learn.textContent=done?'✓ 已學會':'標記學會';
    learn.addEventListener('click',()=>{learned.has(k)?learned.delete(k):learned.add(k);save();renderCards()});bottom.appendChild(learn);
    if(x.note){const n=document.createElement('div');n.className='note';n.textContent=x.note;bottom.appendChild(n)}
    c.append(top,bottom);box.appendChild(c);
  });
}
function shuffle(a){return[...a].sort(()=>Math.random()-.5)}
function startQuiz(){
  const count=Math.min(10,words().length);quiz=shuffle(words()).slice(0,count);qi=0;score=0;answered=false;
  renderQuiz();show('#quizScreen');setNav('quiz');
}
function renderQuiz(){
  const box=$('#quizBox');box.innerHTML='';$('#scoreText').textContent=score+' / '+quiz.length;
  if(qi>=quiz.length){
    const r=document.createElement('div');r.className='result';
    r.innerHTML='<div style="font-size:48px">🎉</div><div class="big">'+score+' / '+quiz.length+'</div><p>'+(score>=Math.ceil(quiz.length*.8)?'很棒，第'+currentLesson+'課開始熟了！':'再跑一次，你會記得更多。')+'</p>';
    const b=document.createElement('button');b.className='primary';b.textContent='再測一次';b.addEventListener('click',startQuiz);r.appendChild(b);box.appendChild(r);return;
  }
  const q=quiz[qi];const art=document.createElement('button');art.type='button';art.className='qart';art.textContent=q.emoji||'🌸';art.setAttribute('aria-label','播放 '+q.jp+' 的日文發音');art.addEventListener('click',()=>speak(q.kana||q.jp));
  const meta=document.createElement('div');meta.className='qmeta';meta.textContent='第 '+(qi+1)+' 題 · 選出中文意思';
  const jp=document.createElement('div');jp.className='qjp';jp.textContent=q.jp;
  const ans=document.createElement('div');ans.className='answers';
  const pool=words().filter(x=>x.jp!==q.jp);const opts=shuffle([q,...shuffle(pool).slice(0,3)]);let next;
  opts.forEach(o=>{
    const b=document.createElement('button');b.className='answer';b.textContent=o.zh;
    b.addEventListener('click',()=>{
      if(answered)return;answered=true;[...ans.children].forEach(btn=>{if(btn.textContent===q.zh)btn.classList.add('correct')});
      if(o.zh===q.zh)score++;else b.classList.add('wrong');$('#scoreText').textContent=score+' / '+quiz.length;next.style.display='block';
    });ans.appendChild(b);
  });
  const actions=document.createElement('div');actions.className='qactions';
  const audio=document.createElement('button');audio.className='secondary';audio.textContent='🔊 發音';audio.addEventListener('click',()=>speak(q.kana||q.jp));
  next=document.createElement('button');next.className='primary';next.textContent=qi===quiz.length-1?'看結果':'下一題';next.style.display='none';next.addEventListener('click',()=>{qi++;answered=false;renderQuiz()});
  actions.append(audio,next);box.append(art,meta,jp,ans,actions);
}

$('#testSound').addEventListener('click',()=>speak('こんにちは'));
$$('[data-open]').forEach(b=>b.addEventListener('click',()=>b.dataset.open==='quiz'?startQuiz():openStudy(b.dataset.open)));
$('#back').addEventListener('click',()=>{show('#home');setNav('home')});
$('#quizBack').addEventListener('click',()=>{show('#home');setNav('home')});
$('#search').addEventListener('input',renderCards);
$$('.nav button').forEach(b=>b.addEventListener('click',()=>{
  const n=b.dataset.nav;if(n==='home'){show('#home');setNav('home')}else if(n==='words')openStudy('words');else startQuiz();
}));
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredPrompt=e;$('#installStatus').textContent='這支手機可以直接安裝 APP。'});
$('#installBtn').addEventListener('click',async()=>{
  if(deferredPrompt){deferredPrompt.prompt();await deferredPrompt.userChoice;deferredPrompt=null}else{$('#installHelp').classList.toggle('show')}
});
if('serviceWorker'in navigator){
  navigator.serviceWorker.register('./sw.js?v=10').then(r=>r.update()).catch(()=>{});
  if('caches'in window)caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('irodori-')&&k!=='irodori-v10').map(k=>caches.delete(k))));
}
updateHome();
})();