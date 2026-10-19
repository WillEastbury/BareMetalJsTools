/* BareMetal.AudioMixer — track controls with optional Web Audio node wiring. */
var BareMetal = typeof BareMetal !== 'undefined' ? BareMetal : {};
BareMetal.AudioMixer = (() => {
  'use strict';
  function create(options = {}) {
    const root=document.createElement('section'); root.className='bm-audio-mixer'; root.setAttribute('role','group'); root.setAttribute('aria-label',options.label||'Audio mixer');
    const heading=document.createElement('h3'); heading.textContent=options.title||'Mixer'; root.append(heading);
    const list=document.createElement('div'); list.className='bm-mixer-tracks'; root.append(list);
    const tracks=new Map(), listeners=new Set(); let soloCount=0, raf=0, dead=false;
    function emit(track, source) { if(dead)return; const detail={track:state(track),source:source||'control',tracks:getState()}; listeners.forEach(fn=>{try{fn(detail)}catch(_){}}); if(options.onChange)options.onChange(detail); root.dispatchEvent(new CustomEvent('bm:mixer-change',{detail,bubbles:true})); }
    function state(item) { return {id:item.id,label:item.label,gain:item.gain,pan:item.pan,muted:item.muted,solo:item.solo}; }
    function audible(item) { return !item.muted && (!soloCount || item.solo); }
    function apply(item, source) {
      const effectiveGain=audible(item)?item.gain:0;
      if(item.nodes){item.nodes.gain.gain.value=effectiveGain;if(item.nodes.pan.pan)item.nodes.pan.pan.value=item.pan;}
      if(typeof item.adapter==='function') item.adapter({gain:item.gain,effectiveGain,pan:item.pan,muted:item.muted,solo:item.solo});
      if(item.readout)item.readout.textContent=Math.round(item.gain*100)+'%';
      if(item.mute)item.mute.setAttribute('aria-pressed',String(item.muted)); if(item.soloButton)item.soloButton.setAttribute('aria-pressed',String(item.solo));
      emit(item,source);
    }
    function addTrack(config={}) {
      const id=String(config.id||('track-'+Math.random().toString(36).slice(2))); if(tracks.has(id)) throw new Error('Duplicate mixer track '+id);
      const requestedGain=Number(config.gain==null?1:config.gain);
      const item={id,label:String(config.label||id),gain:Math.max(0,Math.min(1,Number.isFinite(requestedGain)?requestedGain:1)),pan:Math.max(-1,Math.min(1,Number(config.pan)||0)),muted:!!config.muted,solo:!!config.solo,adapter:config.adapter||null,nodes:null};
      if(config.source&&options.audioContext&&options.audioContext.createGain){try{const ctx=options.audioContext,gain=ctx.createGain(),pan=ctx.createStereoPanner?ctx.createStereoPanner():null,analyser=ctx.createAnalyser?ctx.createAnalyser():null;config.source.connect(gain);if(pan){gain.connect(pan);if(analyser){pan.connect(analyser);analyser.connect(config.destination||ctx.destination);}else pan.connect(config.destination||ctx.destination);}else gain.connect(config.destination||ctx.destination);item.nodes={gain,pan,analyser};}catch(error){if(options.onError)options.onError(error,item);}}
      const row=document.createElement('div');row.className='bm-mixer-track';row.dataset.track=id;
      const name=document.createElement('strong');name.className='bm-mixer-name';name.textContent=item.label;
      const mute=document.createElement('button'),solo=document.createElement('button');mute.type=solo.type='button';mute.className='bm-mixer-toggle';solo.className='bm-mixer-toggle';mute.textContent=config.muteLabel||'Mute';solo.textContent=config.soloLabel||'Solo';mute.setAttribute('aria-pressed',String(item.muted));solo.setAttribute('aria-pressed',String(item.solo));
      const gainLabel=document.createElement('label');gainLabel.textContent='Level';const gain=document.createElement('input');gain.type='range';gain.min='0';gain.max='1';gain.step='0.01';gain.value=String(item.gain);gain.setAttribute('aria-label',item.label+' level');const readout=document.createElement('output');readout.className='bm-mixer-readout';
      const panLabel=document.createElement('label');panLabel.textContent='Pan';const pan=document.createElement('input');pan.type='range';pan.min='-1';pan.max='1';pan.step='0.01';pan.value=String(item.pan);pan.setAttribute('aria-label',item.label+' pan');
      const meter=document.createElement('progress');meter.max=1;meter.value=0;meter.className='bm-mixer-meter';meter.setAttribute('aria-label',item.label+' audio level');
      item.row=row;item.mute=mute;item.soloButton=solo;item.gainInput=gain;item.panInput=pan;item.readout=readout;item.meter=meter;
      mute.addEventListener('click',()=>{item.muted=!item.muted;apply(item,'mute');});
      solo.addEventListener('click',()=>{item.solo=!item.solo;soloCount=[...tracks.values()].filter(t=>t.solo).length+(item.solo&&!tracks.has(id)?1:0);tracks.set(id,item);soloCount=[...tracks.values()].filter(t=>t.solo).length;tracks.forEach(t=>apply(t,'solo'));});
      gain.addEventListener('input',()=>{item.gain=Number(gain.value);apply(item,'gain');});pan.addEventListener('input',()=>{item.pan=Number(pan.value);apply(item,'pan');});
      const gainRow=document.createElement('div');gainRow.className='bm-mixer-control';gainRow.append(gainLabel,gain,readout);const panRow=document.createElement('div');panRow.className='bm-mixer-control';panRow.append(panLabel,pan);
      row.append(name,mute,solo,gainRow,panRow,meter);list.append(row);tracks.set(id,item);soloCount=[...tracks.values()].filter(t=>t.solo).length;apply(item,'add');return {id,element:row,state:()=>state(item)};
    }
    function removeTrack(id){const item=tracks.get(String(id));if(!item)return false;tracks.delete(String(id));if(item.nodes)Object.values(item.nodes).forEach(node=>{try{node&&node.disconnect&&node.disconnect()}catch(_){}});item.row.remove();soloCount=[...tracks.values()].filter(t=>t.solo).length;tracks.forEach(t=>apply(t,'solo'));return true;}
    function setTrack(id, patch={}){const item=tracks.get(String(id));if(!item)return false;if(patch.gain!=null){item.gain=Math.max(0,Math.min(1,Number(patch.gain)||0));item.gainInput.value=String(item.gain);}if(patch.pan!=null){item.pan=Math.max(-1,Math.min(1,Number(patch.pan)||0));item.panInput.value=String(item.pan);}if(patch.muted!=null)item.muted=!!patch.muted;if(patch.solo!=null)item.solo=!!patch.solo;soloCount=[...tracks.values()].filter(t=>t.solo).length;tracks.forEach(t=>apply(t,'api'));return true;}
    function getState(){return [...tracks.values()].map(state);}
    function meterTick(){if(dead)return;tracks.forEach(item=>{if(!item.nodes||!item.nodes.analyser)return;const data=new Uint8Array(item.nodes.analyser.fftSize);item.nodes.analyser.getByteTimeDomainData(data);let sum=0;for(const byte of data){const v=(byte-128)/128;sum+=v*v;}item.meter.value=Math.min(1,Math.sqrt(sum/(data.length||1))*2);});raf=requestAnimationFrame(meterTick);}
    if(typeof requestAnimationFrame==='function')raf=requestAnimationFrame(meterTick);
    const api={element:root,addTrack,removeTrack,setTrack,getState,onChange(fn){listeners.add(fn);return()=>listeners.delete(fn);},destroy(){if(dead)return;dead=true;if(raf&&typeof cancelAnimationFrame==='function')cancelAnimationFrame(raf);[...tracks.keys()].forEach(removeTrack);listeners.clear();root.remove();}};
    (options.tracks||[]).forEach(addTrack);return api;
  }
  return {create};
})();
if(typeof module!=='undefined')module.exports=BareMetal.AudioMixer;
