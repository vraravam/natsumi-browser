// ==UserScript==
// @include   main
// @ignorecache
// ==/UserScript==

import * as ucApi from "chrome://userchromejs/content/uc_api.sys.mjs";

class NatsumiSplitViewManager {
    maxSplitSize = 0.8;
    minSplitSize = 0.2;

    constructor() {
        this.tabBoxNode = null;
        this.tabPanelsNode = null;
        this.tabPanelsObserver = null;
        this.splitterMouseDown = false;
        this.splitSize = 0.5;
    }

    init() {
        // Get tab panels node
        this.tabPanelsNode = document.getElementById("tabbrowser-tabpanels");
        this.tabBoxNode = this.tabPanelsNode.parentNode;

        // Observe attributes
        this.tabPanelsObserver = new MutationObserver((mutations) => {
            console.log(mutations);
            if (this.tabPanelsNode.hasAttribute("split-view")) {
                this.applySplitView();
            } else {
                this.removeSplitView();
            }
        });
        this.tabPanelsObserver.observe(this.tabPanelsNode, {
            attributes: true,
            attributeFilter: ["split-view"]
        });
    }

    applySplitView() {
        let existingSplitViewSplitter = document.getElementById("natsumi-split-view-splitter");
        if (existingSplitViewSplitter) {
            existingSplitViewSplitter.remove();
        }
        let existingSplitViewSpacer = document.getElementById("natsumi-split-view-spacer");
        if (existingSplitViewSpacer) {
            existingSplitViewSpacer.remove();
        }

        // Add splitter
        let splitViewSplitter = document.createXULElement("splitter");
        splitViewSplitter.id = "natsumi-split-view-splitter";
        this.tabBoxNode.append(splitViewSplitter);
        splitViewSplitter.addEventListener("mousedown", () => {
            this.splitterMouseDown = true;
            splitViewSplitter.setAttribute("dragging", "true");
        });
        splitViewSplitter.addEventListener("mouseup", () => {
            this.splitterMouseDown = false;
            splitViewSplitter.removeAttribute("dragging");
        });
        splitViewSplitter.addEventListener("mousemove", (event) => {
            if (!this.splitterMouseDown) {
                return;
            }

            let isVertical = (
                this.tabPanelsNode.style.flexDirection === "column" ||
                this.tabPanelsNode.style.flexDirection === "column-reverse"
            );

            let totalSize = this.tabBoxNode.getBoundingClientRect().width;
            let position = event.clientX - this.tabBoxNode.getBoundingClientRect().left;

            if (isVertical) {
                totalSize = this.tabBoxNode.getBoundingClientRect().height;
                position = event.clientY - this.tabBoxNode.getBoundingClientRect().top;
            }

            this.splitSize = Math.max(Math.min(position / totalSize, this.maxSplitSize), this.minSplitSize);
            this.tabBoxNode.style.setProperty("--natsumi-split-size", `${this.splitSize * 100}%`);
        });

        // Add split view spacer
        let splitViewSpacer = document.createElement("div");
        splitViewSpacer.id = "natsumi-split-view-spacer";
        this.tabPanelsNode.append(splitViewSpacer);
    }

    removeSplitView() {
        let splitViewSplitter = document.getElementById("natsumi-split-view-splitter");
        if (splitViewSplitter) {
            splitViewSplitter.remove();
        }
        let splitViewSpacer = document.getElementById("natsumi-split-view-spacer");
        if (splitViewSpacer) {
            splitViewSpacer.remove();
        }

        this.splitSize = 0.5;
    }
}

let isFloorp = false;
if (ucApi.Prefs.get("natsumi.browser.type").exists) {
    isFloorp = ucApi.Prefs.get("natsumi.browser.type").value === "floorp";
}

if (isFloorp) {
    try {
        document.body.natsumiSplitViewManager = new NatsumiSplitViewManager();
        document.body.natsumiSplitViewManager.init();
    } catch (e) {
        console.error(e);
    }
}