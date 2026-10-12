// ==UserScript==
// @name         Discuit: Gallery Controls
// @namespace    https://github.com/martingertsen/userscripts
// @version      1.1.0
// @updateURL    https://raw.githubusercontent.com/martingertsen/userscripts/main/discuitgallerycontrols.user.js
// @downloadURL  https://raw.githubusercontent.com/martingertsen/userscripts/main/discuitgallerycontrols.user.js
// @description  Relocates the gallery controls below the gallery images and shows the number of the current image next to them.
// @author       Martin Gertsen
// @match        https://discuit.org/*
// @match        https://discuit.net/*
// @icon         https://discuit.org/favicon.png
// @grant        GM_addStyle
// ==/UserScript==

// Credit to trying_to_be for the original version (Gallery Controls):
// https://github.com/roomfullofcommits/discuitstuff/raw/refs/heads/main/gallerycontrols.user.js

GM_addStyle(`
.image-gallery-next-btn {
  right: calc(50% - 180px) !important;
  top: calc(100% - 30px) !important;
  padding: 30px 50px 0 30px !important;

  &.is-previous {
    left: calc(50% - 180px) !important;
    right: unset !important;
    padding: 30px 30px 0 50px !important;
  }
}
`);

GM_addStyle(".image-gallery-images { padding-bottom: 35px; }");

// Circle with the number of the current image, placed to the right of the next button.
GM_addStyle(`
.mg-gallery-counter {
  position: absolute;
  z-index: 100;
  left: calc(50% + 145px);
  bottom: 7px;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
  line-height: 1;
  background: rgba(var(--base-fg, 0, 0, 0), 0.8);
  color: var(--color-bg, #fff);
  pointer-events: none;
}
`);

(function() {
    'use strict';

    const COUNTER_CLASS = 'mg-gallery-counter';

    // Reads the current image index from the highlighted dot and updates (or creates/removes) the counter.
    function updateCounter(gallery) {
        const dots = gallery.querySelectorAll('.image-gallery-dots .image-gallery-dot');
        let counter = gallery.querySelector(':scope > .' + COUNTER_CLASS);

        // The controls are only shown when there is more than one image.
        if (dots.length <= 1) {
            if (counter) counter.remove();
            return;
        }

        if (!counter) {
            counter = document.createElement('div');
            counter.className = COUNTER_CLASS;
            gallery.appendChild(counter);
        }

        let index = 0;
        dots.forEach((dot, i) => {
            if (dot.classList.contains('is-highlighted')) index = i;
        });
        counter.textContent = String(index + 1);
    }

    function updateAllCounters(root) {
        if (root.matches && root.matches('.image-gallery')) {
            updateCounter(root);
        }
        for (const gallery of root.querySelectorAll('.image-gallery')) {
            updateCounter(gallery);
        }
    }

    // Discuit is a single page app: galleries appear and disappear, and the highlighted dot changes on navigation.
    const observer = new MutationObserver(mutations => {
        const galleries = new Set();
        for (const mutation of mutations) {
            if (mutation.type === 'attributes') {
                const gallery = mutation.target.closest('.image-gallery');
                if (gallery) galleries.add(gallery);
            } else {
                for (const node of mutation.addedNodes) {
                    if (node.nodeType !== Node.ELEMENT_NODE) continue;
                    if (node.matches('.image-gallery')) {
                        galleries.add(node);
                    } else {
                        for (const gallery of node.querySelectorAll('.image-gallery')) {
                            galleries.add(gallery);
                        }
                    }
                }
            }
        }
        for (const gallery of galleries) {
            updateCounter(gallery);
        }
    });

    updateAllCounters(document.body);
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
})();
