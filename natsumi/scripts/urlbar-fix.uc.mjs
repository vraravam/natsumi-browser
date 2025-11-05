// ==UserScript==
// @include   main
// @ignorecache
// ==/UserScript==

/*

Natsumi Browser - Welcome to your personal internet.

Copyright (c) 2024-present Green (@greeeen-dev)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

*/

import * as ucApi from "chrome://userchromejs/content/uc_api.sys.mjs";

function selectUrlbarContents() {
    // Check if floating URLbar is disabled
    if (ucApi.Prefs.get("natsumi.urlbar.do-not-float").exists()) {
        if (ucApi.Prefs.get("natsumi.urlbar.do-not-float").value) {
            return;
        }
    }

    let urlbarInput = document.getElementById("urlbar-input");
    urlbarInput.select();
}

// Create mutator listener
let urlbarNode = document.getElementById("urlbar");
let wasSelected = false;
let wasOpened = false;

if (urlbarNode) {
    let urlbarMutationObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            // Check if open attribute exists
            if (urlbarNode.hasAttribute("open") && !wasSelected && !wasOpened) {
                selectUrlbarContents();
            }

            wasOpened = urlbarNode.hasAttribute("open");
            wasSelected = urlbarNode.hasAttribute("usertyping");
        });
    });

    // Observe the URL bar for changes
    urlbarMutationObserver.observe(urlbarNode, {
        attributes: true,
        attributeFilter: ["open", "usertyping"]
    });
}