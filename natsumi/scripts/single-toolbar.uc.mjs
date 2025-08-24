// ==UserScript==
// @include   main
// @ignorecache
// ==/UserScript==

import * as ucApi from "chrome://userchromejs/content/uc_api.sys.mjs";

let hoverTimeout = null;
let hoveredElements = 0;

function setHover(isWindowButton = false) {
    let singleToolbarEnabled = false;
    if (ucApi.Prefs.get("natsumi.theme.single-toolbar").exists()) {
        singleToolbarEnabled = ucApi.Prefs.get("natsumi.theme.single-toolbar").value;
    }

    if (!singleToolbarEnabled) {
        hoveredElements = 0;
        document.body.removeAttribute("natsumi-bookmarks-hover");
        return;
    }

    if (isWindowButton) {
        let isMac = Services.appinfo.OS.toLowerCase() !== "darwin";
        let forcedLeft = false;

        if (ucApi.Prefs.get("natsumi.theme.force-window-controls-to-left").exists()) {
            forcedLeft = ucApi.Prefs.get("natsumi.theme.force-window-controls-to-left").value;
        }

        if ((isMac || forcedLeft) && isWindowButton) {
            return;
        }
    }

    if (hoverTimeout) {
        clearTimeout(hoverTimeout);
    }

    hoveredElements++;
    document.body.setAttribute("natsumi-bookmarks-hover", "");
}

function removeHover(isWindowButton = false) {
    let singleToolbarEnabled = false;
    if (ucApi.Prefs.get("natsumi.theme.single-toolbar").exists()) {
        singleToolbarEnabled = ucApi.Prefs.get("natsumi.theme.single-toolbar").value;
    }

    if (!singleToolbarEnabled) {
        hoveredElements = 0;
        document.body.removeAttribute("natsumi-bookmarks-hover");
        return;
    }

    if (isWindowButton) {
        let isMac = Services.appinfo.OS.toLowerCase() !== "darwin";
        let forcedLeft = false;

        if (ucApi.Prefs.get("natsumi.theme.force-window-controls-to-left").exists()) {
            forcedLeft = ucApi.Prefs.get("natsumi.theme.force-window-controls-to-left").value;
        }

        if ((isMac || forcedLeft) && isWindowButton) {
            return;
        }
    }

    hoveredElements--;
    if (hoveredElements > 0) {
        return;
    } else if (hoveredElements < 0) {
        hoveredElements = 0;
    }

    hoverTimeout = setTimeout(() => {
        document.body.removeAttribute("natsumi-bookmarks-hover");
    }, 1000);
}

function detectBookmarkHover() {
    let bookmarksToolbar = document.getElementById("PersonalToolbar");
    let windowButtonsContainer = document.querySelector("#PersonalToolbar .titlebar-buttonbox-container");
    let isMac = Services.appinfo.OS.toLowerCase() === "darwin";
    console.log(windowButtonsContainer);

    if (!windowButtonsContainer && !isMac) {
        let originalWindowButtonsContainer = document.querySelector(".titlebar-buttonbox-container");
        console.log(originalWindowButtonsContainer);
        windowButtonsContainer = originalWindowButtonsContainer.cloneNode(true);
        bookmarksToolbar.appendChild(windowButtonsContainer);
    }

    if (bookmarksToolbar) {
        bookmarksToolbar.addEventListener("mouseover", (event) => {
            setHover();
        });
        bookmarksToolbar.addEventListener("mouseout", (event) => {
            removeHover();
        });
    }

    if (windowButtonsContainer) {
        windowButtonsContainer.addEventListener("mouseover", (event) => {
            console.log(event);
            setHover(true);
        });
        windowButtonsContainer.addEventListener("mouseout", (event) => {
            removeHover(true);
        });
    }
}

detectBookmarkHover();