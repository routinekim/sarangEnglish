import { logListenStart } from './session-client.js';

export function setupTTS(unitId){
  const synth = window.speechSynthesis;
  const bars = document.querySelectorAll('.audio');
  if(!synth || !window.SpeechSynthesisUtterance){
    bars.forEach(b=>{ b.querySelector('.warn').style.display='block'; b.querySelector('.play').disabled=true; });
    return;
  }
  // 문장 단위로 쪼개서 span으로 감싸기 (문장 하이라이트용)
  function wrapSentences(root){
    root.querySelectorAll('p, td').forEach(el=>{
      if(el.classList.contains('note')) return;
      const txt = el.innerHTML;
      if(el.tagName==='P' && el.classList.contains('info')){ // 줄바꿈 단위
        el.innerHTML = txt.split('<br>').map(l=>`<span class="sent">${l}</span>`).join('<br>');
        return;
      }
      const parts = txt.split(/(?<=[.!?]["”]?)\s+(?=[A-Z"“(ⓐⓑⓒⓓ<])/);
      el.innerHTML = parts.map(pt=>`<span class="sent">${pt}</span>`).join(' ');
    });
  }
  ['p1','p2'].forEach(id=>wrapSentences(document.getElementById(id)));

  let current=null, rate=0.9, stopped=false;
  function cleanText(el){
    return el.textContent.replace(/[ⓐⓑⓒⓓ]/g,'').replace(/\(A\)/,'blank A').replace(/₩66,000/,'66,000 won').replace(/·/g,'').replace(/\s+/g,' ').trim();
  }
  function pickVoice(){
    const vs = synth.getVoices();
    return vs.find(v=>/^en[-_]US/i.test(v.lang) && /female|samantha|aria|jenny|zira|google us/i.test(v.name))
        || vs.find(v=>/^en[-_]US/i.test(v.lang)) || vs.find(v=>/^en/i.test(v.lang)) || null;
  }
  function stop(){
    stopped=true; synth.cancel();
    document.querySelectorAll('.sent.now').forEach(s=>s.classList.remove('now'));
    bars.forEach(b=>{ b.querySelector('.play').disabled=false; b.querySelector('.play').textContent='▶ 듣기'; b.querySelector('.stop').disabled=true; });
    current=null;
  }
  function play(bar, from){
    logListenStart(unitId);
    stop(); stopped=false; current=bar;
    const sents = [...document.getElementById(bar.dataset.target).querySelectorAll('.sent')].filter(s=>cleanText(s).length>1);
    bar.querySelector('.play').disabled=true; bar.querySelector('.play').textContent='🔊 읽는 중';
    bar.querySelector('.stop').disabled=false;
    const voice = pickVoice();
    let i = from ? Math.max(0, sents.findIndex(s=>from.contains(s))) : 0;
    const next=()=>{
      if(stopped || i>=sents.length){ if(!stopped) stop(); return; }
      const el = sents[i++];
      document.querySelectorAll('.sent.now').forEach(s=>s.classList.remove('now'));
      el.classList.add('now');
      el.scrollIntoView({block:'center', behavior:'smooth'});
      const u = new SpeechSynthesisUtterance(cleanText(el));
      u.lang='en-US'; u.rate=rate; if(voice) u.voice=voice;
      u.onend = next; u.onerror = next;
      synth.speak(u);
    };
    next();
  }
  bars.forEach(bar=>{
    bar.querySelector('.play').addEventListener('click',()=>play(bar));
    bar.querySelector('.stop').addEventListener('click',stop);
    bar.querySelectorAll('.speed button').forEach(b=>b.addEventListener('click',()=>{
      rate=parseFloat(b.dataset.rate);
      document.querySelectorAll('.speed button').forEach(x=>x.classList.toggle('on', parseFloat(x.dataset.rate)===rate));
      if(current) play(current);
    }));
  });
  // 본문을 누르면: 읽는 중이면 멈추고, 아니면 누른 문단부터 읽어 주기
  document.body.addEventListener('click',e=>{
    const box = e.target.closest('#p1, #p2'); if(!box) return;
    if(current){ stop(); return; }
    const para = e.target.closest('p, td'); if(!para || !para.querySelector('.sent')) return;
    play(document.querySelector(`.audio[data-target="${box.id}"]`), para);
  });
  if(synth.onvoiceschanged!==undefined) synth.onvoiceschanged=()=>{};
  window.addEventListener('pagehide',()=>synth.cancel());
}
