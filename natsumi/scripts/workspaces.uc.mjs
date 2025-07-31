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

function getWorkspaceData() {
    const tabsListNode = document.getElementById("tabbrowser-arrowscrollbox");
    const availableTabs = tabsListNode.querySelectorAll("tab:not([hidden])");
    const workspaceData = JSON.parse(ucApi.Prefs.get("floorp.workspaces.v4.store").value)
    let workspaceName = null;
    let workspaceIcon = null;

    let workspaceId = workspaceData["defaultID"];

    if (availableTabs.length > 0) {
        if ("floorpWorkspaceId" in availableTabs[0].attributes) {
            workspaceId = availableTabs[0].attributes["floorpWorkspaceId"].value;
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

    return {"name": workspaceName, "icon": workspaceIcon};
}

function copyWorkspaceName() {
    let currentWorkspaceData = getWorkspaceData();
    let sidebar = document.getElementById("sidebar-main");
    sidebar.style.setProperty("--natsumi-workspace-name", `"${currentWorkspaceData["name"]}"`);
    sidebar.style.setProperty("--natsumi-workspace-icon", currentWorkspaceData["icon"]);
}

let tabsList = document.getElementById("tabbrowser-arrowscrollbox");
let isFloorp = false;

if (ucApi.Prefs.get("natsumi.browser.type").exists) {
    isFloorp = ucApi.Prefs.get("natsumi.browser.type").value === "floorp";
}

if (isFloorp) {
    let tabsListObserver = new MutationObserver(function (mutations) {
        mutations.forEach(function (mutationRecord) {
            copyWorkspaceName();
        });
    });
    tabsListObserver.observe(tabsList, {attributes: true, childList: true, subtree: true});
}