// ==UserScript==
// @include   main
// @ignorecache
// ==/UserScript==

import { NatsumiActorWrapper } from "./js-actors.sys.mjs";

let JSWindowActors = {
    NatsumiTasterTabs: {
        parent: {
            esModuleURI: "chrome://natsumi/content/scripts/NatsumiTasterTabsParent.sys.mjs"
        },
        child: {
            esModuleURI: "chrome://natsumi/content/scripts/NatsumiTasterTabsChild.sys.mjs",
            events: {
                DOMContentLoaded: {},
            },
        },
        allFrames: true,
        matches: ["*://*/*"]
    }
}

try {
    //let actorWrapper = new NatsumiActorWrapper();
    //actorWrapper.addWindowActors(JSWindowActors);
    console.log("actors added...maybe?")
} catch (e) {
    console.error("Failed to add Natsumi JS Window Actors:", e);
}
