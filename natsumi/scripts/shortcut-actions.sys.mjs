/*

Natsumi Browser - A userchrome for Zen Browser that makes things flow.

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

import {NatsumiNotification} from "./notifications.sys.mjs";

export class NatsumiShortcutActions {
    static copyCurrentUrl() {
        let currentUrl = gBrowser.currentURI.spec;
        navigator.clipboard.writeText(currentUrl);

        // Add to notifications
        let notificationObject = new NatsumiNotification("Copied URL to clipboard!", null, "chrome://natsumi/content/icons/lucide/copy.svg")
        notificationObject.addToContainer();
    }

    static toggleCompactMode() {
        // Right now this is useless because it's not implemented yet, but it will be soon enough
        if (document.body.attributes["natsumi-compact-mode"]) {
            document.body.removeAttribute("natsumi-compact-mode");
        } else {
            document.body.setAttribute("natsumi-compact-mode", "");
        }
    }

    static toggleCompactSidebar() {
        if (document.body.attributes["natsumi-compact-sidebar-extend"]) {
            document.body.removeAttribute("natsumi-compact-sidebar-extend");
        } else {
            document.body.setAttribute("nnatsumi-compact-sidebar-extend", "");
        }
    }

    static toggleCompactNavbar() {
        if (document.body.attributes["natsumi-compact-navbar-extend"]) {
            document.body.removeAttribute("natsumi-compact-navbar-extend");
        } else {
            document.body.setAttribute("natsumi-compact-navbar-extend", "");
        }
    }
}