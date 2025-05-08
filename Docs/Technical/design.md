# Browser To‑Do Extension · Technical Design

## 1. Architecture
- **Content Scripts**: todo.js, dashboard.js
- **Template Loader**: load-templates.js (injects HTML)
- **Assets**: images, CSS, WAV via `runtime.getURL`
- **Storage**: Chrome `storage.local` (JSON)

## 2. Module Graph

```
LT → Templates → {To‑Do,Dashboard}
To‑Do ↔ storage.local
To‑Do ⇢ (CustomEvent) ⇢ Dashboard
```

## 3. UI Components
| Component | HTML | JS | CSS |
|-----------|------|----|----|
| To‑Do Box | todo.html | todo.js | todo.css |
| Dashboard | dashboard.html | dashboard.js | dashboard.css |

## 4. Design Choices
- MV3, no background worker (lighter)
- Vanilla JS; avoids React overhead
- CustomEvent bus for loose coupling
- Polling + MutationObserver to wait for injected DOM

## 5. Data Flow
1. User adds task → `saveTasks()`  
2. JSON → `storage.local`  
3. Page reload → `loadTasks()` → render  

Timers remain in‑memory → reset on reload (intentional)

## 6. Algorithms
- **RenderTasks** O(n)  
- **TickTimer** O(1) per timer  
- Drag/Resize: mouse delta; lock min‑w/h on release

## 7. Security
- No external requests  
- Runs in page context but DOM isolated via IDs  
- Only user‑provided URLs stored

## 8. Accessibility
Keyboard‑focusable buttons

## 9. Roadmap
| Priority | Feature |
|----------|---------|
| ★★★ | Site blocker |
| ★★★ | Tag filter UI |
| ★★ | Stopwatch mode |
| ★★ | Productivity charts |
| ★ | Cloud sync |
| ★ | Collaboration

## 10. Deployment

**Coming soon to the Chrome Web Store**
