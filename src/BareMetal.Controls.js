/* Shared accessible controls. Uses native inputs and BareMetal theme tokens. */
var BareMetal = typeof BareMetal !== 'undefined' ? BareMetal : {};
BareMetal.Controls = (() => {
  function help(control, text, label) {
    const root = document.createElement('span');
    const button = document.createElement('button');
    const tip = document.createElement('span');
    root.className = 'bm-help';
    button.type = 'button'; button.className = 'bm-help-button'; button.textContent = '?';
    button.setAttribute('aria-label', 'About ' + label);
    tip.id = 'bm-help-' + crypto.randomUUID(); tip.className = 'bm-help-tip';
    tip.setAttribute('role', 'tooltip'); tip.textContent = text; tip.hidden = true;
    control.setAttribute('aria-describedby', [control.getAttribute('aria-describedby'), tip.id].filter(Boolean).join(' '));
    button.setAttribute('aria-describedby', tip.id);
    let pinned = false;
    function show() { tip.hidden = false; }
    function hide() { pinned = false; tip.hidden = true; }
    root.addEventListener('pointerenter', show);
    root.addEventListener('pointerleave', () => { if (!pinned && document.activeElement !== button) hide(); });
    button.addEventListener('focus', show);
    button.addEventListener('blur', hide);
    button.addEventListener('click', () => { pinned = !pinned; tip.hidden = !pinned; });
    button.addEventListener('keydown', event => { if (event.key === 'Escape') { event.preventDefault(); hide(); } });
    root.append(button, tip); return root;
  }
  function range(input, options = {}) {
    input.type = 'range'; input.classList.add('bm-range');
    const output = document.createElement('output');
    output.className = 'bm-control-value'; output.htmlFor = input.id;
    input.parentElement.classList.add('bm-control'); input.parentElement.append(output);
    const format = options.format || (value => Number(value).toLocaleString() + (options.unit || ''));
    function update() { output.textContent = format(input.value); input.setAttribute('aria-valuetext', output.textContent); }
    input.addEventListener('input', update); input.addEventListener('change', update); update();
    return {input, output, update};
  }
  function disclosure(label, open = false) {
    const element = document.createElement('details'), summary = document.createElement('summary'), content = document.createElement('div');
    element.className = 'bm-disclosure'; element.open = open; summary.textContent = label;
    content.className = 'bm-disclosure-content'; element.append(summary, content);
    return {element, summary, content};
  }
  return {help, range, disclosure};
})();
if (typeof module !== 'undefined') module.exports = BareMetal.Controls;
