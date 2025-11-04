// ==UserScript==
// @include   main
// @ignorecache
// ==/UserScript==

import { NatsumiActorWrapper } from "./actors/js-actors.js";

class NatsumiGlimpse {
    constructor() {
        console.log("glimpse real");
        this.glimpse = {};
        this.glimpseTabs = []; // Array to quickly check if a tab is a glimpse tab
        this.currentGlimpseTab = null;
    }

    init() {
        // Set event listener
        document.addEventListener("select", this.onSelect.bind(this));
        gBrowser.tabContainer.addEventListener("TabClose", this.onTabClose.bind(this));
    }

    onTabClose(event) {
        let closedTab = event.target;
        let closedTabId = closedTab.linkedPanel;

        // Check if this is a glimpse tab
        let isGlimpseParent = closedTabId in this.glimpse;
        let isGlimpseTab = this.glimpseTabs.includes(closedTabId);

        if (isGlimpseParent && isGlimpseTab) {
            // This should never happen
            console.error("A tab is both a Glimpse parent and Glimpse tab; this should never happen. Please restart your browser.");
            return;
        }

        if (isGlimpseTab) {
            let shouldSwitchToParent = false;

            // Check if Glimpse is being closed
            if (closedTab.hasAttribute("natsumi-glimpse-closed")) {
                // Here we assume the tab was closed through the controls
                // In this case, we just switch to the parent
                shouldSwitchToParent = true;
            }

            // Find parent tab
            let parentTabId = null;

            for (let parentId in this.glimpse) {
                if (this.glimpse[parentId].glimpseTabId === closedTabId) {
                    parentTabId = parentId;
                }
            }

            if (!parentTabId) {
                return;
            }

            // Unregister glimpse
            delete this.glimpse[parentTabId];

            // Switch to parent tab if needed
            let parentTab = document.querySelector(`tab[linkedpanel=${parentTabId}]`);
            if (parentTab) {
                if (shouldSwitchToParent) {
                    parentTab.linkedBrowser.removeAttribute("natsumi-has-glimpse");
                    gBrowser.selectedTab = parentTab;
                } else {
                    gBrowser.removeTab(parentTab);
                }
            }
        } else if (isGlimpseParent) {
            // Close glimpse tab too
            let glimpseTabId = this.glimpse[closedTabId].glimpseTabId;
            let glimpseTab = document.querySelector(`tab[linkedpanel=${glimpseTabId}]`);
            if (glimpseTab) {
                gBrowser.removeTab(glimpseTab);
            }

            // Unregister glimpse
            delete this.glimpse[closedTabId];
        }
    }

    onSelect() {
        let tabSelected = gBrowser.selectedTab;
        let tabSelectedId = tabSelected.linkedPanel;
        let tabSelectedBrowser = tabSelected.linkedBrowser;
        let tabbox = document.getElementById("tabbrowser-tabbox");

        // Remove attributes from previous glimpse tab
        if (this.currentGlimpseTab) {
            let currentGlimpseTabId = this.currentGlimpseTab.linkedPanel;
            let glimpseTabId = this.glimpse[currentGlimpseTabId]?.glimpseTabId;

            if (!glimpseTabId) {
                return;
            }

            // Check if we're on the glimpse tab right now
            if (tabSelectedId === glimpseTabId) {
                // We don't need to do anything here
                return;
            }

            // Get glimpse tab
            let glimpseTab = document.querySelector(`tab[linkedpanel=${glimpseTabId}]`);

            if (!glimpseTab) {
                // Unregister glimpse then return
                delete this.glimpse[tabSelectedId];
                return;
            }

            // Remove glimpse attributes
            let glimpseBrowser = glimpseTab.linkedBrowser;
            this.currentGlimpseTab.removeAttribute("natsumi-glimpse-selected");
            this.currentGlimpseTab.linkedBrowser.removeAttribute("natsumi-has-glimpse");
            glimpseBrowser.removeAttribute("natsumi-is-glimpse");
            tabbox.removeAttribute("natsumi-glimpse-active");
            this.currentGlimpseTab = null;
        }

        // Check if there's glimpse data available
        if (this.glimpse[tabSelectedId]) {
            let glimpseData = this.glimpse[tabSelectedId];
            let glimpseTabId = glimpseData.glimpseTabId;

            // Get glimpse tab
            let glimpseTab = document.querySelector(`tab[linkedpanel=${glimpseTabId}]`);

            if (!glimpseTab) {
                // Unregister glimpse then return
                delete this.glimpse[tabSelectedId];
                return;
            }

            // Show glimpse tab
            let glimpseBrowser = glimpseTab.linkedBrowser;
            tabSelected.setAttribute("natsumi-glimpse-selected", "");
            tabSelectedBrowser.setAttribute("natsumi-has-glimpse", "true");
            glimpseBrowser.setAttribute("natsumi-is-glimpse", "true");
            tabbox.setAttribute("natsumi-glimpse-active", "");
            this.currentGlimpseTab = tabSelected;
            gBrowser.selectedTab = glimpseTab;
        }
    }

    activateGlimpse(link) {
        // Get current tab and browser
        let currentTab = gBrowser.selectedTab;
        let currentTabId = currentTab.linkedPanel; // We can treat the linked panel as the tab's "ID"
        let currentBrowser = currentTab.linkedBrowser;
        let tabbox = document.getElementById("tabbrowser-tabbox");

        // Do not activate if this is a Glimpse tab
        if (this.glimpseTabs.includes(currentTabId)) {
            return;
        }

        // Open glimpse link in new tab
        let newTab = gBrowser.addTab(link, {
            skipAnimation: true,
            inBackground: true,
            triggeringPrincipal: gBrowser.contentPrincipal,
        });
        let newTabId = newTab.linkedPanel;

        // Get matching browser element
        let newBrowser = newTab.linkedBrowser;

        // Hide glimpse tab
        newTab.style.display = "none";

        // Set glimpse status
        currentBrowser.setAttribute("natsumi-has-glimpse", "true");
        newBrowser.setAttribute("natsumi-is-glimpse", "true");
        newBrowser.setAttribute("natsumi-glimpse-parent", currentTabId);
        tabbox.setAttribute("natsumi-glimpse-active", "");
        tabbox.setAttribute("natsumi-glimpse-animate", "");

        // Register glimpse
        this.glimpse[currentTabId] = {
            glimpseTabId: newTabId
        }
        this.glimpseTabs.push(newTabId);

        gBrowser.selectedTab = newTab;
        currentBrowser.docShellIsActive = true;
        currentBrowser.renderLayers = true;

        setTimeout(() => {
            tabbox.removeAttribute("natsumi-glimpse-animate");
        }, 300);
    }
}

let JSWindowActors = {
    NatsumiGlimpse: {
        parent: {
            esModuleURI: "chrome://natsumi/content/scripts/actors/NatsumiGlimpseParent.sys.mjs"
        },
        child: {
            esModuleURI: "chrome://natsumi/content/scripts/actors/NatsumiGlimpseChild.sys.mjs",
            events: {
                DOMContentLoaded: {},
                click: {
                    capture: true
                },
                keydown: {
                    capture: true
                }
            },
        },
        allFrames: true,
        matches: [
            "*://*/*",
            "about:*"
        ]
    }
}

try {
    let actorWrapper = new NatsumiActorWrapper();
    actorWrapper.addWindowActors(JSWindowActors);
    console.log("done");
} catch (e) {
    console.error("Failed to add Natsumi JS Window Actors:", e);
}

window.natsumiGlimpse = new NatsumiGlimpse();
window.natsumiGlimpse.init();
