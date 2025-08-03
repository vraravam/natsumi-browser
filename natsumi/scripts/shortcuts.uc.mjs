// ==UserScript==
// @include   main
// @ignorecache
// ==/UserScript==

import * as ucApi from "chrome://userchromejs/content/uc_api.sys.mjs";
import {NatsumiNotification} from "./notifications.sys.mjs";

class NatsumiKeyboardShortcut {
    constructor(meta, ctrl, alt, shift, key, browserWins, convertForMac) {
        this.meta = meta; // Meta key (Command on macOS, Windows key on Windows)
        this.ctrl = ctrl; // Ctrl key
        this.alt = alt; // Alt key (aka "Option" on macOS)
        this.shift = shift; // Key pressed, can be function key or character
        this.browserWins = browserWins; // If browserWins is true, the browser has dominance on conflicting shortcuts
        this.convertForMac = convertForMac; // If true, the macOS converter will make the shortcut use Command instead of Ctrl
        this.customized = false; // If true, the macOS converter won't convert this
        this.key = key.toLowerCase();
    }
}

class NatsumiShortcutActions {
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
}

let natsumiKeyboardShortcuts = {
    "copyCurrentUrl": new NatsumiKeyboardShortcut(false, true, false, true, "c", true, true),
    "toggleCompactMode": new NatsumiKeyboardShortcut(false, true, false, true, "s", false, true) // switch browserWins to true once compact mode is implemented
}

let natsumiShortcutActionMappings = {
    "copyCurrentUrl": NatsumiShortcutActions.copyCurrentUrl,
    "toggleCompactMode": NatsumiShortcutActions.toggleCompactMode
}

function handleKeyboardShortcuts(event) {
    const metaPressed = event.metaKey;
    const ctrlPressed = event.ctrlKey;
    const altPressed = event.altKey;
    const shiftPressed = event.shiftKey;
    const key = event.key.toLowerCase();

    if (ucApi.Prefs.get("natsumi.shortcuts.enabled").exists()) {
        if (ucApi.Prefs.get("natsumi.shortcuts.disabled").value) {
            return; // Shortcuts are disabled, so do nothing
        }
    }

    // Ensure key is either a single character or a function key
    if (key.length !== 1 && !(key.length === 2 && key.startsWith("f"))) {
        return;
    }

    // Check if the key combination matches any defined shortcut
    let selectedShortcutName = null;
    let selectedShortcutObject = null;

    for (const shortcutName in natsumiKeyboardShortcuts) {
        const shortcut = natsumiKeyboardShortcuts[shortcutName];

        if (shortcut.meta === metaPressed &&
            shortcut.ctrl === ctrlPressed &&
            shortcut.alt === altPressed &&
            shortcut.shift === shiftPressed &&
            shortcut.key === key) {
            selectedShortcutName = shortcutName;
            selectedShortcutObject = shortcut;
            break;
        }
    }

    if (!selectedShortcutName || !selectedShortcutObject) {
        return;
    }

    console.log("Got shortcut:", selectedShortcutName);

    // "Assert dominance" if the browser should be the one executing the shortcut
    // (it's just canceling out any other actions that this shortcut would trigger)
    if (selectedShortcutObject.browserWins) {
        event.preventDefault();
        event.stopPropagation();
    }

    // Execute the action associated with the shortcut
    if (natsumiShortcutActionMappings[selectedShortcutName]) {
        natsumiShortcutActionMappings[selectedShortcutName]();
    } else {
        console.warn(`No action defined for shortcut: ${selectedShortcutName}`);
    }
}

function applyMacShortcuts() {
    // Note: this function should ONLY be called if there is no customized shortcuts to apply.
    const osName = Services.appinfo.OS.toLowerCase();

    if (osName !== "darwin") {
        return;
    }

    for (const shortcutName in natsumiKeyboardShortcuts) {
        const shortcut = natsumiKeyboardShortcuts[shortcutName];

        // Convert Ctrl to Meta for macOS
        if (shortcut.convertForMac && shortcut.ctrl && !shortcut.meta && !shortcut.customized) {
            shortcut.meta = true;
            shortcut.ctrl = false;
        }
    }
}

// Usually here we'd allow shortcut customization, but that is still a work in progress
// So we'll copy the Mac shortcuts anyways
applyMacShortcuts();

console.log(natsumiKeyboardShortcuts);

// Listen for keydown events on the document
window.document.addEventListener("keydown", handleKeyboardShortcuts);