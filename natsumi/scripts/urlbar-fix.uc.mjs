// ==UserScript==
// @include   main
// @ignorecache
// ==/UserScript==

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