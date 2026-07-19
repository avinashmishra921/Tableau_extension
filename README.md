# Tableau Extensions

Public static Tableau dashboard extensions from Nuggen Labs.

## KPI Card

The KPI Card extension lives in `tableau-extensions-kit/` and runs as vanilla HTML/CSS/JS with no build step.

Public GitHub Pages URL after Pages is enabled:

```text
https://avinashmishra921.github.io/Tableau_extemsion_P1/tableau-extensions-kit/index.html
```

Use `tableau-extensions-kit/kpi-card-public.trex` when adding the hosted extension in Tableau Desktop.

For local development, serve the folder and use `manifest.trex`:

```powershell
cd tableau-extensions-kit
npx http-server -p 8765 -c-1
```