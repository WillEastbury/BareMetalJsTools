# BareMetal.Colour

> Swatch button and hex popover.

```js
const picker = BareMetal.Colour.create('#slot', {
  value: '#e91e8c',
  onChange(hex) { console.log(hex); }
});
picker.get(); // '#e91e8c'
```

`BareMetal.Colour.normalize('#f0c')` → `#ff00cc`. Default `palette` is 16 candy-friendly swatches.
