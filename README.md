# Your Name — Personal Website

A personal site and light blog, built with plain HTML, CSS, and JavaScript — no
framework, no build step, ready to deploy straight to GitHub Pages.

## What's here

| File | What it is |
|---|---|
| `index.html` | Home — intro and links to everything else |
| `projects.html` | Experience, skills, and software projects |
| `photography.html` | Film photography, laid out as a contact sheet |
| `writing.html` | Essays and film writing, listed like a blog |
| `post-example.html` | A template for a single post — duplicate it for each new one |
| `css/style.css` | All styling and the color/type system |
| `js/script.js` | Mobile nav toggle + a small scroll-reveal effect |

## Preview it locally

Opening `index.html` directly in a browser works fine. If you want relative
links to behave exactly as they will once deployed, run a tiny local server
from inside the folder instead:

```bash
cd personal-website
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.

## Deploy to GitHub Pages

1. Create a new repository on GitHub — name it `your-username.github.io` if
   you want the site at the root of your GitHub domain, or anything else if
   you're fine with it living at `your-username.github.io/repo-name`.
2. From inside this folder:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/your-username/your-repo.git
   git push -u origin main
   ```
3. On GitHub: **Settings → Pages**.
4. Under **Build and deployment → Source**, choose **Deploy from a branch**,
   then pick the `main` branch and `/ (root)` folder. Save.
5. Give it a minute or two — your site will be live at the URL GitHub shows
   you on that same settings page.

## Customize

A checklist, roughly in the order you'll hit things:

- [ ] Replace `Your Name` everywhere (page titles, nav logo, footer) — it
      appears in every HTML file.
- [ ] Swap `your.email@example.com` and the GitHub/LinkedIn URLs in the
      footer of every page, and in the "Get in touch" button on the home page.
- [ ] Rewrite the bio on `index.html` — city, camera, blog name.
- [ ] Fill in `projects.html`: your real experience, real skills, real
      projects. The four project cards are placeholders — keep the shape
      (title, tags, one description, links) but replace the content.
- [ ] Add real photos to `images/` and swap them into `photography.html`.
      Each placeholder frame has an HTML comment showing exactly what to
      replace it with.
- [ ] Replace the four entries on `writing.html`, and duplicate
      `post-example.html` for each real post you want to link to.

## Notes

- All color and font decisions live in `:root` at the top of `css/style.css`.
  Change a value there and it updates across every page.
- The site follows the visitor's OS-level light/dark setting automatically —
  there's no manual toggle, so there's nothing to keep in sync.
- `.nojekyll` tells GitHub Pages to skip its default Jekyll processing, since
  this is a plain static site and doesn't need it.
- No build tools, no npm install, no dependencies beyond two Google Fonts
  loaded via `<link>` tags. Anything in here can be edited directly and
  reloaded in a browser.
