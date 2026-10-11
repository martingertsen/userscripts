// ==UserScript==
// @name         YouTube Music: Auto Continue
// @namespace    http://tampermonkey.net/
// @version      1.0.0
// @description  Automatically confirms the "Still watching/listening" prompt
// @author       Martin Gertsen
// @match        https://music.youtube.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=music.youtube.com
// @grant        none
// @license      MIT
// @downloadURL https://raw.githubusercontent.com/martingertsen/userscripts/main/youtubemusicautocontinue.user.js
// @updateURL   https://raw.githubusercontent.com/martingertsen/userscripts/main/youtubemusicautocontinue.user.js
// ==/UserScript==

(function () {
    'use strict';
    console.log("[YT-MUSIC-AUTO-CONTINUE] Script loaded");
    function findAndClickContinue() {

        // Find visible dialogs/popups
        const dialogs = [...document.querySelectorAll(
            '[role="dialog"], tp-yt-paper-dialog, ytmusic-popup-container, ytmusic-you-there-renderer'
        )]
        .filter(d => d.offsetParent !== null);

        for (const dialog of dialogs) {
            const dialogText = dialog.innerText.toLowerCase();

            // Extra safety check
            const looksLikeContinuePrompt =
                  dialogText.includes('videoen er sat på pause') ||
                  dialogText.includes('vil du se videre') ||
                  dialogText.includes('continue') ||
                  dialogText.includes('still watching') ||
                  dialogText.includes('still listening') ||
                  dialogText.includes('fortsæt');

            if (!looksLikeContinuePrompt) {
                continue;
            }

            const buttons = [...dialog.querySelectorAll('button')];

            const continueButton = buttons.find(button => {
                const text = button.innerText.toLowerCase().trim();
                return text === 'continue' ||
                       text === 'yes' ||
                       text === 'fortsæt' ||
                       text === 'ja';
            });

            if (continueButton) {
                console.log("[YT-MUSIC-AUTO-CONTINUE] Prompt detected");
                continueButton.click();
            }
        }
    }

    setInterval(findAndClickContinue, 5000);
})();
