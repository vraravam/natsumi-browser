// ==UserScript==
// @include   main
// @ignorecache
// ==/UserScript==

/*

Natsumi Browser - Welcome to your personal internet.

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

import { NatsumiActorWrapper } from "./actors/js-actors.js";

function convertToXUL(node) {
    // noinspection JSUnresolvedReference
    return window.MozXULElement.parseXULToFragment(node);
}

class NatsumiGlimpse {
    constructor() {
        console.log("glimpse real");
        this.glimpse = {};
        this.glimpseTabs = []; // Array to quickly check if a tab is a glimpse tab
        this.currentGlimpseTab = null;
        this.glimpseInterval = null;
    }

    init() {
        // Set event listener
        document.addEventListener("select", this.onSelect.bind(this));
        document.addEventListener("keydown", this.onKeyDown.bind(this));
        gBrowser.tabContainer.addEventListener("TabClose", this.onTabClose.bind(this));
        gBrowser.addProgressListener({
            onLocationChange: () => {
                if (this.currentGlimpseTab) {
                    this.currentGlimpseTab.linkedBrowser.renderLayers = true;
                }
            }
        });
    }

    setGlimpseInterval() {
        this.glimpseInterval = setInterval(() => {
            if (this.currentGlimpseTab) {
                if (!this.currentGlimpseTab.linkedBrowser.renderLayers) {
                    this.currentGlimpseTab.linkedBrowser.renderLayers = true;
                }
            }
        }, 50);
    }

    removeGlimpseInterval() {
        if (this.glimpseInterval) {
            clearInterval(this.glimpseInterval);
            this.glimpseInterval = null;
        }
    }

    onMouseMove() {
        if (this.currentGlimpseTab) {
            this.currentGlimpseTab.linkedBrowser.renderLayers = true;
        }
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
                    break;
                }
            }

            if (!parentTabId) {
                return;
            }

            // Unregister glimpse
            this.unregisterGlimpse(parentTabId);

            // Switch to parent tab if needed
            let parentTab = document.querySelector(`tab[linkedpanel=${parentTabId}]`);
            parentTab.removeAttribute("natsumi-glimpse-selected");
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
            this.unregisterGlimpse(closedTabId);
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
                return;
            }

            // Get glimpse tab
            let glimpseTab = document.querySelector(`tab[linkedpanel=${glimpseTabId}]`);

            if (!glimpseTab) {
                // Unregister glimpse then return
                this.unregisterGlimpse(tabSelectedId);
                return;
            }

            // Remove glimpse attributes
            let glimpseBrowser = glimpseTab.linkedBrowser;
            this.currentGlimpseTab.removeAttribute("natsumi-glimpse-selected");
            this.currentGlimpseTab.linkedBrowser.removeAttribute("natsumi-has-glimpse");
            glimpseBrowser.removeAttribute("natsumi-is-glimpse");
            tabbox.removeAttribute("natsumi-glimpse-active");
            this.currentGlimpseTab.renderLayers = false;
            this.currentGlimpseTab = null;
            this.removeGlimpseInterval();
        }

        // Check if we're in a glimpse tab
        if (this.glimpseTabs.includes(tabSelectedId)) {
            // Find glimpse parent
            let parentTabId = this.getGlimpseParent(tabSelectedId);
            if (!parentTabId) {
                return;
            }

            tabSelected = document.querySelector(`tab[linkedpanel=${parentTabId}]`);
            tabSelectedId = parentTabId;
            tabSelectedBrowser = tabSelected.linkedBrowser;
        }

        // Check if there's glimpse data available
        if (this.glimpse[tabSelectedId]) {
            let glimpseData = this.glimpse[tabSelectedId];
            let glimpseTabId = glimpseData.glimpseTabId;

            // Get glimpse tab
            let glimpseTab = document.querySelector(`tab[linkedpanel=${glimpseTabId}]`);

            if (!glimpseTab) {
                // Unregister glimpse then return
                this.unregisterGlimpse(tabSelectedId);
                return;
            }

            // Show glimpse tab
            let glimpseBrowser = glimpseTab.linkedBrowser;
            tabSelectedBrowser.setAttribute("natsumi-has-glimpse", "true");
            glimpseBrowser.setAttribute("natsumi-is-glimpse", "true");
            tabbox.setAttribute("natsumi-glimpse-active", "");
            this.currentGlimpseTab = tabSelected;
            gBrowser.selectedTab = glimpseTab;
            tabSelected.setAttribute("natsumi-glimpse-selected", "");
            tabSelected.linkedBrowser.renderLayers = true;
            this.setGlimpseInterval();
        }
    }

    onKeyDown(event) {
        if (event.key.toLowerCase() === "escape") {
            console.log(this.currentGlimpseTab);

            // Check if current tab is a glimpse tab
            if (this.currentGlimpseTab) {
                // Get Glimpse tab ID
                let glimpseTab = this.glimpse[this.currentGlimpseTab.linkedPanel];
                if (!glimpseTab) {
                    return;
                }

                let glimpseTabId = glimpseTab.glimpseTabId;

                // Deactivate Glimpse with animation
                this.deactivateGlimpseWithAnim(glimpseTabId);
            }
        }
    }

    activateGlimpse(link) {
        // Get current tab and browser
        let currentTab = gBrowser.selectedTab;
        let currentTabId = currentTab.linkedPanel; // We can treat the linked panel as the tab's "ID"
        let currentBrowser = currentTab.linkedBrowser;
        let tabbox = document.getElementById("tabbrowser-tabbox");

        // Do not activate if this is a Glimpse tab, but open tab anyways
        if (this.glimpseTabs.includes(currentTabId)) {
            gBrowser.addTab(link, {
                skipAnimation: true,
                inBackground: true,
                triggeringPrincipal: gBrowser.contentPrincipal,
            });
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

        // Set glimpse status
        currentBrowser.setAttribute("natsumi-has-glimpse", "true");
        newBrowser.setAttribute("natsumi-is-glimpse", "true");
        newBrowser.setAttribute("natsumi-glimpse-parent", currentTabId);
        tabbox.setAttribute("natsumi-glimpse-active", "");
        tabbox.setAttribute("natsumi-glimpse-animate", "");
        newTab.setAttribute("natsumi-glimpse-tab", "true");

        // Create Glimpse controls
        let glimpseControlsFragment = convertToXUL(`
            <div class="natsumi-glimpse-controls">
                <div class="natsumi-glimpse-close-button"></div>
                <div class="natsumi-glimpse-expand-button"></div>
            </div>
        `);
        let newBrowserContainer = newBrowser.parentElement.parentElement.parentElement;
        newBrowserContainer.appendChild(glimpseControlsFragment);

        // Set event listeners for Glimpse controls
        let glimpseCloseButton = newBrowserContainer.querySelector(".natsumi-glimpse-close-button");
        let glimpseExpandButton = newBrowserContainer.querySelector(".natsumi-glimpse-expand-button");

        glimpseCloseButton.addEventListener("click", () => {
            this.deactivateGlimpseWithAnim(newTabId);
        });
        glimpseExpandButton.addEventListener("click", () => {
            this.graduateGlimpseWithAnim(newTabId);
        });

        // Register glimpse
        this.glimpse[currentTabId] = {
            glimpseTabId: newTabId
        }
        this.glimpseTabs.push(newTabId);
        this.currentGlimpseTab = currentTab;

        gBrowser.selectedTab = newTab;
        currentBrowser.docShellIsActive = true;
        currentBrowser.renderLayers = true;

        // Set natsumi-glimpse-selected attribute
        currentTab.setAttribute("natsumi-glimpse-selected", "");

        setTimeout(() => {
            tabbox.removeAttribute("natsumi-glimpse-animate");
        }, 300);
    }

    ensureGlimpse(glimpseTabId) {
        return this.glimpseTabs.includes(glimpseTabId);
    }

    getGlimpseParent(glimpseTabId) {
        // Find parent tab
        let parentTabId = null;

        for (let parentId in this.glimpse) {
            if (this.glimpse[parentId].glimpseTabId === glimpseTabId) {
                parentTabId = parentId;
                break;
            }
        }

        return parentTabId;
    }

    deactivateGlimpseWithAnim(glimpseTabId) {
        // Get glimpse tab
        let glimpseTab = document.querySelector(`tab[linkedpanel=${glimpseTabId}]`);
        if (!glimpseTab) {
            return;
        }

        // Ensure this is a glimpse tab
        if (!this.ensureGlimpse(glimpseTabId)) {
            return;
        }

        // This is sufficient to ensure that this is a Glimpse tab
        let tabbox = document.getElementById("tabbrowser-tabbox");
        tabbox.setAttribute("natsumi-glimpse-animate-disappear", "true");
        setTimeout(() => {
            tabbox.removeAttribute("natsumi-glimpse-animate-disappear");
            this.deactivateGlimpse(glimpseTabId);
        }, 300);
    }

    deactivateGlimpse(glimpseTabId) {
        // Get glimpse tab
        let glimpseTab = document.querySelector(`tab[linkedpanel=${glimpseTabId}]`);
        if (!glimpseTab) {
            return;
        }

        // Ensure this is a glimpse tab
        if (!this.ensureGlimpse(glimpseTabId)) {
            return;
        }

        // Add attribute to indicate closure
        glimpseTab.setAttribute("natsumi-glimpse-closed", "true");

        // Close Glimpse tab
        gBrowser.removeTab(glimpseTab);
    }

    graduateGlimpseWithAnim(glimpseTabId) {
        // Get glimpse tab
        let glimpseTab = document.querySelector(`tab[linkedpanel=${glimpseTabId}]`);
        if (!glimpseTab) {
            return;
        }

        // Ensure this is a glimpse tab
        if (!this.ensureGlimpse(glimpseTabId)) {
            return;
        }

        // This is sufficient to ensure that this is a Glimpse tab
        let tabbox = document.getElementById("tabbrowser-tabbox");
        tabbox.setAttribute("natsumi-glimpse-animate-graduate", "true");
        setTimeout(() => {
            tabbox.removeAttribute("natsumi-glimpse-animate-graduate");
            this.graduateGlimpse(glimpseTabId);
        }, 300);
    }

    graduateGlimpse(glimpseTabId) {
        // Get glimpse tab
        let glimpseTab = document.querySelector(`tab[linkedpanel=${glimpseTabId}]`);
        if (!glimpseTab) {
            return;
        }

        // Ensure this is a glimpse tab
        if (!this.ensureGlimpse(glimpseTabId)) {
            return;
        }

        // Find parent tab
        let parentTabId = this.getGlimpseParent(glimpseTabId);
        if (!parentTabId) {
            return;
        }

        // Graduate Glimpse tab
        glimpseTab.removeAttribute("natsumi-glimpse-tab");
        let glimpseBrowser = glimpseTab.linkedBrowser;
        glimpseBrowser.removeAttribute("natsumi-is-glimpse");
        glimpseBrowser.removeAttribute("natsumi-glimpse-parent");

        // Destroy Glimpse controls
        let glimpseTabContainer = glimpseBrowser.parentElement.parentElement.parentElement;
        let glimpseControls = glimpseTabContainer.querySelector(".natsumi-glimpse-controls");
        if (glimpseControls) {
            glimpseControls.remove();
        }

        // Remove attributes from parent tab
        let parentTab = document.querySelector(`tab[linkedpanel=${parentTabId}]`);
        let parentBrowser = parentTab.linkedBrowser;
        parentTab.removeAttribute("natsumi-glimpse-selected");
        parentBrowser.removeAttribute("natsumi-has-glimpse");

        // Unregister glimpse
        this.unregisterGlimpse(parentTabId);
    }

    unregisterGlimpse(parentTabId) {
        // Remove from glimpse tabs array
        let glimpseTabId = this.glimpse[parentTabId].glimpseTabId;
        let index = this.glimpseTabs.indexOf(glimpseTabId);
        if (index > -1) {
            this.glimpseTabs.splice(index, 1);
        }

        // Unregister glimpse
        delete this.glimpse[parentTabId];
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
