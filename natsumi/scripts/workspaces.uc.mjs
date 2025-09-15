// ==UserScript==
// @include   main
// @loadOrder 11
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

function convertToXUL(node) {
    // noinspection JSUnresolvedReference
    return window.MozXULElement.parseXULToFragment(node);
}

class NatsumiWorkspacesWrapper {
    // A wrapper class for managing workspaces in Floorp directly from the window
    constructor() {
        this.workspacesModule = null;
        this.workspacesContext = null;
        this.modalManager = null;
        this.tabManager = null;
        this.initialized = false;
        this.properInit = false;
        this.initInterval = null;
        this.dataRetrieveQueue = [];
    }

    async init() {
        this.workspacesModule = await import("chrome://noraneko/content/assets/js/modules/workspaces.js");
        let workspacesContext = this.workspacesModule.default.getCtx();

        if (workspacesContext) {
            this.setManagers(workspacesContext);
        } else {
            console.warn("Workspaces context could not be retrieved, will do this later.");
            this.setInitInterval();
        }

        // Set init to true
        this.initialized = true;
    }

    setInitInterval() {
        if (this.properInit) {
            return;
        }

        this.initInterval = setInterval(() => {
            let workspacesContext = this.workspacesModule.default.getCtx();
            if (workspacesContext) {
                console.log("Workspaces context retrieved, initializing now.");

                // Set managers and init status
                this.setManagers(workspacesContext);
                this.properInit = true;

                // Signal to all queued classes that they can retrieve data now
                for (let queuedFunction of this.dataRetrieveQueue) {
                    queuedFunction();
                }
                this.dataRetrieveQueue = [];

                // Clear interval
                clearInterval(this.initInterval);
                this.initInterval = null;
            }
        }, 100);
    }

    setManagers(workspacesContext) {
        this.workspacesContext = workspacesContext;
        this.modalManager = workspacesContext.modalCtx;
        this.tabManager = workspacesContext.tabManagerCtx;
    }

    getCurrentWorkspaceID() {
        if (!this.initialized) {
            return;
        }

        return this.workspacesContext.getSelectedWorkspaceID();
    }

    getAllWorkspaceIDs() {
        if (ucApi.Prefs.get("floorp.workspaces.v4.store").exists()) {
            let workspacesData = JSON.parse(ucApi.Prefs.get("floorp.workspaces.v4.store").value);
            let workspaceIDs = [];

            for (let index in workspacesData["data"]) {
                workspaceIDs.push(workspacesData["data"][index][0]);
            }

            return workspaceIDs;
        } else {
            return [];
        }
    }

    setCurrentWorkspaceID(workspaceId) {
        if (!this.initialized) {
            return;
        }

        return this.tabManager.changeWorkspace(workspaceId);
    }

    createWorkspace(workspaceName = null) {
        if (!this.initialized) {
            return;
        }

        if (!workspaceName) {
            return this.workspacesContext.createNoNameWorkspace();
        } else {
            return this.workspacesContext.createWorkspace(workspaceName);
        }
    }

    async showWorkspacesModal(workspaceId = null) {
        if (!this.initialized) {
            return;
        }

        // Get current workspace ID if none is provided
        if (!workspaceId) {
            workspaceId = this.getCurrentWorkspaceID();
        }

        // Show workspaces config modal
        await this.modalManager.showWorkspacesModal(workspaceId);
    }
}

class NatsumiPanelSidebarWorkspaces {
    // A class to bring back workspaces management in the panel sidebar, a Floorp 11
    // feature requested for Floorp 12.
    // Standalone MIT-licensed version: https://github.com/greeeen-dev/floorp-sidebar-workspaces

    constructor() {
        this.browserMutationObserver = null;
        this.panelSidebarNode = null;
        this.workspacesWrapper = null;
        this.shownWorkspaces = [];
    }

