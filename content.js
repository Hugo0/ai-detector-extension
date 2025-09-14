(function () {
  const HIGHLIGHT_CLASS = "ai-detector-highlight";
  const HIGHLIGHT_ATTR = "data-ai-detector";

  // Target characters and their labels
  const TARGETS = [
    { chars: ["\u2014"], label: "EM DASH (U+2014)" },
    { chars: ["\u00A0"], label: "NO-BREAK SPACE (U+00A0)" },
    { chars: ["\u2000"], label: "EN QUAD (U+2000)" },
    { chars: ["\u2001"], label: "EM QUAD (U+2001)" },
    { chars: ["\u2002"], label: "EN SPACE (U+2002)" },
    { chars: ["\u2003"], label: "EM SPACE (U+2003)" },
    { chars: ["\u2004"], label: "THREE-PER-EM SPACE (U+2004)" },
    { chars: ["\u2005"], label: "FOUR-PER-EM SPACE (U+2005)" },
    { chars: ["\u2006"], label: "SIX-PER-EM SPACE (U+2006)" },
    { chars: ["\u2007"], label: "FIGURE SPACE (U+2007)" },
    { chars: ["\u2008"], label: "PUNCTUATION SPACE (U+2008)" },
    { chars: ["\u2009"], label: "THIN SPACE (U+2009)" },
    { chars: ["\u200A"], label: "HAIR SPACE (U+200A)" },
    { chars: ["\u202F"], label: "NARROW NO-BREAK SPACE (U+202F)" },
    { chars: ["\u205F"], label: "MEDIUM MATHEMATICAL SPACE (U+205F)" },
    { chars: ["\u1680"], label: "OGHAM SPACE MARK (U+1680)" },
    { chars: ["\u180E"], label: "MONGOLIAN VOWEL SEPARATOR (U+180E)" },
    { chars: ["\u200B"], label: "ZERO WIDTH SPACE (U+200B)" },
    { chars: ["\u3000"], label: "IDEOGRAPHIC SPACE (U+3000)" },
    { chars: ["\uFEFF"], label: "ZERO WIDTH NO-BREAK SPACE (U+FEFF)" },
    // Note: Intentionally excluding U+0020 (regular space) to avoid overwhelming highlight
  ];

  const TARGET_SET = new Set(TARGETS.flatMap((t) => t.chars));
  const TARGET_REGEX = new RegExp(
    "[" + Array.from(TARGET_SET).join("") + "]",
    "g"
  );

  // Characters that have zero width and need special visual handling
  const ZERO_WIDTH_SET = new Set(["\u200B", "\uFEFF", "\u180E"]);

  function isIgnorableNode(node) {
    if (!node) return true;
    if (node.nodeType !== Node.TEXT_NODE) return true;
    const parent = node.parentNode;
    if (!parent || parent.nodeType !== Node.ELEMENT_NODE) return true;
    if (parent.closest("." + HIGHLIGHT_CLASS)) return true;

    const tag = parent.tagName;
    if (!tag) return true;
    switch (tag) {
      case "SCRIPT":
      case "STYLE":
      case "NOSCRIPT":
      case "TEXTAREA":
      case "INPUT":
      case "CODE":
      case "PRE":
      case "SVG":
      case "MATH":
        return true;
      default:
        break;
    }
    // Skip contenteditable regions to avoid interfering with typing
    if (parent.isContentEditable) return true;
    return false;
  }

  function createHighlightSpan(char) {
    const span = document.createElement("span");
    span.className = HIGHLIGHT_CLASS;
    span.setAttribute(HIGHLIGHT_ATTR, "true");
    span.textContent = char;

    const info = TARGETS.find((t) => t.chars.includes(char));
    const label = info ? info.label : "Target Character";
    const codePoint =
      "U+" + char.codePointAt(0).toString(16).toUpperCase().padStart(4, "0");
    span.title = label + " " + "(" + codePoint + ")";

    // Add subtype class for CSS hooks
    span.classList.add("ai-detector-" + codePoint.toLowerCase());
    if (ZERO_WIDTH_SET.has(char)) {
      span.classList.add("ai-detector-zerowidth");
      span.setAttribute("data-ai-zerowidth", "true");
    }
    return span;
  }

  function processTextNode(textNode) {
    if (isIgnorableNode(textNode)) return;

    const text = textNode.nodeValue;
    if (!text || !TARGET_REGEX.test(text)) return;

    // Reset regex state for repeated runs
    TARGET_REGEX.lastIndex = 0;

    const parent = textNode.parentNode;
    const frag = document.createDocumentFragment();

    let lastIndex = 0;
    let match;
    while ((match = TARGET_REGEX.exec(text)) !== null) {
      const index = match.index;
      if (index > lastIndex) {
        frag.appendChild(document.createTextNode(text.slice(lastIndex, index)));
      }
      const char = match[0];
      frag.appendChild(createHighlightSpan(char));
      lastIndex = index + char.length;
    }

    if (lastIndex < text.length) {
      frag.appendChild(document.createTextNode(text.slice(lastIndex)));
    }

    try {
      parent.replaceChild(frag, textNode);
    } catch (_) {
      // If replace fails due to dynamic changes, skip gracefully
    }
  }

  function walkAndProcess(root) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        if (isIgnorableNode(node)) return NodeFilter.FILTER_REJECT;
        if (!node.nodeValue) return NodeFilter.FILTER_REJECT;
        return TARGET_REGEX.test(node.nodeValue)
          ? NodeFilter.FILTER_ACCEPT
          : NodeFilter.FILTER_REJECT;
      },
    });

    const nodes = [];
    let node;
    while ((node = walker.nextNode())) {
      nodes.push(node);
    }

    for (const n of nodes) {
      processTextNode(n);
    }
  }

  function onMutations(mutations) {
    for (const m of mutations) {
      if (m.type === "characterData" && m.target) {
        processTextNode(m.target);
        continue;
      }
      if (m.type === "childList") {
        for (const node of m.addedNodes) {
          if (node.nodeType === Node.TEXT_NODE) {
            processTextNode(node);
          } else if (node.nodeType === Node.ELEMENT_NODE) {
            walkAndProcess(node);
          }
        }
      }
    }
  }

  function initObserver() {
    const observer = new MutationObserver(onMutations);
    observer.observe(document.documentElement || document.body, {
      subtree: true,
      childList: true,
      characterData: true,
    });
  }

  function init() {
    try {
      walkAndProcess(document.body || document.documentElement);
      initObserver();
    } catch (_) {
      // No-op
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
