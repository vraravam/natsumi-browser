// ==UserScript==
// @include   main
// @loadOrder 11
// @ignorecache
// ==/UserScript==

import * as ucApi from "chrome://userchromejs/content/uc_api.sys.mjs";
import {NatsumiNotification} from "./notifications.sys.mjs";
import {resetTabStyleIfNeeded} from "./reset-tab-style.sys.mjs";

function resetTabStyleWithNotification() {
    let didReset = resetTabStyleIfNeeded();
    if (didReset) {
        // Send notification
        let notificationObject = new NatsumiNotification(
            "You can't use this tab style!",
            "We've reverted your tab style to Proton. To use other tab styles, switch to the Classic tab design in settings.",
            "chrome://natsumi/content/icons/lucide/warning.svg",
            10000,
            "warning"
        )
        notificationObject.addToContainer();
    }
}

let isFloorp = false;
if (ucApi.Prefs.get("natsumi.browser.type").exists) {
    isFloorp = ucApi.Prefs.get("natsumi.browser.type").value === "floorp";
}

if (isFloorp) {
    let browser = document.getElementById("browser");
    if (browser) {
        Services.prefs.addObserver("floorp.design.configs", resetTabStyleWithNotification);
    }

    // Check if we've been through the onboarding yet
    let didOnboarding = false;
    if (ucApi.Prefs.get("natsumi.welcome.viewed").exists) {
        didOnboarding = ucApi.Prefs.get("natsumi.welcome.viewed").value;
    }

    // If onboarding wasn't done yet, onboarding will handle this for us
    if (didOnboarding) {
        resetTabStyleWithNotification();
    }
}