    init() {
        this.setBrowserMutationObserver();
        this.workspacesWrapper = document.body.natsumiWorkspacesWrapper;

        // Get panel sidebar node (if possible)
        const sidebarSelectBox = document.getElementById("panel-sidebar-select-box");
        if (sidebarSelectBox) {
            this.panelSidebarNode = sidebarSelectBox;
        }

        // Set up observer
        // This also runs the UI initialization so we can only run it once workspace data is available
        if (this.workspacesWrapper.properInit) {
            this.setBrowserMutationObserver();
        } else {
            this.workspacesWrapper.dataRetrieveQueue.push(this.setBrowserMutationObserver.bind(this));
        }
    }

    setBrowserMutationObserver() {
        const browserElement = document.getElementById("browser");

        if (this.browserMutationObserver) {
            this.browserMutationObserver.disconnect();
        }

        // Check if #panel-sidebar-select-box exists
        this.browserMutationObserver = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                const sidebarSelectBox = document.getElementById("panel-sidebar-select-box");
                if (sidebarSelectBox) {
                    const needsUIInit = this.panelSidebarNode === null;
                    this.panelSidebarNode = sidebarSelectBox;

                    if (needsUIInit) {
                        this.initWorkspacesList();
                    }
                } else {
                    this.panelSidebarNode = null;
                }
            });
        });

        this.browserMutationObserver.observe(browserElement, {childList: true, subtree: true});
    }

    initWorkspacesList() {
        if (!this.panelSidebarNode) {
            return;
        }

        // Check if workspaces list already exists
        let workspacesList = document.getElementById("natsumi-panel-sidebar-workspaces")
        if (workspacesList) {
            return;
        }

        // Create workspaces list container
        workspacesList = document.createElement("div");
        workspacesList.id = "natsumi-panel-sidebar-workspaces";
        this.panelSidebarNode.appendChild(workspacesList);

        // Also add a spacer
        let sidebarSpacer = document.createXULElement("spacer");
        sidebarSpacer.id = "natsumi-panel-sidebar-workspaces-spacer"
        sidebarSpacer.setAttribute("flex", "1");
        this.panelSidebarNode.appendChild(sidebarSpacer);

        // Re-add workspaces
        this.refreshWorkspacesList();
    }

    refreshWorkspacesListIfNeeded() {
        if (!this.panelSidebarNode) {
            return;
        }

        let workspaceIds = this.workspacesWrapper.getAllWorkspaceIDs();
        if (workspaceIds.length > 0) {
            // Check 1: check the workspaces data length
            if (workspaceIds.length !== this.shownWorkspaces.length) {
                this.refreshWorkspacesList();
            } else {
                // Check 2: compare workspace IDs
                for (let index in workspaceIds) {
                    let workspaceId = workspaceIds[index];
                    if (!this.shownWorkspaces.includes(workspaceId)) {
                        this.refreshWorkspacesList();
                        break;
                    }
                }
            }

            // Update the selected workspace
            this.refreshSelectedWorkspace();
        }
    }

    refreshWorkspacesList() {
        if (!this.panelSidebarNode) {
            return;
        }

        // Get workspaces list
        let workspacesList = document.getElementById("natsumi-panel-sidebar-workspaces");
        if (!workspacesList) {
            return;
        }

        // Clear existing workspaces
        while (workspacesList.firstChild) {
            workspacesList.removeChild(workspacesList.firstChild);
        }
        this.shownWorkspaces = [];

        // Get workspace data
        let workspacesData = {};
        if (ucApi.Prefs.get("floorp.workspaces.v4.store").exists()) {
            workspacesData = JSON.parse(ucApi.Prefs.get("floorp.workspaces.v4.store").value);
        }

        // Add workspaces
        if (workspacesData["data"]) {
            for (let index in workspacesData["data"]) {
                // Get workspace data
                let workspaceId = workspacesData["data"][index][0];
                let workspaceIcon = workspacesData["data"][index][1]["icon"];

                if (!workspaceIcon) {
                    workspaceIcon = `url("chrome://noraneko/content/assets/svg/fingerprint.svg")`;
                } else {
                    workspaceIcon = `url("chrome://noraneko/content/assets/svg/${workspaceIcon}.svg")`;
                }

                // Create workspace button
                let workspaceButton = document.createElement("div");
                workspaceButton.classList.add("natsumi-panel-sidebar-workspace");
                workspaceButton.style.setProperty("--natsumi-workspace-icon", workspaceIcon);
                workspaceButton.setAttribute("workspace", workspaceId);
                workspacesList.appendChild(workspaceButton);

                // Set selected attribute if this is the current workspace
                if (this.workspacesWrapper.getCurrentWorkspaceID() === workspaceId) {
                    workspaceButton.setAttribute("selected", "");
                }

                // Add event listener
                workspaceButton.addEventListener("click", () => {
                    if (this.workspacesWrapper) {
                        this.workspacesWrapper.setCurrentWorkspaceID(workspaceId);
                    }
                });
            }

            // Create "Add Workspace" button
            let addWorkspaceButton = document.createElement("div");
            addWorkspaceButton.id = "natsumi-panel-sidebar-add-workspace";
            addWorkspaceButton.classList.add("natsumi-panel-sidebar-workspace");

            // Add event listener to add workspace button
            addWorkspaceButton.addEventListener("click", () => {
                if (this.workspacesWrapper) {
                    this.workspacesWrapper.createWorkspace();
                    this.refreshWorkspacesList();
                }
            });

            // Add workspaces to shown workspaces
            workspacesList.appendChild(addWorkspaceButton);
        }
    }

    refreshSelectedWorkspace() {
        if (!this.panelSidebarNode) {
            return;
        }

        // Get workspaces list
        let workspacesList = document.getElementById("natsumi-panel-sidebar-workspaces");
        if (!workspacesList) {
            return;
        }

        // Get current workspace ID
        let currentWorkspaceId = this.workspacesWrapper.getCurrentWorkspaceID();

        // Update selected attribute
        const workspaceButtons = workspacesList.querySelectorAll(".natsumi-panel-sidebar-workspace");
        workspaceButtons.forEach((button) => {
            if (button.getAttribute("workspace") === currentWorkspaceId) {
                button.setAttribute("selected", "");
            } else {
                button.removeAttribute("selected");
            }
        });
    }
}

