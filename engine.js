(function(root){
  'use strict';
  const normalize=s=>String(s).normalize('NFC').trim().toLocaleLowerCase('es').replace(/\s+/g,' ');
  function isCorrect(q,answer){return [q.answer,...(q.accept||[])].some(a=>normalize(a)===normalize(answer));}
  function shuffle(items,rng=Math.random){const out=[...items];for(let i=out.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[out[i],out[j]]=[out[j],out[i]];}return out;}
  function choose(bank,topic,count,direction='both',rng=Math.random){
    const pool=bank.filter(q=>q.topic===topic&&(topic!=='number'||direction==='both'||q.direction===direction));
    if(count==='all'||Number(count)>=pool.length)return shuffle(pool,rng);
    const size=Number(count),groups={};
    for(const q of shuffle(pool,rng)){const key=topic==='number'?q.family+'-'+q.direction:q.group;(groups[key]??=[]).push(q);}
    const keys=shuffle(Object.keys(groups),rng),selected=[];
    while(selected.length<size&&keys.some(k=>groups[k].length))for(const k of keys){if(groups[k].length&&selected.length<size)selected.push(groups[k].shift());}
    return shuffle(selected,rng);
  }
  function start(ids){return {initialIds:[...ids],roundIds:[...ids],index:0,selected:'',answered:false,firstCorrect:0,firstResponses:[],roundCorrect:0,misses:[],retry:false,done:false,reviewed:false};}
  function submit(session,q,answer){
    if(session.done||session.answered||!normalize(answer))return false;
    if(session.roundIds[session.index]!==q.id)throw new Error('Question mismatch');
    const correct=isCorrect(q,answer);session.selected=String(answer);session.answered=true;
    if(correct)session.roundCorrect++;else session.misses.push(q.id);
    if(!session.retry){if(correct)session.firstCorrect++;session.firstResponses.push({id:q.id,answer:String(answer),correct});}
    return true;
  }
  function next(s){if(s.done||!s.answered)return false;s.index++;s.selected='';s.answered=false;if(s.index>=s.roundIds.length){s.done=true;s.reviewed=s.misses.length===0;}return true;}
  function retry(s,rng=Math.random){if(!s.done||!s.misses.length)return false;s.roundIds=shuffle([...new Set(s.misses)],rng);s.index=0;s.selected='';s.answered=false;s.roundCorrect=0;s.misses=[];s.retry=true;s.done=false;s.reviewed=false;return true;}
  const api={normalize,isCorrect,shuffle,choose,start,submit,next,retry};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  root.ReviewEngine=api;
})(typeof window!=='undefined'?window:globalThis);
