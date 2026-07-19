# KPI Card Tableau Extension

Static Tableau dashboard extension files for a configurable KPI card.

## Files

| File | Purpose |
|---|---|
| `index.html` | Extension entry page loaded by Tableau. |
| `app.js` | Parent extension logic: initialize, read settings, fetch summary data, render cards, refresh on data/filter changes. |
| `styles.css` | Extension and config dialog styling. |
| `config.html` | Configure dialog page. |
| `config.js` | Dialog logic: worksheet/column dropdowns and persisted settings. |
| `manifest.trex` | Local development manifest for `http://localhost:8765/index.html`. |
| `kpi-card-public.trex` | GitHub Pages manifest for the public HTTPS URL. |
| `tableau.extensions.1.latest.min.js` | Local Tableau Extensions API library loaded by script tag. |

## Public URL

```text
https://avinashmishra921.github.io/Tableau_extemsion_P1/tableau-extensions-kit/index.html
```

Enable GitHub Pages for this repository before using the public manifest.