class NatsumiWorkspaceIndicator {
    // An indicator to show the current workspace in the tabs sidebar

    constructor() {
        this.workspacesWrapper = null;
        this.indicatorNode = null;
        this.tabsListNode = null;
        this.verticalTabsMutationObserver = null;
    }

    init() {
        this.workspacesWrapper = document.body.natsumiWorkspacesWrapper;

        // Set up observer
        // This also runs the UI initialization so we can only run it once workspace data is available
        if (this.workspacesWrapper.properInit) {
            this.setVerticalTabsMutationObserver();
        } else {
            this.workspacesWrapper.dataRetrieveQueue.push(this.setVerticalTabsMutationObserver.bind(this));
        }
    }

    addIndicator() {
        // Remove existing indicator
        let existingIndicator = document.getElementById("natsumi-workspace-indicator");
        if (existingIndicator) {
            existingIndicator.remove();
        }

        // Create workspace indicator
        const indicatorXULString = `
            <div id="natsumi-workspace-indicator">
                <div id="natsumi-workspace-indicator-icon"></div>
                <div id="natsumi-workspace-indicator-name"></div>
            </div>
        `
        let indicatorFragment = convertToXUL(indicatorXULString);

        // Append to sidebar then refetch indicator
        let tabsListNode = document.getElementById("tabbrowser-arrowscrollbox");
        tabsListNode.appendChild(indicatorFragment);

        // Refetch indicator node
        this.indicatorNode = document.getElementById("natsumi-workspace-indicator");

        // Set click event listener
        this.indicatorNode.addEventListener("click", () => {
            if (this.workspacesWrapper) {
                this.workspacesWrapper.showWorkspacesModal();
            }
        });

        // Refresh data
        this.refreshIndicator();
    }

