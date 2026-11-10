# Tabs and media gallery
Load BareMetal.Workspace.css after the theme, plus BareMetal.Tabs.js and BareMetal.Gallery.js.

`BareMetal.Tabs.create({items:[{id:"chat",label:"Chat",content:panel}],onChange(id){}})` returns element, select(id), entries. Existing panel nodes are adopted. Arrow keys, Home and End select and focus tabs. Labels are text.

`BareMetal.Gallery.create()` returns element, card(id,title), remove(id), clear(), cards. Each card exposes element, heading, preview, status, progress and actions. Applications supply authorized preview URLs and actions. Revoke blob URLs when removed. Both components use the active BareMetalStyles theme.
