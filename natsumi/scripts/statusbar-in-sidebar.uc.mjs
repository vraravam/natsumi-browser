// ==UserScript==
// @include   main
// @ignorecache
// ==/UserScript==

import * as ucApi from "chrome://userchromejs/content/uc_api.sys.mjs";

function copySidebarWidth() {
    // Only run this if vertical tabs are enabled
    if (!ucApi.Prefs.get("sidebar.verticalTabs").value) {
        return;
    }

    let sidebar = document.querySelector("#sidebar-main");

    // Usually the sidebar should always exist, but if it doesn't, we can just return
    if (!sidebar) {
        return;
    }

    let width = sidebar.style.width;

    if (!width || width.length === 0) {
        width = "242px";
    }

    let statusBar = document.querySelector("#nora-statusbar");
    let navBar = document.querySelector("#navigator-toolbox");

    if (statusBar) {
        statusBar.style.setProperty("--natsumi-sidebar-width", width);
    }

    if (navBar) {
        navBar.style.setProperty("--natsumi-sidebar-width", width);
    }
}

function copySidebarOptionsHeight() {
    // The buttons strip is in a shadow root, so we'll need to do some more work here
    let sidebarNode = document.querySelector("#sidebar-main").querySelector("sidebar-main");
    let sidebarNodeSR = sidebarNode.shadowRoot;

    if (!sidebarNodeSR) {
        console.warn("Sidebar shadow root not found, likely needs to be ran later.");
        return;
    }

    let sidebarOptions = sidebarNodeSR.querySelector(".tools-and-extensions");

    if (!sidebarOptions) {
        return;
    }

    const height = sidebarOptions.offsetHeight;

    let statusBar = document.querySelector("#nora-statusbar");

    // This is a Floorp-only feature, so this may or may not exist
    if (statusBar) {
        return;
    }

    // Set a variable to the sidebar options height
    statusBar.style.setProperty("--natsumi-sidebar-options-height", `${height}px`);
}

function copyStatusBarHeight() {
    let sidebarNode = document.querySelector("#sidebar-main");

    // Set a variable to the status bar height
    let statusBar = document.querySelector("#nora-statusbar");

    if (!statusBar) {
        return;
    }

    // For some reason, offsetHeight is null but scrollHeight is correct.
    // Probably due to nora-statusbar having absolute position
    const height = statusBar.scrollHeight;
    sidebarNode.style.setProperty("--natsumi-statusbar-height", `${height}px`);
}

let sidebar = document.querySelector("#sidebar-main");
let isFloorp = false;

if (ucApi.Prefs.get("natsumi.browser.type").exists) {
    isFloorp = ucApi.Prefs.get("natsumi.browser.type").value === "floorp";
}

if (!sidebar) {
    console.warn("Sidebar not found, trying to find it...");
    for (let i = 0; i < 10; i++) {
        sidebar = document.querySelector("#sidebar-main");

        // If the sidebar exists, we can stop searching
        if (sidebar) {
            break;
        }

        // Wait for 1s before trying again
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
}

console.log("Sidebar found!", sidebar);

if (sidebar) {
    // If the sidebar exists (and the browser is Floorp), copy its width

    copySidebarWidth();
    copyStatusBarHeight();

    let sidebarObserver = new MutationObserver(function (mutations) {
        mutations.forEach(function (mutationRecord) {
            copySidebarWidth();

            // Also copy sidebar toolbar heights in case things change
            copyStatusBarHeight();

            // Copy sidebar options height if the shadow root exists
            let sidebarNodeSR = mutationRecord.target.querySelector("sidebar-main").shadowRoot;
            if (sidebarNodeSR) {
                copySidebarOptionsHeight();
            }
        });
    });
    sidebarObserver.observe(sidebar, {attributes: true, attributeFilter: ["style"]});

    if (isFloorp) {
        let statusBar = document.querySelector("#nora-statusbar");
        let statusBarObserver = new MutationObserver(function (mutations) {
            mutations.forEach(function (mutationRecord) {
                copyStatusBarHeight();
            });
        });
        statusBarObserver.observe(statusBar, {attributes: true, childList: true, subtree: true});
    }
}