    setVerticalTabsMutationObserver() {
        const verticalTabsElement = document.getElementById("vertical-tabs");

        if (this.verticalTabsMutationObserver) {
            this.verticalTabsMutationObserver.disconnect();
        }

        // Check if #tabbrowser-tabs exists
        this.verticalTabsMutationObserver = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                const tabsListNode = document.getElementById("tabbrowser-tabs");
                if (tabsListNode) {
                    const needsUIInit = this.tabsListNode === null;
                    this.tabsListNode = tabsListNode;

                    if (needsUIInit) {
                        this.addIndicator();
                    }
                } else {
                    this.tabsListNode = null;
                }
            });
        });

        this.verticalTabsMutationObserver.observe(verticalTabsElement, {childList: true, subtree: true});
    }

    refreshIndicator() {
        if (!this.indicatorNode) {
            return;
        }

        // Get current workspace data
        let currentWorkspaceData = getCurrentWorkspaceData();

        // Set icon and name
        this.indicatorNode.style.setProperty("--natsumi-workspace-icon", currentWorkspaceData["icon"]);
        let nameNode = this.indicatorNode.querySelector("#natsumi-workspace-indicator-name");
        nameNode.textContent = currentWorkspaceData["name"];
    }
}

function getCurrentWorkspaceData() {
    const tabsListNode = document.getElementById("tabbrowser-arrowscrollbox");
    const availableTabs = tabsListNode.querySelectorAll("tab:not([hidden])");
    const workspaceData = JSON.parse(ucApi.Prefs.get("floorp.workspaces.v4.store").value)
    let workspaceName = null;
    let workspaceIcon = null;
    let workspaceId = workspaceData["defaultID"];

    // Attempt to get workspace ID from workspaces wrapper if available
    if (document.body.natsumiWorkspacesWrapper && document.body.natsumiWorkspacesWrapper.properInit) {
        workspaceId = document.body.natsumiWorkspacesWrapper.getCurrentWorkspaceID();
    } else {
        // Use fallback method (fetch from tabs, not as accurate)
        if (availableTabs.length > 0) {
            if ("floorpWorkspaceId" in availableTabs[0].attributes) {
                workspaceId = availableTabs[0].attributes["floorpWorkspaceId"].value;
            }
        }
    }

    for (let workspaceIndex in workspaceData["data"]) {
        let workspace = workspaceData["data"][workspaceIndex];
        if (workspace[0] === workspaceId) {
            workspaceName = workspace[1]["name"]
            workspaceIcon = workspace[1]["icon"]

            if (!workspaceIcon) {
                workspaceIcon = `url("chrome://noraneko/content/assets/svg/fingerprint.svg")`;
            } else {
                workspaceIcon = `url("chrome://noraneko/content/assets/svg/${workspaceIcon}.svg")`;
            }

            break;
        }
    }

    return {"id": workspaceId, "name": workspaceName, "icon": workspaceIcon};
}

function copyWorkspaceName() {
    let currentWorkspaceData = getCurrentWorkspaceData();
    let sidebar = document.getElementById("sidebar-main");
    sidebar.style.setProperty("--natsumi-workspace-name", `"${currentWorkspaceData["name"]}"`);
    sidebar.style.setProperty("--natsumi-workspace-icon", currentWorkspaceData["icon"]);
}

