/* BareMetal.Timeline — accessible seek bar shared by audio, video and animation. */
var BareMetal = typeof BareMetal !== 'undefined' ? BareMetal : {};
BareMetal.Timeline = (() => {
  'use strict';
  const fmt = value => { value = Math.max(0, Number(value) || 0); const h = Math.floor(value / 3600), m = Math.floor(value % 3600 / 60), s = Math.floor(value % 60); return h ? h + ':' + String(m).padStart(2,'0') + ':' + String(s).padStart(2,'0') : m + ':' + String(s).padStart(2,'0'); };
  function create(options = {}) {
    const root = document.createElement('div'); root.className = 'bm-timeline'; root.setAttribute('role','group'); root.setAttribute('aria-label', options.label || 'Playback timeline');
    const play = document.createElement('button'); play.type = 'button'; play.className = 'bm-timeline-play';
    const current = document.createElement('output'), range = document.createElement('input'), duration = document.createElement('output');
    current.className = duration.className = 'bm-timeline-time'; current.setAttribute('aria-label','Current time'); duration.setAttribute('aria-label','Duration');
    range.type = 'range'; range.className = 'bm-timeline-seek'; range.min = '0'; range.step = String(options.step || 0.1); range.setAttribute('aria-label', options.seekLabel || 'Seek');
    const markers = document.createElement('div'); markers.className = 'bm-timeline-markers'; markers.setAttribute('aria-label','Timeline markers');
    const markIn = document.createElement('button'), markOut = document.createElement('button'), selection = document.createElement('output');
    markIn.type = markOut.type = 'button'; markIn.textContent = options.markInLabel || 'Mark in'; markOut.textContent = options.markOutLabel || 'Mark out'; markIn.className = markOut.className = 'bm-timeline-mark'; selection.className = 'bm-timeline-selection'; selection.setAttribute('aria-live','polite');
    const row = document.createElement('div'); row.className = 'bm-timeline-controls'; row.append(play,current,range,duration); root.append(row,markers);
    if (options.selection !== false) root.append(markIn,markOut,selection);
    let length = Math.max(0, Number(options.duration) || 0), time = Math.max(0, Number(options.currentTime) || 0), playing = !!options.playing, inPoint = null, outPoint = null, destroyed = false;
    const clamp = n => Math.max(0, Math.min(length, Number(n) || 0));
    function render() { time = clamp(time); range.max = String(length); range.value = String(time); range.setAttribute('aria-valuetext', fmt(time) + ' of ' + fmt(length)); current.textContent = fmt(time); duration.textContent = fmt(length); play.textContent = playing ? (options.pauseText || 'Pause') : (options.playText || 'Play'); play.setAttribute('aria-label', playing ? 'Pause playback' : 'Start playback'); selection.textContent = inPoint == null ? '' : ('Selection ' + fmt(inPoint) + ' – ' + fmt(outPoint == null ? time : outPoint)); }
    function setTime(value, notify = false, source = 'api') { time = clamp(value); render(); if (notify && options.onSeek) options.onSeek(time,{source}); return time; }
    range.addEventListener('input', () => setTime(range.value,true,'seek'));
    play.addEventListener('click', () => { playing = !playing; render(); const fn = playing ? options.onPlay : options.onPause; if (fn) fn(time); });
    markIn.addEventListener('click', () => { inPoint = time; if (outPoint != null && outPoint < inPoint) outPoint = inPoint; render(); if (options.onSelectionChange) options.onSelectionChange({start:inPoint,end:outPoint}); });
    markOut.addEventListener('click', () => { outPoint = time; if (inPoint == null) inPoint = 0; if (outPoint < inPoint) [inPoint,outPoint] = [outPoint,inPoint]; render(); if (options.onSelectionChange) options.onSelectionChange({start:inPoint,end:outPoint}); });
    function setMarkers(items) { markers.replaceChildren(); for (const item of items || []) { const button = document.createElement('button'); button.type='button'; button.className='bm-timeline-marker'; button.textContent=item.label || fmt(item.time); button.title=item.label || fmt(item.time); button.style.left=(length ? clamp(item.time)/length*100 : 0)+'%'; button.setAttribute('aria-label',(item.label || 'Marker')+' at '+fmt(item.time)); button.addEventListener('click',()=>setTime(item.time,true,'marker')); markers.append(button); } }
    function setDuration(value) { length=Math.max(0,Number(value)||0); render(); setMarkers(options.markers || []); return length; }
    const api = {element:root, playButton:play, seekInput:range, setTime, setDuration, setPlaying(value){playing=!!value;render();}, setMarkers, setSelection(start,end){inPoint=start==null?null:clamp(start);outPoint=end==null?null:clamp(end);render();}, getState(){return {currentTime:time,duration:length,playing,selection:inPoint==null?null:{start:inPoint,end:outPoint}};}, destroy(){if(destroyed)return;destroyed=true;root.remove();}};
    render(); setMarkers(options.markers || []); return api;
  }
  return {create,formatTime:fmt};
})();
if (typeof module !== 'undefined') module.exports = BareMetal.Timeline;
