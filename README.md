# AI Detector: Em Dashes & Unicode Spaces Highlighter

Highlights em dashes (—) and selected non-standard Unicode spaces on any webpage. Useful for spotting formatting artifacts often seen in AI-generated text.

Built in collaboration w/ [Konrad Urban](https://www.kkonrad.com/) (original idea), implemented by [Hugo Montenegro](https://hugo0.com).

## What it highlights

- Em dash (U+2014)
- No-break space (U+00A0)
- En quad (U+2000)
- Em quad (U+2001)
- Six-per-em space (U+2006)
- Figure space (U+2007)
- Punctuation space (U+2008)
- Thin space (U+2009)
- Hair space (U+200A)
- Ideographic space (U+3000)
- and more

## Install (Chrome)

1. Download or clone this repo.
2. Open Chrome and go to `chrome://extensions`.
3. Enable "Developer mode" (top-right).
4. Click "Load unpacked" and select the project folder.

The content script runs automatically on all pages you visit.

## How it works

- Scans text nodes and wraps target characters in `<span>` elements with a highlight class.
- Uses a `MutationObserver` to handle dynamic content.
- Avoids editing inside inputs, code blocks, pre tags, and editable content.

## Uninstall

Remove the extension from `chrome://extensions`.

## Privacy Policy

This extension does not collect, store, or transmit any personal data or browsing information. It operates entirely locally in your browser to highlight specific Unicode characters on webpages. No data is sent to external servers or third parties.

### What the extension does:

- Scans text content on webpages for specific Unicode characters
- Highlights these characters with CSS styling
- All processing happens locally in your browser

### What the extension does NOT do:

- Collect personal information
- Track browsing history
- Store any data
- Send information to external servers
- Access sensitive website data
