# FutCard POC

This folder contains a standalone static demo:

- `index.html`
- `site.css`
- `app.js`

Because the page loads local CSS and JavaScript, open it through a local web server instead of `file://`.

## Run locally with Bun

Yes, you can use Bun to serve this page.

From the repository root:

```bash
bunx serve ./poc -l 5177
```

Then open:

```text
http://localhost:5177/
```

## Alternative: Python static server

If you prefer a built-in tool that is already installed on many systems:

```bash
cd poc
python3 -m http.server 5177
```

Then open:

```text
http://localhost:5177/
```

## Notes

- The page should be opened over HTTP so the browser can load `site.css` and `app.js` correctly.
- If you change the files, refresh the browser to see updates.
- If port `5177` is busy, pick another port in the command.
