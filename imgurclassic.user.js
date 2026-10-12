// ==UserScript==
// @name         Imgur: Classic design
// @namespace    http://tampermonkey.net/
// @version      1.0.0
// @description  Collection of fixes and improvements for imgur's classic design: 500 character comment limit, numbers on gallery images, fixed HTML escape sequences in descriptions, vote counts on comments (also works in the new design), hidden "via Android/iPhone" badges and visible line breaks in comments.
// @author       Martin Gertsen
// @match        https://imgur.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=imgur.com
// @grant        none
// @license      MIT
// @downloadURL https://raw.githubusercontent.com/martingertsen/userscripts/main/imgurclassic.user.js
// @updateURL   https://raw.githubusercontent.com/martingertsen/userscripts/main/imgurclassic.user.js
// ==/UserScript==

// This script merges the following scripts into one:
// - Imgur: Add vote counts to comments (credit to Corrodias: https://update.greasyfork.org/scripts/481387/Imgur%3A%20add%20vote%20counts%20to%20comments.user.js)
// - Imgur: Classic design: Add numbers to gallery images
// - Imgur: Classic design: Fix Comment 500 character Limit (credit to SleepProgger: https://update.greasyfork.org/scripts/463287/ImgurComment500Limit.user.js)
// - Imgur: Classic design: Enable line breaks in comments (credit to Corrodias: https://update.greasyfork.org/scripts/486043/Imgur%3A%20enable%20line%20breaks%20in%20comments%20in%20the%20old%20design.user.js)
// - Imgur: Classic design: Fix HTML escape sequences (credit to Corrodias: https://update.greasyfork.org/scripts/481153/Imgur%3A%20fix%20HTML%20escape%20sequences%20in%20the%20old%20design.user.js)

// TODO (vote counts): In the new design, navigating to the user profile or to different "tabs" within the profile doesn't reload the page like it does in the old design, and this approach doesn't work for that. It may also be inefficient to listen to *every* mutation until then.

