 // ==UserScript==
 // @name         Gallery Controls
 // @namespace    http://tampermonkey.net/
 // @version      1.0.0
 // @updateURL    https://github.com/martingertsen/userscripts/raw/refs/heads/main/discuitgallerycontrols.user.js
 // @downloadURL  https://github.com/martingertsen/userscripts/raw/refs/heads/main/discuitgallerycontrols.user.js
 // @description  Relocated the gallery controlls to below the gallery images.
 // @author       Martin Gertsen

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
