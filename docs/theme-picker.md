# Theme picker and studio styles

Load BareMetal.ThemePicker.js and create a picker with `{themes, selected, link, onChange}`. Each theme supplies `id`, `label`, `href`, and `mode` (light/dark), plus optional trusted bundled `css` for immediate offline application. `link` is the stylesheet link to replace when no bundled CSS is supplied. The returned object has `element`, `select`, and `apply(id)`. Only supplied theme IDs can be selected; URLs must have the page origin. The host owns persistence; the component does not write browser storage.

Aurora, Midnight and Paper are theme token overrides. Load after BareMetalStyles and a complete base theme. BareMetal.Studio.css provides reusable composer, options, picker and gallery presentation, including reduced-motion behavior.
