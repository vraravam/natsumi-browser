// ==UserScript==
// @include   main
// @loadOrder 11
// @ignorecache
// ==/UserScript==

import * as ucApi from "chrome://userchromejs/content/uc_api.sys.mjs";

function getPanelSidebarPosition() {
    let isRight = false;
    if (ucApi.Prefs.get("floorp.panelSidebar.config").exists()) {
        const panelSidebarConfig = JSON.parse(ucApi.Prefs.get("floorp.panelSidebar.config").value);
        isRight = panelSidebarConfig["position_start"] ?? false;
    }

    if (isRight) {
        document.body.setAttribute("natsumi-panel-sidebar-on-right", "");
    } else {
        document.body.removeAttribute("natsumi-panel-sidebar-on-right");
    }
}

let isFloorp = false;
if (ucApi.Prefs.get("natsumi.browser.type").exists) {
    isFloorp = ucApi.Prefs.get("natsumi.browser.type").value === "floorp";
}

if (isFloorp) {
    let panelSidebarBoxObserver = new MutationObserver(() => {
        getPanelSidebarPosition();
    });
    let panelSidebarBox = document.getElementById("panel-sidebar-box");
    if (panelSidebarBox) {
        panelSidebarBoxObserver.observe(panelSidebarBox, {
            attributes: true,
            attributeFilter: ["data-floating-splitter-side"]
        });
    } else {
        let browserObserver = new MutationObserver(() => {
            panelSidebarBox = document.getElementById("panel-sidebar-box");
            if (panelSidebarBox) {
                panelSidebarBoxObserver.observe(panelSidebarBox, {
                    attributes: true,
                    attributeFilter: ["data-floating-splitter-side"]
                });
                browserObserver.disconnect();
            }
        });
        let browser = document.getElementById("browser");
        if (browser) {
            browserObserver.observe(browser, {childList: true});
        }
    }

    getPanelSidebarPosition();
}