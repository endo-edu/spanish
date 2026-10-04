'use strict';
const D=window.REVIEW_DATA,E=window.ReviewEngine,byId=Object.fromEntries(D.questions.map(q=>[q.id,q]));
const KEY='es-nouns-review-v1';
const state={topic:'gender',view:'learn',steps:{},sessions:{},history:{},settings:{},paused:{},hint:false};
let storageAvailable=true;
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const $=id=>document.getElementById(id),topic=()=>D.topics.find(t=>t.id===state.topic);
const hasPractice=t=>t.practice!==false;
try{
 const raw=JSON.parse(localStorage.getItem(KEY)||'null');
 if(raw?.version===D.version){
  for(const t of D.topics){
   const cfg=raw.settings?.[t.id];
   if(cfg)state.settings[t.id]={count:[5,10,20,'all'].includes(cfg.count)?cfg.count:t.short,direction:['both','plural','singular'].includes(cfg.direction)?cfg.direction:'both',mode:cfg.mode==='write'?'write':'choice'};
   if(hasPractice(t))state.paused[t.id]=raw.paused?.[t.id]===true;
   const s=hasPractice(t)?raw.sessions?.[t.id]:null;
   if(s&&Array.isArray(s.initialIds)&&s.initialIds.length&&Array.isArray(s.roundIds)&&s.roundIds.length&&[...s.initialIds,...s.roundIds,...(s.misses||[])].every(id=>byId[id]?.topic===t.id)&&Number.isInteger(s.index)&&s.index>=0&&s.index<=s.roundIds.length&&Number.isInteger(s.firstCorrect)&&s.firstCorrect>=0&&s.firstCorrect<=s.initialIds.length&&Array.isArray(s.firstResponses))state.sessions[t.id]=s;
   const h=hasPractice(t)?raw.history?.[t.id]:null;if(h&&Number.isInteger(h.score)&&Number.isInteger(h.total)&&h.total>0&&h.score>=0&&h.score<=h.total)state.history[t.id]=h;
   const step=raw.steps?.[t.id];if(Number.isInteger(step)&&step>=0&&step<D.lessons[t.id].length)state.steps[t.id]=step;
  }
  if(D.topics.some(t=>t.id===raw.topic))state.topic=raw.topic;
  if(['learn','practice','words'].includes(raw.view))state.view=raw.view;
 }
}catch{storageAvailable=false;}
if(!hasPractice(topic())&&state.view==='practice')state.view='learn';
function save(){try{localStorage.setItem(KEY,JSON.stringify({version:D.version,topic:state.topic,view:state.view,steps:state.steps,sessions:state.sessions,history:state.history,settings:state.settings,paused:state.paused}));}catch{storageAvailable=false;}}
function btn(label,attrs='',kind=''){return `<button class="btn ${kind}" ${attrs}>${label}</button>`;}
function focusMain(){ $('content').focus({preventScroll:true});$('content').scrollIntoView({behavior:'instant',block:'start'});}
function render(){
 const t=topic(),idx=D.topics.indexOf(t);if(!hasPractice(t)&&state.view==='practice')state.view='learn';$('title').textContent=t.title;$('intro').textContent=t.intro;$('eyebrow').textContent=`LECCIÓN ${String(idx+1).padStart(2,'0')} / 05`;
 $('chapters').innerHTML=D.topics.map((x,i)=>`<button class="chapter ${x.id===state.topic?'active':''}" data-topic="${x.id}" aria-pressed="${x.id===state.topic}"><span class="chapter-no">${String(i+1).padStart(2,'0')}</span>${x.title}${state.history[x.id]?'<span class="visited" aria-label="練習済み">✓</span>':''}</button>`).join('');
 $('views').innerHTML=[['learn','学ぶ'],...(hasPractice(t)?[['practice','練習する']]:[]),['words','語句一覧']].map(([v,label])=>`<button data-view="${v}" class="${state.view===v?'active':''}" aria-pressed="${state.view===v}">${label}</button>`).join('');
 $('content').innerHTML=state.view==='learn'?renderLesson():state.view==='words'?renderWords():renderPractice();
 $('notice').textContent=storageAvailable?'':'このブラウザでは記録を保存できません。この画面を開いている間は練習できます。';
 save();
}
function renderLesson(){
 const all=D.lessons[state.topic],i=state.steps[state.topic]||0,l=all[i];
 return `<section class="lesson-layout"><div class="lesson-copy"><p class="step-label">STEP ${String(i+1).padStart(2,'0')} / ${String(all.length).padStart(2,'0')}</p><h2>${l.title}</h2><p>${l.body}</p><div class="rule" lang="es">${l.rule}</div><p class="note">${l.note}</p></div><div class="example-stage"><p class="stage-label">声に出して、形を確かめよう</p>${l.examples.map(([es,ja],j)=>`<div class="example ${l.examples.length>2?'compact':''}"><div lang="es">${esc(es)}</div><p>${esc(ja)}</p></div>`).join('')}</div></section><div class="lesson-nav"><div class="dots" aria-label="説明のステップ">${all.map((_,j)=>`<button data-step="${j}" class="${i===j?'active':''}" aria-label="説明${j+1}" ${i===j?'aria-current="step"':''}>${j+1}</button>`).join('')}</div><div class="lesson-actions">${btn('前の説明',`data-step="${i-1}" ${i===0?'disabled':''}`)}${i<all.length-1?btn('次の説明 <span aria-hidden="true">→</span>',`data-step="${i+1}"`,'primary'):hasPractice(topic())?btn('練習してみる <span aria-hidden="true">→</span>','data-view="practice"','primary'):btn('語句一覧で確かめる <span aria-hidden="true">→</span>','data-view="words"','primary')}</div></div><aside class="study-note"><span class="study-note-label">復習の目安</span><p>名詞の性の説明を確認 → 名詞の数10問 → 冠詞5問 → 形容詞5問 → まとめ10問。間違えた問題は、もう一度。</p></aside>`;
}
function renderWords(){
 if(state.topic==='adjective')return `<div class="section-intro"><h2>性と数で、変わる形。</h2><p>同じ形が2つの性で使われる場合もあります。</p></div><div class="vocab-grid">${[...D.adjectives,{base:'importante',forms:['importante','importantes'],ja:'重要な'}].map(a=>`<div class="vocab-card"><span class="vocab-label">${esc(a.ja)}</span><strong lang="es">${esc(a.base)}</strong><p class="forms" lang="es">${a.forms.map(esc).join(' · ')}</p></div>`).join('')}</div>`;
 if(state.topic==='mixed')return `<div class="section-intro"><h2>3つの語の、組み合わせ。</h2><p>単数と複数を声に出して、違いを確かめましょう。</p></div><div class="phrase-list">${D.questions.filter(q=>q.topic==='mixed').map(q=>{const sg=q.direction==='plural'?q.stem:q.answer,pl=q.direction==='plural'?q.answer:q.stem;return `<div class="phrase-card"><span class="vocab-label">${esc(q.ja)}</span><div lang="es"><span>${esc(sg)}</span><span class="phrase-arrow">↔</span><span>${esc(pl)}</span></div></div>`;}).join('')}</div>`;
 const pool=D.questions.filter(q=>q.topic===state.topic),selected=D.nouns.filter(n=>state.topic==='gender'?D.genderNounIds.includes(n.id):pool.some(q=>q.stem.includes(n.sg)||q.stem.includes(n.pl)));const seen=new Set();
 return `<div class="section-intro"><h2>冠詞と単数・複数を、一緒に。</h2><p>アクセント符号も含めて、単語の形を確認できます。</p></div><div class="vocab-grid">${selected.filter(n=>{const k=n.sg+n.gender;if(seen.has(k))return false;seen.add(k);return true;}).map(n=>`<div class="vocab-card"><span class="vocab-label">${esc(n.ja)} <span class="gender-tag">${n.gender==='m'?'男性':'女性'}</span></span><strong lang="es">${n.gender==='m'?'el':'la'} ${esc(n.sg)}</strong><p class="forms" lang="es">${n.gender==='m'?'los':'las'} ${esc(n.pl)}</p>${state.topic==='number'?`<small>${D.familyLabels[n.family]}</small>`:''}</div>`).join('')}</div>`;
}
function renderPractice(){
 const s=state.sessions[state.topic];if(s&&!state.paused[state.topic])return s.done?renderResult(s):renderQuestion(s);
 const t=topic(),h=state.history[state.topic],isN=t.id==='number',cfg=state.settings[t.id]||{count:t.short,direction:'both',mode:'choice'};state.settings[t.id]=cfg;
 return `<section class="practice-start"><div class="practice-copy"><p class="step-label">PRACTICAR</p><h2>ひとつずつ、確かめよう。</h2><p>${isN?'語尾とアクセント符号を、単数・複数の両方向から練習します。':'答え合わせでは、正しい形とその理由を確認できます。'}</p><div class="practice-settings"><label>問題数<select id="set-count">${(t.id==='mixed'?[10,'all']:[t.short,t.short===5?10:20,'all']).map(n=>`<option value="${n}" ${String(n)===String(cfg.count)?'selected':''}>${n==='all'?'全問':n+'問'}</option>`).join('')}</select></label>${isN?`<label>変える方向<select id="set-direction"><option value="both" ${cfg.direction==='both'?'selected':''}>単数 ↔ 複数（両方向）</option><option value="plural" ${cfg.direction==='plural'?'selected':''}>単数 → 複数</option><option value="singular" ${cfg.direction==='singular'?'selected':''}>複数 → 単数</option></select></label>`:''}<label>答え方<select id="set-mode"><option value="choice" ${cfg.mode==='choice'?'selected':''}>選んで答える</option><option value="write" ${cfg.mode==='write'?'selected':''}>書いて答える</option></select></label></div>${s?`<p class="resume-note">途中の練習：${s.index+(s.answered?1:0)} / ${s.roundIds.length}問 解答済み</p>${btn('途中の練習を続ける','data-action="resume"','primary start-button')}`:''}${btn(s?'この設定で新しく始める':'練習を始める <span aria-hidden="true">→</span>','data-action="start"',`${s?'':'primary '}start-button`)}${h?`<p class="last-result">前回の初回正答数 <b>${h.score} / ${h.total}</b></p>`:''}</div><div class="practice-preview"><p class="stage-label">${isN?'符号にも、注目。':'名詞の性と数を、手がかりに。'}</p><div lang="es">${isN?'examen<br><span class="preview-arrow">↕</span><br>exámenes':t.id==='gender'?'el libro<br><span class="preview-arrow">/</span><br>la mesa':t.id==='article'?'un · una<br>unos · unas':t.id==='adjective'?'negro · negra<br>negros · negras':'una casa blanca<br><span class="preview-arrow">↕</span><br>unas casas blancas'}</div><p class="note">${isN?'標準10問では、5種類の変化を両方向で練習します。':'間違えた問題だけ、あとからやり直せます。'}</p></div></section>`;
}
function renderQuestion(s){
 const q=byId[s.roundIds[s.index]],correct=E.isCorrect(q,s.selected),isWrite=s.mode==='write';s.optionOrders??={};if(!s.optionOrders[q.id])s.optionOrders[q.id]=E.shuffle(q.options);
 const progress=Math.round(100*(s.index+(s.answered?1:0))/s.roundIds.length);
 const feedback=s.answered?`<section class="feedback ${correct?'success':'miss'}" id="feedback" tabindex="-1" role="status"><p class="feedback-title">${correct?'正解！':'ここを確認しよう。'}</p>${!correct?`<p class="your-answer">君の答え <span lang="es">${esc(s.selected)}</span></p>`:''}<p class="correct-answer" lang="${q.topic==='gender'?'ja':'es'}">${esc(q.answer)}</p><p>${esc(q.explanation)}</p></section>`:'';
 const hintText=q.base?`${q.base} ＝ ${q.meaning}。${q.hint}`:q.hint;
 return `<section class="quiz"><div class="quiz-top"><span>${s.retry?'やり直し':'練習'} <b>${s.index+1}</b> / ${s.roundIds.length}</span><div class="quiz-tools"><button class="text-btn" data-action="settings">練習の設定に戻る</button><button class="text-btn" data-view="learn">説明を見る</button><button class="text-btn" data-action="mode" ${s.answered?'disabled':''}>${isWrite?'選んで答える':'書いて答える'}</button></div></div><div class="progress-track" role="progressbar" aria-label="解答済み問題数" aria-valuemin="0" aria-valuemax="${s.roundIds.length}" aria-valuenow="${s.index+(s.answered?1:0)}"><span style="width:${progress}%"></span></div><div class="quiz-main">${q.topic==='article'?`<p class="article-instruction ${q.group.startsWith('indefinite')?'indefinite':'definite'}">${q.group.startsWith('indefinite')?'不定冠詞':'定冠詞'}<span>を付けよう</span></p>`:`<p class="question-kind">${q.topic==='number'?D.familyLabels[q.family]:q.topic==='mixed'?'冠詞・名詞・形容詞':topic().title}</p><h2>${esc(q.prompt)}</h2>`}<div class="question-word ${q.stem.length>20?'long':''}" lang="es">${esc(q.stem)}</div><p class="question-ja">${esc(q.ja)}</p>${q.base?`<div class="base-word">使う形容詞 <b lang="es">${esc(q.base)}</b><span>${esc(q.meaning)}</span></div>`:''}${isWrite?`<div class="write-area"><label for="written-answer">答えをスペイン語で書く</label><input id="written-answer" lang="${q.topic==='gender'?'ja':'es'}" autocomplete="off" autocapitalize="none" spellcheck="false" value="${esc(s.selected)}" ${s.answered?'disabled':''}><div class="accent-keys" aria-label="特殊文字を入力">${['á','é','í','ó','ú','ñ'].map(c=>`<button data-letter="${c}" ${s.answered?'disabled':''}>${c}</button>`).join('')}</div><p class="input-note">アクセント符号・ñも含めて答えましょう。</p></div>`:`<div class="choices ${q.topic==='mixed'?'phrases':''}" role="group" aria-label="答えの選択肢">${s.optionOrders[q.id].map(v=>`<button class="choice ${s.selected===v?'selected':''} ${s.answered&&v===q.answer?'correct':''} ${s.answered&&s.selected===v&&!correct?'wrong':''}" data-answer="${esc(v)}" aria-pressed="${s.selected===v}" lang="${q.topic==='gender'?'ja':'es'}" ${s.answered?'disabled':''}>${esc(v)}${s.answered&&v===q.answer?'<span class="choice-symbol" aria-hidden="true">✓</span>':''}</button>`).join('')}</div>`}${feedback}<div class="quiz-bottom">${s.answered?btn(s.index+1===s.roundIds.length?'結果を見る':'次の問題 <span aria-hidden="true">→</span>','data-action="next"','primary'):btn('答え合わせ',`data-action="check" ${E.normalize(s.selected)?'':'disabled'}`,'primary')}</div>${!s.answered?`<button class="hint-button" data-action="hint" aria-expanded="${state.hint}">ヒント ${state.hint?'−':'＋'}</button>${state.hint?`<p class="hint-text">${esc(hintText)}</p>`:''}`:''}</div></section>`;
}
function renderResult(s){
 const misses=s.misses.map(id=>byId[id]),nextTopic=D.topics[(D.topics.findIndex(t=>t.id===state.topic)+1)%D.topics.length];
 return `<section class="result"><p class="step-label">${s.retry?'REVISAR':'RESULTADO'}</p><h2>${misses.length?'もう一度、確かめよう。':s.retry?'間違えた問題も、できました。':'すべて正解。よくできました！'}</h2><p class="score-label">最初の解答で正解した数</p><div class="score">${s.firstCorrect}<span> / ${s.initialIds.length}</span></div>${s.retry?`<p class="retry-result">今回のやり直し ${s.roundCorrect} / ${s.roundIds.length}問 正解</p>`:''}<div class="result-actions">${misses.length?btn(`間違えた${misses.length}問をもう一度`,'data-action="retry"','primary'):btn(`${nextTopic.title}へ <span aria-hidden="true">→</span>`,`data-topic="${nextTopic.id}"`,'primary')}${btn('新しい練習','data-action="new"')}</div>${misses.length?`<div class="review-list"><h3>ここを、復習。</h3>${misses.map(q=>`<div class="review-item"><span class="review-stem" lang="es">${esc(q.stem)}</span><span class="review-arrow">→</span><strong lang="es">${esc(q.answer)}</strong><p>${esc(q.explanation)}</p></div>`).join('')}</div>`:'<p class="completion">今取り組んだ問題は、すべて正解を確認できました。</p>'}<p class="result-note">${state.topic==='number'?'単数形と複数形を、両方声に出してみましょう。':'正答を一度、声に出してみましょう。'}</p></section>`;
}
function check(){const s=state.sessions[state.topic];if(!s||s.done)return;const q=byId[s.roundIds[s.index]];if(E.submit(s,q,s.selected)){render();$('feedback').focus({preventScroll:true});}}
function advance(){const s=state.sessions[state.topic];if(!s||!E.next(s))return;state.hint=false;if(s.done&&!s.retry)state.history[state.topic]={score:s.firstCorrect,total:s.initialIds.length,at:Date.now()};render();focusMain();}
document.addEventListener('click',e=>{
 const b=e.target.closest('button');if(!b||b.disabled)return;
 if(b.dataset.topic){state.topic=b.dataset.topic;state.view='learn';state.hint=false;render();return;}
 if(b.dataset.view){state.view=b.dataset.view;state.hint=false;render();return;}
 if(b.dataset.step!==undefined){const i=Number(b.dataset.step);if(i>=0&&i<D.lessons[state.topic].length){state.steps[state.topic]=i;render();}return;}
 const s=state.sessions[state.topic];
 if(b.dataset.answer!==undefined&&s&&!s.answered){s.selected=b.dataset.answer;render();document.querySelector(`[data-answer="${CSS.escape(s.selected)}"]`)?.focus({preventScroll:true});return;}
 if(b.dataset.letter&&s&&!s.answered){const input=$('written-answer');if(!input)return;const a=input.selectionStart??input.value.length,z=input.selectionEnd??a;input.value=input.value.slice(0,a)+b.dataset.letter+input.value.slice(z);s.selected=input.value;input.focus({preventScroll:true});input.setSelectionRange(a+1,a+1);document.querySelector('[data-action="check"]').disabled=false;save();return;}
 const action=b.dataset.action;
 if(action==='start'){
  const count=$('set-count').value,direction=$('set-direction')?.value||'both',mode=$('set-mode').value;state.settings[state.topic]={count:count==='all'?'all':Number(count),direction,mode};state.paused[state.topic]=false;const qs=E.choose(D.questions,state.topic,count,direction);state.sessions[state.topic]=Object.assign(E.start(qs.map(q=>q.id)),{mode,optionOrders:{}});state.hint=false;render();focusMain();
 }
 if(action==='settings'&&s&&!s.done){state.settings[state.topic]={...(state.settings[state.topic]||{count:topic().short,direction:'both'}),mode:s.mode};state.paused[state.topic]=true;state.hint=false;render();focusMain();}
 if(action==='resume'&&s){state.paused[state.topic]=false;render();focusMain();}
 if(action==='check')check();
 if(action==='next')advance();
 if(action==='retry'&&s&&E.retry(s)){state.hint=false;render();focusMain();}
 if(action==='new'){state.paused[state.topic]=false;delete state.sessions[state.topic];state.hint=false;render();focusMain();}
 if(action==='hint'){state.hint=!state.hint;render();}
 if(action==='mode'&&s&&!s.answered){s.mode=s.mode==='write'?'choice':'write';render();}
});
document.addEventListener('input',e=>{if(e.target.id==='written-answer'){const s=state.sessions[state.topic];if(!s||s.answered)return;s.selected=e.target.value;document.querySelector('[data-action="check"]').disabled=!E.normalize(s.selected);save();}});
document.addEventListener('keydown',e=>{if(e.target.id==='written-answer'&&e.key==='Enter'){e.preventDefault();check();}});
$('home-link').addEventListener('click',e=>{e.preventDefault();state.topic='gender';state.view='learn';render();});
render();
