var BareMetal = typeof BareMetal !== 'undefined' ? BareMetal : {};
BareMetal.ThemePicker = {create({themes, selected, link, onChange}={}) {
  const element=document.createElement('label'),select=document.createElement('select');
  element.className='bm-theme-picker';element.append(document.createTextNode('Theme '));select.className='fsl';select.setAttribute('aria-label','Theme');
  for(const theme of themes){const option=document.createElement('option');option.value=theme.id;option.textContent=theme.label;select.append(option);}
  const overrides=document.createElement('style'),status=document.createElement('span');status.setAttribute('role','status');element.append(status);document.head.append(overrides);let revision=0;
  function apply(id){const theme=themes.find(item=>item.id===id);if(!theme)return false;const url=new URL(theme.href,location.href);if(url.origin!==location.origin)return false;const current=++revision;select.value=id;document.documentElement.style.colorScheme=theme.mode||'dark';status.textContent='';if(typeof theme.css==='string'){overrides.textContent=theme.css;}else{link.href=theme.href;fetch(url.href,{cache:'reload'}).then(response=>{if(!response.ok)throw new Error('Theme unavailable');return response.text();}).then(css=>{if(current===revision)overrides.textContent=css;}).catch(()=>{if(current===revision)status.textContent='Theme could not load';});}if(onChange)onChange(id);return true;}
  select.onchange=()=>apply(select.value);element.append(select);apply(selected||themes[0].id);return {element,select,apply};
}};
if(typeof module!=='undefined')module.exports=BareMetal.ThemePicker;
