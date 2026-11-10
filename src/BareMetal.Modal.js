/* Shared BareMetalJsTools component; canonical source is copied into the suite. */
var BareMetal = typeof BareMetal !== 'undefined' ? BareMetal : {};
BareMetal.Modal = (function () {
  'use strict';
  let serial=0;
  function adopt(dialog,options) {
    options=options||{};
    if(!dialog||dialog.tagName!=='DIALOG')throw new TypeError('Modal requires a dialog element');
    dialog.classList.add('bm-modal');
    let previousFocus=null,busy=false;
    dialog.addEventListener('cancel',event=>{if(busy)event.preventDefault()});
    dialog.addEventListener('close',()=>{if(previousFocus&&previousFocus.isConnected)previousFocus.focus();if(options.onClose)options.onClose(dialog.returnValue)});
    return {element:dialog,open(){if(dialog.open)return;previousFocus=document.activeElement;dialog.showModal();const first=dialog.querySelector(options.initialFocus||'[autofocus],input,button,textarea,select');if(first)first.focus()},
      close(value){if(!busy&&dialog.open)dialog.close(value||'')},
      setBusy(value){busy=!!value;dialog.setAttribute('aria-busy',String(busy))},
      destroy(){busy=false;if(dialog.open)dialog.close();dialog.remove()}};
  }
  function create(options) {
    options=options||{};
    const dialog=document.createElement('dialog'),title=document.createElement('h2'),body=document.createElement('div'),close=document.createElement('button');
    title.id='bm-modal-title-'+(++serial);title.textContent=options.title||'';dialog.setAttribute('aria-labelledby',title.id);
    body.className='bm-modal-body';if(options.content)body.append(options.content);
    close.type='button';close.className='bt bt-os';close.textContent=options.closeLabel||'Close';
    dialog.append(title,body,close);(options.parent||document.body).append(dialog);
    const controller=adopt(dialog,options);close.onclick=()=>controller.close();
    controller.body=body;controller.title=title;controller.closeButton=close;return controller;
  }
  return {create,adopt};
})();
if(typeof module!=='undefined')module.exports=BareMetal.Modal;
