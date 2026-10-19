# BareMetal.FooterBar

> Footer strip: status text, sheet tabs, zoom slider.

```js
const foot = BareMetal.FooterBar.create('#foot', {
  status: 'Ready',
  zoom: 100,
  tabs: [{ id: 's1', label: 'Sheet1', active: true }],
  onTab(id) {},
  onZoom(percent) {}
});
foot.setStatus('A1');
```
