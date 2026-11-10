var BareMetal = typeof BareMetal !== 'undefined' ? BareMetal : {};
BareMetal.Tabs = {create(options) {
  const root=document.createElement('div'),nav=document.createElement('div'),entries=[];
  root.className='bm-tabs';nav.className='bm-tab-list';nav.setAttribute('role','tablist');nav.setAttribute('aria-label',options.label||'Sections');root.append(nav);
  const prefix='bm-tabs-'+crypto.randomUUID();
  function select(id,focus=false){for(const entry of entries){const active=entry.id===id;entry.button.setAttribute('aria-selected',String(active));entry.button.tabIndex=active?0:-1;entry.panel.hidden=!active;if(active&&focus){entry.button.focus();entry.button.scrollIntoView({block:'nearest',inline:'nearest'});}}if(options.onChange)options.onChange(id);}
  for(const [index,item] of options.items.entries()){
    const button=document.createElement('button'),panel=item.content;button.type='button';button.className='bt bt-os';button.textContent=item.label;button.id=prefix+'-tab-'+index;button.setAttribute('role','tab');panel.id=panel.id||prefix+'-panel-'+index;panel.classList.add('bm-tab-panel');panel.setAttribute('role','tabpanel');panel.setAttribute('aria-labelledby',button.id);button.setAttribute('aria-controls',panel.id);button.onclick=()=>select(item.id);nav.append(button);root.append(panel);entries.push({...item,button,panel});
    button.onkeydown=event=>{let next=index;if(event.key==='ArrowRight')next=(index+1)%entries.length;else if(event.key==='ArrowLeft')next=(index+entries.length-1)%entries.length;else if(event.key==='Home')next=0;else if(event.key==='End')next=entries.length-1;else return;event.preventDefault();select(entries[next].id,true);};
  }
  select(options.selected||options.items[0].id);return {element:root,select,entries};
}};
if(typeof module!=='undefined')module.exports=BareMetal.Tabs;
