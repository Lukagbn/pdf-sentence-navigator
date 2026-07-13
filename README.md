# PDF Sentence Navigator
 
Keyboard navigation between sentences in a PDF document opened in Chrome.
 
- **Tab** - Next sentence
- **Shift + Tab** - Previous sentence
The active sentence is visually highlighted. Everything works locally in the browser — nothing is sent to an external server.
 
## Installation
 
1. Go `to chrome://extensions` → Enable **Developer mode**
2. Click **Load unpacked** → Select this folder
3. For local (`file://`) PDF files: Go to the extension's **Details** → Enable **"Allow access to file URLs"**
## Usage
 
Open any PDF - it will automatically redirect you to its own viewer page. If the tab was already open before enabling the extension, click the toolbar icon manually.
 
## Files
 
| File | Purpose |
|---|---|
| `manifest.json` | Extension configuration |
| `background.js` | Detects PDF navigation and redirects to the viewer |
| `viewer.html`, `viewer.css` | PDF viewer page |
| `viewer.js` | PDF rendering and sentence navigation |
| `pdf.min.mjs`, `pdf.worker.min.mjs` | PDF.js library |
 
## Limitations
 
- PDFs embedded in an iframe will not open; it only works if the PDF occupies the entire page.
- Sentence detection is based on simple punctuation (., !, ?) - abbreviations may sometimes be split incorrectly.
 
