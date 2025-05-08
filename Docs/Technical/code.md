<!-- code.md -->

# Browser To‑Do Extension · Code Reference

```
root/
├ manifest.json
├ images/ *.png
├ sounds/slot_machine_payout.wav
├ templates/ todo.html, dashboard.html
├ styles/ todo.css, dashboard.css
├ scripts/
├ load-templates.js
├ todo.js
└ dashboard.js
```

## manifest.json essentials


```
{ "manifest_version":3,
  "name":"Chrome To-Do List",
  "version":"2.3",
  "content_scripts":[{ "matches":["<all_urls>"],
    "js":["scripts/todo.js","scripts/dashboard.js"],
    "css":["styles/dashboard.css","styles/todo.css"]}],
  "permissions":["storage"],
  "web_accessible_resources":[{ "resources":["images/*","sounds/*","templates/*"],
    "matches":["<all_urls>"]}] }
```

## Data Structures

| Var | File | Type | Purpose |
|----|----|----|----|
| `tasks` | todo.js | `Array<{title,url}>` | persisted |
| `timers` | dashboard.js | `Array<Timer>` | runtime |


```
type Timer={name:string,remaining:number,initialDuration:number,paused:boolean,interval:number|null};
```

## Core Functions

| File | Function | Role |
|------|----------|------|
| load-templates.js | inject templates |
| todo.js | waitForDocumentLoad · loadTasks · saveTasks · renderTasks · handleAddButton |
| dashboard.js | formatTime · tickTimer · renderTimers · waitForElement |

## Event Bus

> CustomEvent('dashboard-open') / 'dashboard-close' decouple panels
