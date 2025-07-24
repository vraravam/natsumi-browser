// ==UserScript==
// @include   main
// @ignorecache
// ==/UserScript==

import * as ucApi from "chrome://userchromejs/content/uc_api.sys.mjs";

function detectFork() {
    let browserTitle = "";

    try {
        browserTitle = document.body.parentNode.attributes["data-title-default"].nodeValue;
    } catch (e) {
        console.error("Error detecting fork:", e);
        return null;
    }

    let forkName = "firefox";

    console.log(browserTitle);

    if (browserTitle === "Ablaze Floorp") {
        forkName = "floorp";
    } else if (browserTitle === "Waterfox") {
        forkName = "waterfox";
    }

    return forkName;
}

let disableAutoFork = false;

if (ucApi.Prefs.get("natsumi.browser.disable-auto-detect").exists()) {
    disableAutoFork = ucApi.Prefs.get("natsumi.browser.disable-auto-detect").value;
}

if (disableAutoFork) {
    console.warn("Automatic fork detection is disabled.");
} else {
    let forkName = detectFork();

    if (forkName) {
        console.log(`Detected browser fork: ${forkName}`);
        ucApi.Prefs.set("natsumi.browser.type", forkName);
    } else {
        console.warn("Could not detect browser fork.");
    }
}