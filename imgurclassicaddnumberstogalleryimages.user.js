// ==UserScript==
// @name         Imgur: Classic design: Add numbers to gallery images
// @namespace    http://tampermonkey.net/
// @version      1.0.0
// @description  Adds numbers to the images in posts, indicating their position in the album, so you can refer to them in comments.
// @author       Martin Gertsen
// @match        https://imgur.com/gallery/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=imgur.com
// @grant        none
// @license      MIT
// @downloadURL https://raw.githubusercontent.com/martingertsen/userscripts/main/imgurclassicaddnumberstogalleryimages.user.js
// @updateURL   https://raw.githubusercontent.com/martingertsen/userscripts/main/imgurclassicaddnumberstogalleryimages.user.js
// ==/UserScript==

(function() {
    'use strict';

    if (typeof imgur === 'undefined') {
      // This is not the old design.
      return; 
    }

    const mutationObserver = new MutationObserver(mutations => {
        for (const mutation of mutations) {
            for (const node of mutation.addedNodes) {
                if (node.nodeType === Node.ELEMENT_NODE)
                {
                    processAddedElement(node);
                }
            }
        }
    });

    // Add them to images already loaded.
    for (const image of document.querySelectorAll('.post-image-container')) {
        processAddedElement(image);
    }
  
    // Add them to any images loaded later.
    mutationObserver.observe(document.querySelector('.post-images'), { childList: true, subtree: true });

    function processAddedElement(node) {
        if (!node.classList.contains('post-image-container')) {
          return;
        }

        let images = getImagesData();
        let index = (images === null || images.length === 0) ? 1 : images.findIndex(a => a.hash === node.id) + 1;
        let newElement = document.createElement('pre');
        newElement.textContent = `#${index}`;
        if (index > 1) node.prepend(newElement);
    }

    function getImagesData() {
        let node = document.querySelector('form.caption-create');
        // The rest of the name past the $ is not always identical.
        for (const propertyKey in node) {
            if (propertyKey.startsWith('__reactInternalInstance$')) {
                let data = node[propertyKey]._currentElement._owner._instance.props.image.album_images;
                if (data === undefined) {
                  // If there's only one image, sometimes this property doesn't exist.
                  return null; 
                }
                return Array.isArray(data) ? data : data.images; // Oddly enough, on a fresh load, it's one type, and when navigating to a new post, it's the other.
            }
        }

        return null;
    }
})();
