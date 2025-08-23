// ==UserScript==
// @include   main
// @ignorecache
// ==/UserScript==

import * as ucApi from "chrome://userchromejs/content/uc_api.sys.mjs";
import {NatsumiShortcutActions} from "./shortcut-actions.sys.mjs";

class NatsumiKeyboardShortcut {
    constructor(meta, ctrl, alt, shift, key, shortcutMode, convertForMac) {
        this.meta = meta; // Meta key (Command on macOS, Windows key on Windows)
        this.ctrl = ctrl; // Ctrl key
        this.alt = alt; // Alt key (aka "Option" on macOS)
        this.shift = shift; // Key pressed, can be function key or character
        this.shortcutMode = shortcutMode; // Indicates the shortcut mode, influences browserWins and requireDoublePress
        this.browserWins = false; // If browserWins is true, Natsumi will cancel out other shortcuts
        this.requireDoublePress = false // If requireDoublePress is true, this shortcut will only run when pressed twice
        this.convertForMac = convertForMac; // If true, the macOS converter will make the shortcut use Command instead of Ctrl
        this.customized = false; // If true, the macOS converter won't convert this
        this.key = key.toLowerCase();

        // Set shortcut mode
        this.setShortcutMode(shortcutMode);
    }

    setShortcutMode(shortcutMode) {
        if (shortcutMode < 0 || shortcutMode > 2) {
            return;
        }

        this.shortcutMode = shortcutMode;

        if (this.shortcutMode === 0) {
            this.browserWins = true;
            this.requireDoublePress = false;
        } else if (this.shortcutMode === 1) {
            this.browserWins = false;
            this.requireDoublePress = true;
        } else {
            this.browserWins = false;
            this.requireDoublePress = false;
        }
    }
}

let natsumiKeyboardShortcuts = {
    "copyCurrentUrl": new NatsumiKeyboardShortcut(false, true, false, true, "c", 0, true),
    "toggleCompactMode": new NatsumiKeyboardShortcut(false, true, false, true, "s", 0, true),
    "toggleCompactSidebar": new NatsumiKeyboardShortcut(false, true, true, true, "s", 0, true),
    "toggleCompactNavbar": new NatsumiKeyboardShortcut(false, true, true, true, "t", 0, true),
}

let natsumiShortcutActionMappings = {
    "copyCurrentUrl": NatsumiShortcutActions.copyCurrentUrl,
    "toggleCompactMode": NatsumiShortcutActions.toggleCompactMode,
    "toggleCompactSidebar": NatsumiShortcutActions.toggleCompactSidebar,
    "toggleCompactNavbar": NatsumiShortcutActions.toggleCompactNavbar
}

// List for handling shortcuts needed for double presses
let natsumiShortcutPending = {}

function getKeyCombination(event) {
    const metaPressed = event.metaKey;
    const ctrlPressed = event.ctrlKey;
    const altPressed = event.altKey;
    const shiftPressed = event.shiftKey;
    let key = event.key.toLowerCase();

    // On macOS, pressing Alt can cause special keys to appear.
    // In this case, we can get the key pressed from the event.code attribute
    if (altPressed && event.code.startsWith("Key") && key.length <= 2) {
        key = event.code.slice(3).toLowerCase();
    }

    return {"meta": metaPressed, "ctrl": ctrlPressed, "alt": altPressed, "shift": shiftPressed, "key": key};
}

function handleKeyboardShortcuts(event) {
    /*
    Shortcut modes:
    1. "Assert dominance": Cancels out all shortcuts (including Firefox's built in ones) to ensure Natsumi's shortcut is
       the only one running.
    2. "Sharing is caring": Allow both Natsumi and browser/website shortcuts to run at the same time
    3. "Take turns": Require double press to execute Natsumi's shortcut
    */

    const keyCombi = getKeyCombination(event);

    if (ucApi.Prefs.get("natsumi.shortcuts.disabled").exists()) {
        if (ucApi.Prefs.get("natsumi.shortcuts.disabled").value) {
            return; // Shortcuts are disabled, so do nothing
        }
    }

    if (document.body.hasAttribute("natsumi-welcome")) {
        return;
    }

    // Ensure key is either a single character or a function key
    if (keyCombi.key.length !== 1 && !(keyCombi.key.length === 2 && keyCombi.key.startsWith("f"))) {
        return;
    }

    // Check if the key combination matches any defined shortcut
    let selectedShortcutName = null;
    let selectedShortcutObject = null;

    for (const shortcutName in natsumiKeyboardShortcuts) {
        const shortcut = natsumiKeyboardShortcuts[shortcutName];

        if (shortcut.meta === keyCombi.meta &&
            shortcut.ctrl === keyCombi.ctrl &&
            shortcut.alt === keyCombi.alt &&
            shortcut.shift === keyCombi.shift &&
            shortcut.key === keyCombi.key) {
            selectedShortcutName = shortcutName;
            selectedShortcutObject = shortcut;
            break;
        }
    }

    if (!selectedShortcutName || !selectedShortcutObject) {
        return;
    }

    // If the shortcut needs a double press to activate, check if a timeout exists
    if (!natsumiShortcutPending[selectedShortcutName] && selectedShortcutObject.requireDoublePress) {
        // If no timeout exists, create one
        natsumiShortcutPending[selectedShortcutName] = setTimeout(() => {
            delete natsumiShortcutPending[selectedShortcutName];
        }, 500); // 500ms timeout for double press detection
        return;
    } else {
        // If a timeout exists, clear it and proceed with the action
        clearTimeout(natsumiShortcutPending[selectedShortcutName]);
        delete natsumiShortcutPending[selectedShortcutName];
    }

    // "Assert dominance" if the browser should be the one executing the shortcut
    // (it's just canceling out any other actions that this shortcut would trigger)
    if (selectedShortcutObject.browserWins || selectedShortcutObject.requireDoublePress) {
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