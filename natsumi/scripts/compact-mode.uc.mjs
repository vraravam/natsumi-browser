// ==UserScript==
// @include   main
// @ignorecache
// ==/UserScript==

/*

Natsumi Browser - A userchrome for Firefox and more that makes things flow.

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

let sidebarHovered = 0;

function handleElementEnter(event) {
    // Check if compact mode is enabled thru body attributes
    if (!document.body.hasAttribute("natsumi-compact-mode")) {
        return;
    }

    if (event.target.id === "sidebar-main") {
        sidebarHovered++;
    } else if (event.target.id === "navigator-toolbox") {
        if (ucApi.Prefs.get("natsumi.theme.single-toolbar").exists()) {
            if (ucApi.Prefs.get("natsumi.theme.single-toolbar").value) {
                sidebarHovered++;
            }
        }

        document.body.setAttribute("natsumi-compact-navbar-hover", "")
    } else if (event.target.id === "nora-statusbar" || event.target.id === "status-bar") {
        if (event.target.classList.contains("hidden") || event.target.attributes["collapsed"].value === "true") {
            sidebarHovered++;
        }
    }

    if (sidebarHovered > 0) {
        document.body.setAttribute("natsumi-compact-sidebar-hover", "")
    }
}

function handleElementLeave(event) {
    // Check if compact mode is enabled thru body attributes
    if (!document.body.hasAttribute("natsumi-compact-mode")) {
        return;
    }

    if (event.target.id === "sidebar-main") {
        sidebarHovered--;
    } else if (event.target.id === "navigator-toolbox") {
        if (ucApi.Prefs.get("natsumi.theme.single-toolbar").exists()) {
            if (ucApi.Prefs.get("natsumi.theme.single-toolbar").value) {
                sidebarHovered--;
            }
        }

        if (document.body.hasAttribute("natsumi-compact-navbar-hover")) {
            document.body.removeAttribute("natsumi-compact-navbar-hover");
        }
    } else if (event.target.id === "nora-statusbar" || event.target.id === "status-bar") {
        if (event.target.classList.contains("hidden") || event.target.attributes["collapsed"].value === "true") {
            sidebarHovered--;
        }
    }

    if (sidebarHovered <= 0) {
        document.body.removeAttribute("natsumi-compact-sidebar-hover");
        sidebarHovered = 0;
    }
}

function resetCompactMode() {
    if (document.body.hasAttribute("natsumi-compact-mode")) {
        // Compact mode is still on
        return;
    }

    if (document.body.hasAttribute("natsumi-compact-sidebar-hover")) {
        document.body.removeAttribute("natsumi-compact-sidebar-hover");
    }

    if (document.body.hasAttribute("natsumi-compact-navbar-hover")) {
        document.body.removeAttribute("natsumi-compact-navbar-hover");
    }

    sidebarHovered = 0;
}

let sidebarNode = document.getElementById("sidebar-main");
let navbarNode = document.getElementById("navigator-toolbox");
let statusbarNode = document.getElementById("nora-statusbar") || document.getElementById("status-bar");
if (sidebarNode) {
    sidebarNode.addEventListener("mouseenter", handleElementEnter, true);
    sidebarNode.addEventListener("mouseleave", handleElementLeave, true);
}

if (statusbarNode) {
    statusbarNode.addEventListener("mouseenter", handleElementEnter, true);
    statusbarNode.addEventListener("mouseleave", handleElementLeave, true);
}

if (navbarNode) {
    navbarNode.addEventListener("mouseenter", handleElementEnter, true);
    navbarNode.addEventListener("mouseleave", handleElementLeave, true);
}

let bodyMutationOnserver = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        if (!document.body.hasAttribute("natsumi-compact-mode")) {
            // Reset compact mode
            resetCompactMode();
        }
    });
});
bodyMutationOnserver.observe(document.body, {
    attributes: true,
    attributeFilter: ["natsumi-compact-mode"]
});