function copyAllWorkspaces() {
    let workspacesButton = document.getElementById("workspaces-toolbar-button");

    if (!workspacesButton) {
        // Mutation observer will take care of this for us
        return;
    }

    const workspaceData = JSON.parse(ucApi.Prefs.get("floorp.workspaces.v4.store").value)
    const currentWorkspaceData = getCurrentWorkspaceData();

    // Clear existing workspaces
    const allWorkspaceIcons = workspacesButton.querySelectorAll(".natsumi-workspace-icon");

    allWorkspaceIcons.forEach(icon => {
        if (icon.parentNode === workspacesButton) {
            workspacesButton.removeChild(icon);
        }
    });

    for (let index in workspaceData["data"]) {
        let workspace = workspaceData["data"][index];
        let workspaceId = workspace[0];
        let workspaceIcon = workspace[1]["icon"];

        if (!workspaceIcon) {
            workspaceIcon = `url('chrome://noraneko/content/assets/svg/fingerprint.svg')`;
        } else {
            workspaceIcon = `url('chrome://noraneko/content/assets/svg/${workspaceIcon}.svg')`;
        }

        let newButtonNode = document.createElement("div");
        newButtonNode.classList.add("natsumi-workspace-icon");
        newButtonNode.style.setProperty("--natsumi-workspace-icon", workspaceIcon);

        if (workspaceId === currentWorkspaceData["id"]) {
            newButtonNode.classList.add("natsumi-workspace-active");
        }

        workspacesButton.appendChild(newButtonNode);
    }
}

let tabsList = document.getElementById("tabbrowser-arrowscrollbox");
let isFloorp = false;

if (ucApi.Prefs.get("natsumi.browser.type").exists) {
    isFloorp = ucApi.Prefs.get("natsumi.browser.type").value === "floorp";
}

if (isFloorp) {
    let workspacesButton = document.getElementById("workspaces-toolbar-button");

    if (workspacesButton) {
        copyAllWorkspaces();
    } else {
        // Let mutation observers handle this
        let toolbarsObserver = new MutationObserver(function (mutations) {
            mutations.forEach(function (mutationRecord) {
                let newWorkspacesButton = document.getElementById("workspaces-toolbar-button");
                if (newWorkspacesButton) {
                    copyAllWorkspaces();
                    toolbarsObserver.disconnect(); // Stop observing once the button exists
                }
            });
        });

        let toolbox = document.getElementById("nav-bar-customization-target");
        let statusBar = document.getElementById("nora-statusbar");

        toolbarsObserver.observe(toolbox, {attributes: true, childList: true, subtree: true});

        if (statusBar) {
            toolbarsObserver.observe(statusBar, {attributes: true, childList: true, subtree: true});
        }
    }

    let tabsListObserver = new MutationObserver(function (mutations) {
        // Prevent infinite loops
        if (mutations.length === 1) {
            let mutation = mutations[0];
            if (mutation.target.id === "natsumi-workspace-indicator-name") {
                return;
            }
        }

        copyWorkspaceName();
        copyAllWorkspaces();
        copyAllWorkspaces();

        if (document.body.natsumiPanelSidebarWorkspaces) {
            document.body.natsumiPanelSidebarWorkspaces.refreshWorkspacesListIfNeeded();
        }

        if (document.body.natsumiWorkspaceIndicator) {
            document.body.natsumiWorkspaceIndicator.refreshIndicator();
        }
    });
    tabsListObserver.observe(tabsList, {attributes: true, childList: true, subtree: true});

    // Initialize workspaces wrapper
    document.body.natsumiWorkspacesWrapper = new NatsumiWorkspacesWrapper();
    document.body.natsumiWorkspacesWrapper.init().then(() => {
        // Initialize panel sidebar workspaces manager
        document.body.natsumiPanelSidebarWorkspaces = new NatsumiPanelSidebarWorkspaces();
        document.body.natsumiPanelSidebarWorkspaces.init();

        // Initialize workspace indicator
        document.body.natsumiWorkspaceIndicator = new NatsumiWorkspaceIndicator();
        document.body.natsumiWorkspaceIndicator.init();
    })
}