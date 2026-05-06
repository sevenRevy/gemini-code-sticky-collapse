// ==UserScript==
// @name         Gemini Code Collapse - Sticky Header Toggle
// @namespace    https://github.com/sevenRevy
// @version      1.0
// @description  Expand code block parent width and add Show/Hide toggle to Gemini's sticky code header
// @author       sevenRevy
// @match        https://gemini.google.com/*
// @match        https://business.gemini.google/*
// @grant        none
// @license      GPL3
// @icon         https://upload.wikimedia.org/wikipedia/commons/thumb/8/8f/Google-gemini-icon.svg/960px-Google-gemini-icon.svg.png
// ==/UserScript==

(function () {
  "use strict";

  /************************************************************
   * CONFIG
   ************************************************************/
  const CODE_BLOCK_MAX_WIDTH = "90vw"; // e.g. "100vw", "1200px"

  const CSS = `
    .gm-btn {
      background: transparent;
      border: none;
      color: #5f6368;
      padding: 2px 6px;
      font-size: 12px;
      cursor: pointer;
    }
    .gm-btn:hover {
      background: rgba(60,64,67,.08);
      border-radius: 4px;
    }

    /* expand constraining parent */
    .gm-expanded-parent {
      max-width: ${CODE_BLOCK_MAX_WIDTH} !important;
      padding-left: 24px !important;
      padding-right: 24px !important;
      box-sizing: border-box !important;
    }

    /* collapse control */
    .gm-code-hidden {
      display: none !important;
    }

    /* sticky code header */
    .gm-sticky-header {
      position: sticky !important;
      top: 0;
      z-index: 5;
      background: var(--surface-container, #fff);
    }

    /* place our toggle nicely in Gemini header */
    .gm-header-buttons {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-left: auto;
    }
  `;

  const style = document.createElement("style");
  style.textContent = CSS;
  document.head.append(style);

  function findConstrictingAncestor(el) {
    let node = el.parentElement;
    while (node && node !== document.body) {
      const cs = getComputedStyle(node);
      if (cs.maxWidth && cs.maxWidth !== "none") {
        const px = parseFloat(cs.maxWidth);
        if (!isNaN(px) && px < window.innerWidth * 0.95) return node;
      }
      node = node.parentElement;
    }
    return null;
  }

  function enhance(pre) {
    if (pre.dataset.gmEnhanced) return;
    pre.dataset.gmEnhanced = "1";

    const code = pre.querySelector("code");
    if (!code) return;

    // collapse initially
    code.classList.add("gm-code-hidden");

    // expand parent width once
    const parent = findConstrictingAncestor(pre);
    if (parent && !parent.dataset.gmExpanded) {
      parent.dataset.gmExpanded = "1";
      parent.classList.add("gm-expanded-parent");
    }

    // locate Gemini code block wrapper + header
    const codeBlock = pre.closest("code-block");
    if (!codeBlock) return;

    const header = codeBlock.querySelector(".code-block-decoration");
    if (!header || header.dataset.gmEnhanced) return;
    header.dataset.gmEnhanced = "1";

    header.classList.add("gm-sticky-header");

    // find Gemini's existing buttons container
    let btnHost = header.querySelector(".buttons");
    if (!btnHost) {
      btnHost = document.createElement("div");
      btnHost.className = "buttons";
      header.appendChild(btnHost);
    }

    btnHost.classList.add("gm-header-buttons");

    // --- Show / Hide toggle ---
    const btnToggle = document.createElement("button");
    btnToggle.className = "gm-btn";
    btnToggle.textContent = "Show";

    btnToggle.addEventListener("click", () => {
      const hidden = code.classList.toggle("gm-code-hidden");
      btnToggle.textContent = hidden ? "Show" : "Hide";
    });

    btnHost.appendChild(btnToggle);
  }

  function scan() {
    document.querySelectorAll("pre").forEach(enhance);
  }

  scan();
  new MutationObserver(scan).observe(document.body, {
    childList: true,
    subtree: true,
  });
})();
