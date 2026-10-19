# BareMetal.Ribbon

> Compact command bar: labelled groups, toggles, separators, and slots for `BareMetal.Colour` / `BareMetal.Font`. A ribbon alternative, not an Office clone.

**Dependencies:** optional `BareMetal.Colour`, `BareMetal.Font`.

```js
BareMetal.Ribbon.create('#bar', {
  groups: [
    { label: 'Style', items: [
      { id: 'bold', label: 'B', toggle: true },
      { id: 'fill', type: 'colour', value: '#ffffff' },
      { id: 'font', type: 'font', family: 'Georgia, serif', size: 12 }
    ]}
  ],
  onCommand(id, item, extra) {}
});
```

`setActive(id, on)`, `setDisabled(id, on)`, `setColour(id, hex)`, `setFont(id, { family, size })`.
