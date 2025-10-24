// ==UserScript==
// @include   main
// @loadOrder 11
// @ignorecache
// ==/UserScript==

import * as ucApi from "chrome://userchromejs/content/uc_api.sys.mjs";

let wasDisabled = false;

function getPanelSidebarPosition() {
    if (wasDisabled) {
        // We cannot determine the position here, the panel sidebar likely doesn't exist
        return;
    }

    let isRight = false;
    if (ucApi.Prefs.get("floorp.panelSidebar.config").exists()) {
        const panelSidebarConfig = JSON.parse(ucApi.Prefs.get("floorp.panelSidebar.config").value);
        isRight = panelSidebarConfig["position_start"] ?? false;
    }

    isRight = isRight && !checkSidebarRemoved();

    if (isRight) {
        document.body.setAttribute("natsumi-panel-sidebar-on-right", "");
    } else {
        document.body.removeAttribute("natsumi-panel-sidebar-on-right");
    }
}

function checkSidebarRemoved() {
    if (ucApi.Prefs.get("floorp.panelSidebar.enabled").exists()) {
        return !ucApi.Prefs.get("floorp.panelSidebar.enabled").value;
    }

    // This is enabled on Floorp by default, so we'd need to return false here
    return false;
}

let isFloorp = false;
if (ucApi.Prefs.get("natsumi.browser.type").exists) {
    isFloorp = ucApi.Prefs.get("natsumi.browser.type").value === "floorp";
}

if (isFloorp) {
    wasDisabled = checkSidebarRemoved();

    let browser = document.getElementById("browser");
    if (browser) {
        Services.prefs.addObserver("floorp.panelSidebar.enabled", getPanelSidebarPosition);
        Services.prefs.addObserver("floorp.panelSidebar.config", getPanelSidebarPosition);
    }

    getPanelSidebarPosition();
}