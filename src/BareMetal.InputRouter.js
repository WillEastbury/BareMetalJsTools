/* BareMetal.InputRouter — normalize keyboard, pointer, gamepad and XR actions. */
var BareMetal = typeof BareMetal !== 'undefined' ? BareMetal : {};
BareMetal.InputRouter = (() => {
  'use strict';
  function create(options={}) {
    const root=options.element||document;const active=new Set(),listeners=new Set(),unsub=[];let destroyed=false;
    const keyMap=new Map(),padMap=[];
    Object.entries(options.keyboard||{}).forEach(([action,keys])=>(Array.isArray(keys)?keys:[keys]).forEach(key=>keyMap.set(String(key).toLowerCase(),action)));
    Object.entries(options.gamepad||{}).forEach(([action,binding])=>padMap.push({action,index:binding.index==null?null:Number(binding.index),button:binding.button}));
    function dispatch(action,phase,source,detail={}){if(!action||destroyed)return;const key=source+':'+action;if(phase==='down'){if(active.has(key))return;active.add(key);}else if(phase==='up'){if(!active.has(key))return;active.delete(key);}const event={action,phase,source,detail};listeners.forEach(fn=>{try{fn(event)}catch(_){}});if(options.onAction)options.onAction(event);const target=root.dispatchEvent?root:document;target.dispatchEvent(new CustomEvent('bm:action',{detail:event,bubbles:true}));}
    function keyDown(event){const action=keyMap.get(String(event.code||event.key).toLowerCase())||keyMap.get(String(event.key).toLowerCase());if(!action||event.repeat)return;dispatch(action,'down','keyboard',{key:event.key,code:event.code});if(options.preventDefault!==false)event.preventDefault();}
    function keyUp(event){const action=keyMap.get(String(event.code||event.key).toLowerCase())||keyMap.get(String(event.key).toLowerCase());if(action)dispatch(action,'up','keyboard',{key:event.key,code:event.code});}
    root.addEventListener('keydown',keyDown);root.addEventListener('keyup',keyUp);
    function click(event){const button=event.target&&event.target.closest&&event.target.closest('[data-bm-action]');if(!button||!root.contains(button))return;const action=button.getAttribute('data-bm-action');dispatch(action,'down','pointer',{event});dispatch(action,'up','pointer',{event});dispatch(action,'activate','pointer',{event});}
    root.addEventListener('click',click);
    if(BareMetal.Gamepad&&typeof BareMetal.Gamepad.on==='function'){
      const match=(event,phase)=>{for(const b of padMap){if(b.index!=null&&Number(event.index)!==b.index)continue;const number=typeof b.button==='number'?b.button:Number(String(b.button).replace(/^button/i,''));if(Number.isFinite(number)&&event.button===number)dispatch(b.action,phase,'gamepad',event);else if(typeof b.button==='string'&&String(event.name).toLowerCase()===b.button.toLowerCase())dispatch(b.action,phase,'gamepad',event);}};
      unsub.push(BareMetal.Gamepad.on('buttondown',event=>match(event,'down')),BareMetal.Gamepad.on('buttonup',event=>match(event,'up')));
    }
    const api={trigger(action,phase='activate',detail={}){if(phase==='activate'){dispatch(action,'down','xr',detail);dispatch(action,'up','xr',detail);dispatch(action,'activate','xr',detail);}else dispatch(action,phase,'xr',detail);},onAction(fn){listeners.add(fn);return()=>listeners.delete(fn);},getActive(){return [...active].map(value=>value.split(':').slice(1).join(':'));},destroy(){if(destroyed)return;destroyed=true;root.removeEventListener('keydown',keyDown);root.removeEventListener('keyup',keyUp);root.removeEventListener('click',click);unsub.forEach(fn=>fn());listeners.clear();active.clear();}};
    return api;
  }
  return {create};
})();
if(typeof module!=='undefined')module.exports=BareMetal.InputRouter;
