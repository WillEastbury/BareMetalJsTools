/* Responsive media catalogue. No network, storage or application dependencies. */
var BareMetal = typeof BareMetal !== 'undefined' ? BareMetal : {};
BareMetal.Gallery = (() => {
  const kind = value => ({edit:'image',music:'audio'}[value] || value || 'image');
  const text = value => String(value || '').normalize('NFKC').toLocaleLowerCase();
  function matches(item, filters) {
    const haystack = text([item.title,item.description,item.prompt,item.category,...(item.tags || [])].join(' '));
    return (!filters.search || text(filters.search).trim().split(/\s+/).every(word => haystack.includes(word))) &&
      (!filters.kind || kind(item.kind) === filters.kind) &&
      (!filters.category || item.category === filters.category) &&
      (!filters.tag || (item.tags || []).includes(filters.tag)) &&
      (!filters.state || item.state === filters.state) && (!filters.favourite || item.favourite === true);
  }
  function create(options = {}) {
    const element = document.createElement('section'), toolbar = document.createElement('div'),
      grid = document.createElement('div'), summary = document.createElement('p'), empty = document.createElement('div');
    element.className = 'bm-media-gallery'; element.setAttribute('aria-label',options.label || 'Media gallery');
    toolbar.className = 'bm-gallery-toolbar'; grid.className = 'bm-gallery';
    summary.className = 'bm-gallery-summary'; summary.setAttribute('role','status'); summary.setAttribute('aria-live','polite');
    empty.className = 'bm-gallery-empty';
    const cards = new Map(), controls = {}, filters = {search:'',kind:'',category:'',tag:'',state:'',favourite:false,sort:'newest',view:'grid'};
    let destroyed = false, viewer = null;
    function control(name,label,type='select',choices=[]) {
      const wrapper=document.createElement('label'),caption=document.createElement('span'),input=document.createElement(type==='select'?'select':'input');
      caption.textContent=label; input.setAttribute('aria-label',label); wrapper.append(caption,input); toolbar.append(wrapper);
      input.className=type==='select'?'fsl':'fc'; if(type!=='select')input.type=type;
      choices.forEach(([value,title])=>input.add(new Option(title,value))); controls[name]=input;
      input.addEventListener(type==='search'?'input':'change',()=>setFilters({[name]:type==='checkbox'?input.checked:input.value}));
      return input;
    }
    control('search','Search','search').placeholder='Search titles, descriptions and tags';
    control('kind','Media','select',[['','All media'],['image','Images'],['video','Videos'],['audio','Audio']]);
    control('category','Category','select',[['','All categories']]); control('tag','Tag','select',[['','All tags']]);
    control('state','Status','select',[['','Any status'],['done','Ready'],['queued','Queued'],['running','Creating'],['failed','Failed'],['cancelled','Cancelled']]);
    control('sort','Sort','select',[['newest','Newest first'],['oldest','Oldest first'],['title','Title A–Z']]);
    control('view','View','select',[['grid','Grid'],['list','List']]); control('favourite','Favourites only','checkbox');
    const reset=document.createElement('button');reset.type='button';reset.className='bt bt-os';reset.textContent='Reset filters';
    reset.onclick=()=>setFilters({search:'',kind:'',category:'',tag:'',state:'',favourite:false});toolbar.append(reset);
    element.append(toolbar,summary,grid,empty);
    function facets(name,values,label) {
      const input=controls[name],sorted=[...new Set(values.filter(Boolean))].sort((a,b)=>a.localeCompare(b));
      if(filters[name]&&!sorted.includes(filters[name]))sorted.push(filters[name]);
      const signature=JSON.stringify(sorted);if(input.dataset.facets===signature)return;
      input.dataset.facets=signature;input.replaceChildren(new Option(label,'')); sorted.forEach(value=>input.add(new Option(value,value)));input.value=filters[name];
    }
    function refresh() {
      if(destroyed)return;
      const entries=[...cards.values()]; facets('category',entries.map(entry=>entry.metadata.category),'All categories');
      facets('tag',entries.flatMap(entry=>entry.metadata.tags || []),'All tags');
      entries.sort((a,b)=>filters.sort==='title'?String(a.metadata.title||'').localeCompare(String(b.metadata.title||'')):
        (filters.sort==='oldest'?1:-1)*((Number(a.metadata.created)||0)-(Number(b.metadata.created)||0)));
      let visible=0;
      entries.forEach((entry,index)=>{
        const hidden=!matches(entry.metadata,filters);entry.element.hidden=hidden;
        if(hidden)entry.preview.querySelectorAll('video,audio').forEach(media=>{if(!media.paused)media.pause();});else visible++;
        if(grid.children[index]!==entry.element)grid.insertBefore(entry.element,grid.children[index]||null);
      });
      grid.dataset.view=filters.view; empty.hidden=visible>0;
      empty.textContent=entries.length?'No media matches your filters. Try another search or reset the filters.':options.emptyText || 'Your creations will appear here.';
      const count=visible+' of '+entries.length+' creations';if(summary.textContent!==count)summary.textContent=count;
    }
    function setFilters(values) {
      Object.keys(filters).forEach(name=>{if(Object.hasOwn(values,name))filters[name]=values[name];});
      Object.entries(controls).forEach(([name,input])=>{if(input.type==='checkbox')input.checked=filters[name];else input.value=filters[name];});
      refresh(); if(options.onFilter)options.onFilter({...filters});
    }
    function update(id,values,render=true) {
      const entry=cards.get(id);if(!entry)return;
      entry.metadata={...entry.metadata,...values};const item=entry.metadata;
      entry.heading.textContent=item.title || item.prompt || 'Untitled';entry.badge.textContent={image:'Image',video:'Video',audio:'Audio'}[kind(item.kind)]||'Media';
      entry.element.dataset.kind=kind(item.kind);entry.favourite.hidden=!options.onFavourite;
      entry.favourite.textContent=item.favourite?'★':'☆'; entry.favourite.setAttribute('aria-pressed',String(!!item.favourite));
      entry.favourite.setAttribute('aria-label',(item.favourite?'Remove from':'Add to')+' favourites: '+entry.heading.textContent);
      const signature=JSON.stringify([item.category,item.tags]);
      const chip=(label,filter)=>{const button=document.createElement('button');button.type='button';button.className='bm-gallery-chip';button.textContent=label;button.title='Filter by '+label;button.onclick=()=>setFilters(filter);entry.tags.append(button);};
      if(entry.tags.dataset.metadata!==signature){entry.tags.dataset.metadata=signature;entry.tags.replaceChildren();if(item.category)chip(item.category,{category:item.category});(item.tags||[]).forEach(tag=>chip('#'+tag,{tag}));}
      entry.tags.hidden=!entry.tags.children.length;if(render)refresh();
    }
    function card(id,title,metadata={}) {
      if(cards.has(id))return cards.get(id);
      const element=document.createElement('article'),heading=document.createElement('h3'),preview=document.createElement('div'),status=document.createElement('p'),
        progress=document.createElement('progress'),actions=document.createElement('div'),tags=document.createElement('div'),top=document.createElement('div'),badge=document.createElement('span'),favourite=document.createElement('button');
      element.className='bm-gallery-card';preview.className='bm-gallery-preview';actions.className='bm-gallery-actions';tags.className='bm-gallery-tags';top.className='bm-gallery-card-top';badge.className='bm-gallery-kind';favourite.className='bm-gallery-favourite';favourite.type='button';
      progress.max=1;progress.hidden=true;progress.setAttribute('aria-label','Generation progress');top.append(badge,favourite);
      element.append(top,preview,heading,status,tags,progress,actions);grid.append(element);
      const entry={element,heading,preview,status,progress,actions,tags,badge,favourite,metadata:{title,...metadata}};cards.set(id,entry);
      favourite.onclick=async()=>{if(!options.onFavourite)return;favourite.disabled=true;try{const result=await options.onFavourite(id,!entry.metadata.favourite);update(id,result||{favourite:!entry.metadata.favourite});}catch(error){if(options.onError)options.onError(error);else entry.status.textContent=error.message;}finally{favourite.disabled=false;}};
      update(id,entry.metadata);return entry;
    }
    function media(asset) {
      const url=String(asset.url||'');if(!/^(blob:|https?:)/i.test(url)&&!/^\/(?!\/)/.test(url))throw new Error('Unsupported media URL');
      const mime=asset.mime || '',type=mime.startsWith('image/')?'img':mime.startsWith('audio/')?'audio':mime.startsWith('video/')?'video':null;
      if(!type)throw new Error('Unsupported media type');
      const node=document.createElement(type);node.src=url;
      if(type==='img'){node.alt=asset.name||'Generated image';node.loading='lazy';node.decoding='async';}
      else{node.controls=true;node.preload='metadata';if(type==='video')node.playsInline=true;}
      return node;
    }
    function open(asset) {
      if(viewer)viewer.close();const dialog=document.createElement('dialog'),close=document.createElement('button'),heading=document.createElement('h2'),preview=media(asset),focus=document.activeElement;
      dialog.className='bm-gallery-viewer';dialog.setAttribute('aria-label',asset.name||'Media preview');heading.textContent=asset.name||'Media preview';close.type='button';close.textContent='Close preview';close.className='bt bt-os';dialog.append(heading,preview,close);document.body.append(dialog);viewer=dialog;
      close.onclick=()=>dialog.close();dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close();});
      dialog.addEventListener('close',()=>{dialog.querySelectorAll('video,audio').forEach(node=>node.pause());dialog.remove();if(viewer===dialog)viewer=null;if(focus?.isConnected)focus.focus();},{once:true});
      dialog.showModal();close.focus();return dialog;
    }
    function remove(id) {if(viewer)viewer.close();const entry=cards.get(id);entry?.preview.querySelectorAll('video,audio').forEach(node=>{if(!node.paused)node.pause();});entry?.element.remove();cards.delete(id);refresh();}
    function clear() {if(viewer)viewer.close();[...cards.keys()].forEach(remove);refresh();}
    refresh();return {element,grid,toolbar,controls,cards,filters,card,update,refresh,setFilters,media,open,remove,clear,destroy(){clear();destroyed=true;element.remove();}};
  }
  return {create,matches};
})();
if(typeof module!=='undefined')module.exports=BareMetal.Gallery;