(function() {
    'use strict';

    //////////////////////////////////////////////////
    // Shared state and helpers
    //////////////////////////////////////////////////

    const isOldDesign = (typeof imgur !== 'undefined'); // This object only seems to exist in the old design.
    const isGallery = window.location.pathname.startsWith('/gallery/');
    const isUserPage = window.location.pathname.startsWith('/user/');

    // The target element is not necessarily loaded before the script runs. Wait for it.
    function waitForElement(selector) {
        return new Promise(resolve => {
            if (document.querySelector(selector)) {
                return resolve(document.querySelector(selector));
            }

            const observer = new MutationObserver(() => {
                if (document.querySelector(selector)) {
                    observer.disconnect();
                    resolve(document.querySelector(selector));
                }
            });

            observer.observe(document.body, { childList: true, subtree: true });
        });
    }

    // Finds the React property on a node whose key starts with the given prefix.
    // The rest of the name past the $ is not always identical.
    function getReactProperty(node, prefix) {
        if (node === null || node === undefined) {
            return null;
        }
        for (const propertyKey in node) {
            if (propertyKey.startsWith(prefix)) {
                return node[propertyKey];
            }
        }
        return null;
    }

    // Creates an observer that calls the callback for every added element node.
    function createAddedElementObserver(callback) {
        return new MutationObserver(mutations => {
            for (const mutation of mutations) {
                for (const node of mutation.addedNodes) {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        callback(node);
                    }
                }
            }
        });
    }

    // Runs a feature and logs any error, so one failing feature doesn't stop the others.
    function runFeature(name, feature) {
        try {
            feature();
        } catch (error) {
            console.error(`[Imgur: Classic design] Feature "${name}" failed:`, error);
        }
    }

    //////////////////////////////////////////////////
    // Feature: 500 character comment limit (all pages, classic design)
    //////////////////////////////////////////////////

    function featureComment500Limit() {
        function _injectME() {
            function _func() {
                Imgur.Caption.Reply.defaultProps.maxLength = 500;
                var __hook_ajax = $.ajax; $.ajax = function(x) {
                    // The only way i found to circumvent the character limit is to use the "new" API.
                    // There probably is some nicer way, but meh this works
                    if (!x.url || !x.url.startsWith("/gallery/action/caption/")) {
                        return __hook_ajax(x);
                    }
                    // Rewrite request to the "new" API format
                    var nData = {};
                    var s = x.url.split("/");
                    nData.post_id = s[s.length - 1];
                    nData.comment = x.data.caption;
                    nData.platform = "api";
                    nData.parent_id = x.data.parent_id;
                    nData.has_admin_badge = false;
                    x.data = JSON.stringify(nData);
                    x.url = "https://api.imgur.com/comment/v1/comments?client_id=" + imgur._.apiClientId;
                    x.xhrFields = { withCredentials: true };
                    x.headers = { 'Content-Type': 'application/vnd.imgur.v1+json' };
                    // We also have to rewrite the response now which sucks
                    x.dataFilter = function(r, type) {
                        r = JSON.parse(r);
                        var ret = {
                            success: true,
                            data: {
                                caption: {
                                    id: r.id,
                                    hash: r.post.id,
                                    caption: r.comment,
                                    author: r.account.username,
                                    author_id: r.account_id,
                                    ups: r.upvote_count,
                                    downs: r.downvote_count,
                                    best_score: 0.2, // No clue where to get this, so lets just fake it
                                    points: r.point_count,
                                    datetime: r.created_at.replace("T", " ").replace("Z", ""),
                                    parent_id: r.parent_id,
                                    deleted: r.deleted_at != null,
                                    on_album: r.post.is_album,
                                    album_cover: r.post.cover_id, // Not sure this is correct
                                    title: "", // No clue. Post title this reply is on ?
                                    platform: "yoMomma",
                                    has_admin_badge: false, // Naw, don't have that
                                }
                            }
                        };
                        return JSON.stringify(ret);
                    };
                    return __hook_ajax(x);
                };
            }
            function _waitForImgur() {
                if (window.Imgur && Imgur.Caption) {
                    _func();
                    return;
                }
                setTimeout(_waitForImgur, 250);
            }
            _waitForImgur();
        }
        var s = document.createElement('script');
        s.textContent = '(' + _injectME + ')()';
        document.head.appendChild(s);
    }

    //////////////////////////////////////////////////
    // Feature: Numbers on gallery images (gallery pages, classic design)
    //////////////////////////////////////////////////

    function featureGalleryImageNumbers() {
        if (!isOldDesign || !isGallery) {
            return;
        }

        const postImages = document.querySelector('.post-images');
        if (postImages === null) {
            return;
        }

        function getImagesData() {
            const node = document.querySelector('form.caption-create');
            const instance = getReactProperty(node, '__reactInternalInstance$');
            if (instance === null) {
                return null;
            }
            const data = instance._currentElement._owner._instance.props.image.album_images;
            if (data === undefined) {
                // If there's only one image, sometimes this property doesn't exist.
                return null;
            }
            return Array.isArray(data) ? data : data.images; // Oddly enough, on a fresh load, it's one type, and when navigating to a new post, it's the other.
        }

        function processAddedElement(node) {
            if (!node.classList.contains('post-image-container')) {
                return;
            }

            const images = getImagesData();
            const index = (images === null || images.length === 0) ? 1 : images.findIndex(a => a.hash === node.id) + 1;
            const newElement = document.createElement('pre');
            newElement.textContent = `#${index}`;
            if (index > 1) node.prepend(newElement);
        }

        // Add them to images already loaded.
        for (const image of document.querySelectorAll('.post-image-container')) {
            processAddedElement(image);
        }

        // Add them to any images loaded later.
        createAddedElementObserver(processAddedElement).observe(postImages, { childList: true, subtree: true });
    }

    //////////////////////////////////////////////////
    // Feature: Fix HTML escape sequences in post descriptions (gallery pages, classic design)
    //////////////////////////////////////////////////

    function featureFixHtmlEscapes() {
        if (!isOldDesign || !isGallery) {
            return;
        }

        function replaceText(post) {
            // This is empty if the current page is not a post.
            const description = post.getElementsByClassName('post-image-description');
            for (const a of description) {
                a.textContent = a.textContent
                    .replaceAll('&#34;', '"')
                    .replaceAll('&#39;', "'")
                    .replaceAll('&gt;', '>')
                    .replaceAll('&lt;', '<')
                    .replaceAll('&amp;', '&');
            }
        }

        function processAddedNode(node) {
            // Only act if a new post has been loaded.
            if (!node.classList.contains('post-image-container')) {
                return;
            }
            replaceText(node);
        }

        // Run the replacement now in case this is a post.
        replaceText(document.body);

        // Monitor dynamically loaded content, for when the user navigates to a new post. Observe as little as possible.
        const observer = createAddedElementObserver(processAddedNode);
        for (const a of document.body.getElementsByClassName('post-images')) {
            observer.observe(a, { attributes: false, childList: true, subtree: true });
        }
    }

    //////////////////////////////////////////////////
    // Feature: Comments (gallery and user pages)
    // - Vote counts (+ and -) next to the points (classic and new design)
    // - Hide "via Android" and "via iPhone" badges (classic design)
    // - Visible line breaks in comments (classic design)
    //////////////////////////////////////////////////

    function featureComments() {
        if (!isGallery && !isUserPage) {
            return;
        }

        const commentsSectionSelector = isOldDesign ? '#captions' : isGallery ? '.CommentsList-comments' : '.ProfileComments';

        waitForElement(commentsSectionSelector).then(commentsSection => {
            // Update all currently displayed comments.
            updateComments(commentsSection);
            // Do the same on any comment that is loaded dynamically.
            const observer = createAddedElementObserver(isOldDesign ? processAddedElementOldDesign : processAddedElementNewDesign);
            observer.observe(commentsSection, { childList: true, subtree: true });
        });

        function processAddedElementOldDesign(node) {
            if (isGallery && node.classList.contains('children')) {
                // Replies were expanded, or navigation to a new post loaded a whole, new set of comments. We can safely update just the new nodes.
                updateComments(node);
            } else if (isGallery && node.classList.contains('comment')) {
                // The user navigated to the "context" or "permalink" of an already displayed comment. Imgur modifies the existing structure rather than replace the nodes.
                updateComments(document.querySelector('#captions')); // The node that was added was a reply, not the top level comment, to replace all of them.
            } else if (!isGallery && node.classList.length === 0 && node.tagName === 'DIV') {
                // Comments on a user's "comments" or "replies" pages just loaded.
                updateComments(node);
            }
        }

        function processAddedElementNewDesign(node) {
            if (isGallery && node.classList.contains('GalleryComment-replies')) {
                // Replies were expanded. We can safely update just the new nodes.
                updateComments(node);
            } else if (isGallery && node.classList.contains('GalleryComment')) {
                // A gallery page loaded comments either due to post navigation or the user choosing the "context" of a post.
                // `.parentElement` simply gets the wrapper that contains this comment and all replies.
                updateComments(node.parentElement);
            } else if (!isGallery && node.classList.contains('ProfileComments-comment')) {
                // Comments on a user's "comments" page just loaded.
                updateComments(node);
            }
        }

        function updateComments(node) {
            hideMobileBadges(node);
            removeOldPointsDetails(node);
            addPointsDetails(node);
            enableLineBreaks(node);
        }

        // --- Hide mobile badges ---

        function hideMobileBadges(node) {
            if (!isOldDesign) return; // It's more complicated in the new design. I'm not bothering with it, for now.
            // Hide the Android/iPhone badges. Do not remove them, or React will break.
            for (const a of node.querySelectorAll('.via')) {
                a.style.display = 'none';
            }
        }

        // --- Vote counts ---

        function removeOldPointsDetails(node) {
            // Remove any existing vote counts so that we can calculate them fresh.
            // This is needed because navigating to the "context" or "permalink" of a comment in the old design doesn't necessarily add new nodes but rather can modify existing ones.
            for (const a of node.querySelectorAll('.points-detail')) {
                a.remove();
            }
        }

        function getPointsDetailsConfig() {
            if (isOldDesign) {
                return {
                    getSubElements: (node) => node.querySelectorAll('.caption'),
                    getCommentDataFunction: getCommentDataOldDesign,
                    newElementType: 'span',
                    newElementClass: 'comment-meta-spacer points-detail',
                    getInsertionPoint: (node) => node.firstChild.firstChild.querySelector('time').previousElementSibling,
                };
            } else if (isGallery) {
                return {
                    getSubElements: (node) => node.querySelectorAll('.GalleryComment'),
                    getCommentDataFunction: getCommentDataNewDesignGallery,
                    newElementType: 'div',
                    newElementClass: 'points undefined points-detail',
                    getInsertionPoint: (node) => node.querySelector('.vote-btn.down'),
                };
            } else {
                return {
                    getSubElements: (node) => node.classList.contains('ProfileComments-comment') ? [node] : node.querySelectorAll('.ProfileComments-comment'),
                    getCommentDataFunction: getCommentDataNewDesignProfile,
                    newElementType: 'span',
                    newElementClass: 'Comment-actionbar-item Comment-actionbar-item--disabled Comment-upvotes',
                    getInsertionPoint: (node) => node.querySelector('.Comment-actionbar').firstElementChild,
                };
            }
        }

        function addPointsDetails(node) {
            const config = getPointsDetailsConfig();
            for (const element of config.getSubElements(node)) {
                // Pull the comment data from the React objects.
                const commentData = config.getCommentDataFunction(element);
                if (commentData === undefined || commentData === null) {
                    continue; // no data found
                }

                // Build then add an element with the vote counts.
                const newElement = document.createElement(config.newElementType);
                newElement.textContent = '(+' + commentData.ups + ', -' + commentData.downs + ')';
                newElement.setAttribute('class', config.newElementClass);

                const previousSibling = config.getInsertionPoint(element);
                if (previousSibling === null) {
                    continue;
                }
                previousSibling.after(newElement);
            }
        }

        function getCommentDataOldDesign(node) {
            const instance = getReactProperty(node, '__reactInternalInstance$');
            if (instance === null) {
                return null;
            }
            return instance._currentElement._owner._instance.props.comment;
        }

        function getCommentDataNewDesignGallery(node) {
            const fiber = getReactProperty(node, '__reactFiber$');
            if (fiber === null) {
                return null;
            }
            const data = fiber.return.memoizedProps.comment;
            return { ups: data.get('upvote_count'), downs: data.get('downvote_count') };
        }

        function getCommentDataNewDesignProfile(node) {
            const props = getReactProperty(node, '__reactProps$');
            if (props === null) {
                return null;
            }
            const data = props.children[1].props.children.props;
            if (data === undefined) {
                return { ups: 0, downs: 0 };
            }
            return { ups: data.upvotes, downs: data.downvotes };
        }

        // --- Line breaks ---

        function enableLineBreaks(node) {
            if (!isOldDesign) return;
            for (const element of node.querySelectorAll('.caption')) {
                // Only touch comments that have React data behind them.
                const commentData = getCommentDataOldDesign(element);
                if (commentData === undefined || commentData === null) {
                    continue;
                }

                // Normally line breaks are new line characters (\n), which aren't displayed as line breaks by a browser. Replace them with <br/> elements, which are.
                const text = element.querySelector('div.usertext > span > span');
                if (text !== null && text.innerHTML != null) {
                    text.innerHTML = text.innerHTML.replaceAll('\n', '<br/>');
                }
            }
        }
    }

    //////////////////////////////////////////////////
    // Run all features
    //////////////////////////////////////////////////

    runFeature('500 character comment limit', featureComment500Limit);
    runFeature('Numbers on gallery images', featureGalleryImageNumbers);
    runFeature('Fix HTML escape sequences', featureFixHtmlEscapes);
    runFeature('Comments', featureComments);
})();
