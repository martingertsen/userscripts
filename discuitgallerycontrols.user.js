
// ==UserScript==
// @name         Discuit: Gallery Controls
// @namespace    https://github.com/martingertsen/userscripts
// @version      1.0.0
// @updateURL    https://raw.githubusercontent.com/martingertsen/userscripts/main/discuitgallerycontrols.user.js
// @downloadURL  https://raw.githubusercontent.com/martingertsen/userscripts/main/discuitgallerycontrols.user.js
// @description  Relocates the gallery controls below the gallery images.
// @author       Martin Gertsen
// @match        https://discuit.org/*
// @match        https://discuit.net/*
// @icon         https://discuit.org/favicon.png
// @grant        GM_addStyle
// ==/UserScript==

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
