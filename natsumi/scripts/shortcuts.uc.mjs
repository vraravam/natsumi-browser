// ==UserScript==
// @include   main
// @ignorecache
// @loadOrder 11
// ==/UserScript==

import * as ucApi from "chrome://userchromejs/content/uc_api.sys.mjs";
import {NatsumiShortcutActions} from "./shortcut-actions.sys.mjs";

export class NatsumiKeyboardShortcut {
    constructor(meta, ctrl, alt, shift, key, shortcutMode, convertForMac) {
        this.meta = meta; // Meta key (Command on macOS, Windows key on Windows)
        this.ctrl = ctrl; // Ctrl key
        this.alt = alt; // Alt key (aka "Option" on macOS)
        this.shift = shift; // Key pressed, can be function key or character
        this.shortcutMode = shortcutMode; // Indicates the shortcut mode, influences browserWins and requireDoublePress
        this.browserWins = false; // If browserWins is true, Natsumi will cancel out other shortcuts
        this.requireDoublePress = false // If requireDoublePress is true, this shortcut will only run when pressed twice
        this.nativeHandle = false; // If nativeHandle is true, command handling will be done by Firefox, not Natsumi
        this.convertForMac = convertForMac; // If true, the macOS converter will make the shortcut use Command instead of Ctrl
        this.customized = false; // If true, the macOS converter won't convert this
        this.unregistered = false; // If true, this shortcut will be ignored
        this.isNativeShortcut = false; // If true, this is a native Firefox shortcut
        this.key = key.toLowerCase();

        // Remove VK prefix from key
        if (this.key.startsWith("vk_")) {
            this.key = this.key.slice(3);
        }

        // Preserve original shortcut combo
        this.originalCombo = {
            "meta": this.meta,
            "ctrl": this.ctrl,
            "alt": this.alt,
            "shift": this.shift,
            "key": this.key,
            "shortcutMode": this.shortcutMode
        }

        // Set shortcut mode
        this.setShortcutMode(shortcutMode);
    }

    setShortcutKeybind(meta, ctrl, alt, shift, key) {
        this.meta = meta;
        this.ctrl = ctrl;
        this.alt = alt;
        this.shift = shift;
        this.key = key.toLowerCase();

        // Remove VK prefix from key if it exists
        if (this.key.startsWith("vk_")) {
            this.key = this.key.slice(3);
        }

        this.customized = true;
    }

    setShortcutMode(shortcutMode) {
        if (shortcutMode < 0 || shortcutMode > 3) {
            return;
        }

        this.shortcutMode = shortcutMode;

        if (this.shortcutMode === 0) {
            // Natsumi has priority
            this.browserWins = true;
            this.requireDoublePress = false;
            this.nativeHandle = false;
        } else if (this.shortcutMode === 1) {
            // Double press required for Natsumi's shortcut
            this.browserWins = false;
            this.requireDoublePress = true;
            this.nativeHandle = false;
        } else if (this.shortcutMode === 2) {
            // Conflicting shortcuts can all run
            this.browserWins = false;
            this.requireDoublePress = false;
            this.nativeHandle = false;
        } else {
            // Firefox handles the shortcut/Website has priority
            this.browserWins = false;
            this.requireDoublePress = false;
            this.nativeHandle = true;
        }
    }

    resetShortcut() {
        this.meta = this.originalCombo.meta;
        this.ctrl = this.originalCombo.ctrl;
        this.alt = this.originalCombo.alt;
        this.shift = this.originalCombo.shift;
        this.key = this.originalCombo.key;
        this.setShortcutMode(this.originalCombo.shortcutMode);
        this.customized = false;
    }
}

class NatsumiNativeKeyboardShortcut extends NatsumiKeyboardShortcut {
    constructor(meta, ctrl, alt, shift, key, command, isDevSet) {
        super(meta, ctrl, alt, shift, key, 3, false);
        this.command = command; // The command that this shortcut triggers
        this.isDevSet = isDevSet; // If true, this shortcut is part of the developer toolbox shortcuts
        this.isNativeShortcut = true;
    }

    setShortcutMode(shortcutMode) {
        // We cannot change this for developer toolbox shortcuts
        if (this.isDevSet) {
            return;
        }

        return super.setShortcutMode(shortcutMode);
    }

    static fromShortcutElement(shortcutElement) {
        // Extract shortcut key
        let key;

        if (shortcutElement.hasAttribute("key")) {
            // Regular key
            key = shortcutElement.getAttribute("key").toLowerCase();
        } else if (shortcutElement.hasAttribute("keycode")) {
            // Likely uses function keys, so remove the "VK_" prefix
            key = shortcutElement.getAttribute("keycode").toLowerCase().replace("vk_", "");
        } else {
            return null; // No key or keycode attribute found
        }

        if (shortcutElement.getAttribute("internal") === "true" && shortcutElement.getAttribute("reserved") === "true") {
            return null; // This is an internal and reserved shortcut, so we should not touch this
        }

        // Extract modifier keys
        let meta = false;
        let ctrl = false;
        let alt = false;
        let shift = false;

        if (shortcutElement.hasAttribute("modifiers")) {
            // Firefox uses "accel" for Meta and Ctrl, but still has "control" for Ctrl
            // On Windows accel = Ctrl, everywhere else accel = Meta
            const osName = Services.appinfo.OS.toLowerCase();
            if (osName === "winnt") {
                ctrl = shortcutElement.getAttribute("modifiers").includes("accel") || shortcutElement.getAttribute("modifiers").includes("control");
            } else {
                meta = shortcutElement.getAttribute("modifiers").includes("accel");
                ctrl = shortcutElement.getAttribute("modifiers").includes("control");
            }

            // Other modifiers
            alt = shortcutElement.getAttribute("modifiers").includes("alt");
            shift = shortcutElement.getAttribute("modifiers").includes("shift");
        }

        // Determine if this shortcut is part of the developer toolbox commands
        const isDevSet = shortcutElement.parentElement && shortcutElement.parentElement.id === "devtoolsKeyset";

        // Return Natsumi native keyboard shortcut object
        return new NatsumiNativeKeyboardShortcut(meta, ctrl, alt, shift, key, shortcutElement.id, isDevSet);
    }
}

class NatsumiKBSManager {
    constructor() {
        this.initialized = false;
        this.waitingForDev = false;
        this.initWhenDevIsReady = false;
        this.ignoreShortcuts = false;
        this.ignoreTimeout = null;
        this.filePath = PathUtils.join(PathUtils.profileDir, "natsumi-shortcuts.json");

        // Shortcuts
        this.shortcuts = {
            "copyCurrentUrl": new NatsumiKeyboardShortcut(false, true, false, true, "c", 0, true),
            "toggleBrowserLayout": new NatsumiKeyboardShortcut(false, true, true, false, "l", 0, true),
            "toggleCompactMode": new NatsumiKeyboardShortcut(false, true, false, true, "s", 0, true),
            "toggleCompactSidebar": new NatsumiKeyboardShortcut(false, true, true, true, "s", 0, true),
            "toggleCompactNavbar": new NatsumiKeyboardShortcut(false, true, true, true, "t", 0, true),
        };
        this.shortcutActions = {
            "copyCurrentUrl": NatsumiShortcutActions.copyCurrentUrl,
            "toggleBrowserLayout": NatsumiShortcutActions.toggleBrowserLayout,
            "toggleCompactMode": NatsumiShortcutActions.toggleCompactMode,
            "toggleCompactSidebar": NatsumiShortcutActions.toggleCompactSidebar,
            "toggleCompactNavbar": NatsumiShortcutActions.toggleCompactNavbar
        };
        this.shortcutsPending = {};
        this.shortcutCustomizationData = {};
        this.baseCustomizations = {
            "key_inspector": {
                "meta": false,
                "ctrl": true,
                "alt": true,
                "shift": true,
                "key": "c",
                "shortcutMode": 3
            },
            "key_inspectorMac": {
                "meta": true,
                "ctrl": false,
                "alt": true,
                "shift": true,
                "key": "c",
                "shortcutMode": 3
            },
            "key_screenshot": {
                "meta": Services.appinfo.OS.toLowerCase() === "darwin",
                "ctrl": Services.appinfo.OS.toLowerCase() !== "darwin",
                "alt": true,
                "shift": true,
                "key": "c",
                "shortcutMode": 3
            }
        }

        // Add native shortcuts
        let nativeShortcuts = document.getElementById("mainKeyset").children;
        for (let i = 0; i < nativeShortcuts.length; i++) {
            let nativeShortcut = nativeShortcuts[i];

            // Check if an ID exists to the shortcut, if not, skip it
            if (!nativeShortcut.id) {
                continue;
            }

            let nativeNatsumiShortcut = NatsumiNativeKeyboardShortcut.fromShortcutElement(nativeShortcut);
            if (nativeNatsumiShortcut) {
                this.shortcuts[nativeShortcut.id] = nativeNatsumiShortcut;
            }
        }

        // Add developer toolbox shortcuts
        let devKeyset = document.getElementById("devtoolsKeyset");
        if (!devKeyset) {
            this.waitingForDev = true;

            // Wait for developer toolbox to load
            let devToolsObserver = new MutationObserver((mutations, observer) => {
                mutations.forEach((mutation) => {
                    mutation.addedNodes.forEach((node) => {
                        if (node.id === "devtoolsKeyset") {
                            this.waitingForDev = false;
                            this.addDevShortcuts();

                            if (this.initWhenDevIsReady) {
                                this.initWhenDevIsReady = false;
                                this.init();
                            }

                            observer.disconnect();
                        }
                    });
                });
            });

            devToolsObserver.observe(document.body, {childList: true});
        } else {
            this.addDevShortcuts();
        }
    }

    addDevShortcuts () {
        let devShortcuts = document.getElementById("devtoolsKeyset").children;
        for (let i = 0; i < devShortcuts.length; i++) {
            let devShortcut = devShortcuts[i];

            // Check if an ID exists to the shortcut, if not, skip it
            if (!devShortcut.id) {
                return;
            }

            let nativeNatsumiShortcut = NatsumiNativeKeyboardShortcut.fromShortcutElement(devShortcut);
            if (nativeNatsumiShortcut) {
                this.shortcuts[devShortcut.id] = nativeNatsumiShortcut;
            }
        }
    }

    init() {
        if (this.initialized) {
            return;
        }

        if (this.waitingForDev && this.initWhenDevIsReady) {
            console.warn("Developer toolbox keyset not found, Natsumi will initialize its shortcuts manager once the keyset exists.");
            return;
        }

        // Apply shortcut customizations
        this.applyMacShortcuts();

        // Setup Natsumi command handling
        window.document.addEventListener("keydown", this.handleKeyboardShortcuts.bind(this));

        // Add Natsumi shortcuts to Firefox's command handler
        this.setupNativeHandler();

        this.initialized = true;
    }

    setupNativeHandler() {
        // Get commands set
        let commandSet = document.getElementById("mainCommandSet");

        // Add commands
        for (const shortcutName in this.shortcuts) {
            const shortcut = this.shortcuts[shortcutName];

            // Only add Natsumi's shortcuts
            if (shortcut instanceof NatsumiNativeKeyboardShortcut) {
                continue;
            }

            let command = document.createXULElement("command");
            command.id = `NatsumiKBS:${shortcutName}`;
            commandSet.appendChild(command);
        }

        // Reattach command set
        commandSet.parentNode.insertBefore(commandSet, commandSet.nextSibling);

        // Add listener to command set
        commandSet.addEventListener("command", (event) => {
            console.log("Got native handle: ",event);

            if (event.target.id.startsWith("NatsumiKBS:")) {
                this.nativeHandleKeyboardShortcuts(event.target.id.replace("NatsumiKBS:", ""));
            }
        });

        // Get keyset
        let keySet = document.getElementById("mainKeyset");

        // Add keys
        for (const shortcutName in this.shortcuts) {
            const shortcut = this.shortcuts[shortcutName];

            // Only add Natsumi's shortcuts
            if (shortcut instanceof NatsumiNativeKeyboardShortcut) {
                continue;
            }

            let key = document.createXULElement("key");
            key.id = shortcutName;
            key.setAttribute("command", `NatsumiKBS:${shortcutName}`);

            // Set key or keycode
            if (shortcut.key.length === 1) {
                key.setAttribute("key", shortcut.key.toUpperCase());
            } else {
                key.setAttribute("keycode", `VK_${shortcut.key.toUpperCase()}`);
            }

            // Set modifiers
            let modifiers = [];
            if (shortcut.meta) {
                modifiers.push("accel");
            }
            if (shortcut.ctrl) {
                modifiers.push("control");
            }
            if (shortcut.alt) {
                modifiers.push("alt");
            }
            if (shortcut.shift) {
                modifiers.push("shift");
            }
            if (modifiers.length > 0) {
                key.setAttribute("modifiers", modifiers.join(","));
            }

            // Add event listener
            keySet.addEventListener("command", (event) => {
                let commandEvent = new Event("command", {bubbles: true, cancelable: true});
                let targetCommand = document.getElementById(event.target.getAttribute("command"));
                targetCommand.dispatchEvent(commandEvent);
            });

            // Set key
            if (shortcut.key.length === 1) {
                key.setAttribute("key", shortcut.key.toUpperCase());
            } else {
                key.setAttribute("keycode", `VK_${shortcut.key.toUpperCase()}`);
            }

            keySet.appendChild(key);
        }

        // Reattach keyset
        keySet.parentNode.insertBefore(keySet, keySet.nextSibling);
    }

    applyMacShortcuts() {
        // Note: this function should ONLY be called if there is no customized shortcuts to apply.
        const osName = Services.appinfo.OS.toLowerCase();

        if (osName !== "darwin") {
            return;
        }

        for (const shortcutName in this.shortcuts) {
            const shortcut = this.shortcuts[shortcutName];

            // Convert Ctrl to Meta for macOS
            if (shortcut.convertForMac && shortcut.ctrl && !shortcut.meta && !shortcut.customized) {
                shortcut.meta = true;
                shortcut.ctrl = false;
            }
        }
    }

    applyCustomShortcuts() {
        /*
        Example shortcut data structure
        {"shortcut1": {
            "customKeybinds": true,
            "meta": true,
            "shift": false,
            "ctrl": false,
            "alt": true,
            "key": "p",
            "shortcutMode": 0
        }}
        */

        for (const shortcutName in this.shortcutCustomizationData) {
            const customData = this.shortcutCustomizationData[shortcutName];
            const shortcut = this.shortcuts[shortcutName];

            if (!shortcut) {
                continue; // No such shortcut exists
            }

            // Reset shortcut
            shortcut.resetShortcut();

            // If there's no custom keybinds, we can skip this to prevent accidentally overriding the shortcut
            if (customData.customKeybinds) {
                if (
                    typeof customData.shortcutMode === "number" &&
                    customData.shortcutMode > 0 &&
                    customData.shortcutMode <= 3 &&
                    customData.shortcutMode !== shortcut.shortcutMode
                ) {
                    shortcut.setShortcutMode(customData.shortcutMode ?? shortcut.shortcutMode);
                }
                continue;
            }

            // Apply customizations
            if (typeof customData.meta === "boolean") {
                shortcut.meta = customData.meta;
                shortcut.customized = true;
            }
            if (typeof customData.ctrl === "boolean") {
                shortcut.ctrl = customData.ctrl;
                shortcut.customized = true;
            }
            if (typeof customData.alt === "boolean") {
                shortcut.alt = customData.alt;
                shortcut.customized = true;
            }
            if (typeof customData.shift === "boolean") {
                shortcut.shift = customData.shift;
                shortcut.customized = true;
            }
            // For key, allow null to represent unassigned shortcuts
            if (typeof customData.key === "string" || customData.key === null) {
                if (typeof customData.key === "string") {
                    shortcut.key = customData.key.toLowerCase();
                } else {
                    shortcut.key = ""; // Unassigned
                }

                shortcut.customized = true;
            }
            if (typeof customData.shortcutMode === "number" && customData.shortcutMode >= 0 && customData.shortcutMode <= 3) {
                shortcut.setShortcutMode(customData.shortcutMode);
            }
        }
    }

    reapplyCustomShortcuts() {
        this.getCustomizationData();
        this.applyCustomShortcuts();
    }

    updateShortcut(shortcut, data, applyShortcut = true) {
        if (!this.shortcuts[shortcut]) {
            return; // No such shortcut exists
        }

        let shortcutObject = this.shortcuts[shortcut];

        // Update customization entry
        this.shortcutCustomizationData[shortcut] = data;

        // Update shortcuts object
        if (data["customKeybinds"]) {
            shortcutObject.setShortcutKeybind(
                data.meta ?? shortcutObject.meta,
                data.ctrl ?? shortcutObject.ctrl,
                data.alt ?? shortcutObject.alt,
                data.shift ?? shortcutObject.shift,
                data.key ?? shortcutObject.key
            );

            delete data["customKeybinds"];
        }

        if (typeof data.unregistered === "boolean") {
            shortcutObject.unregistered = data.unregistered;
        }

        if (typeof data.shortcutMode === "number" && data.shortcutMode >= 0 && data.shortcutMode <= 3) {
            shortcutObject.setShortcutMode(data.shortcutMode);
        }

        // Update shortcut keybind in the native handler
        let keyElement = document.getElementById(shortcut);

        if (!keyElement) {
            return;
        }

        // Set modifiers
        let modifiers = [];
        if (shortcutObject.meta) {
            modifiers.push("accel");
        }
        if (shortcutObject.ctrl) {
            modifiers.push("control");
        }
        if (shortcutObject.alt) {
            modifiers.push("alt");
        }
        if (shortcutObject.shift) {
            modifiers.push("shift");
        }
        if (modifiers.length > 0) {
            keyElement.setAttribute("modifiers", modifiers.join(","));
        } else {
            keyElement.removeAttribute("modifiers");
        }

        // Set key or keycode
        if (shortcutObject.key.length === 1) {
            keyElement.setAttribute("key", shortcutObject.key.toUpperCase());
            keyElement.removeAttribute("keycode");
        } else if (shortcutObject.key.length > 1) {
            keyElement.setAttribute("keycode", `VK_${shortcutObject.key.toUpperCase()}`);
            keyElement.removeAttribute("key");
        }

        // Disable shortcut if needed
        // If the shortcut is not set to be handled natively, the native event handlers should be
        // disabled to prevent duplicate execution of shortcut
        if (shortcutObject.unregistered || shortcutObject.shortcutMode !== 3) {
            keyElement.setAttribute("disabled", "true");
        } else {
            keyElement.removeAttribute("disabled");
        }

        // If applyShortcut is false, then this is likely being called during initialization
        if (applyShortcut) {
            // Save customization data
            this.saveCustomizationData();

            // Apply changes
            let keysetName = "mainKeyset";
            if (this.shortcuts[shortcut] instanceof NatsumiNativeKeyboardShortcut) {
                if (this.shortcuts[shortcut].isDevSet) {
                    keysetName = "devtoolsKeyset";
                }
            } else {
                keysetName = "natsumiKeyset";
            }

            let keyset = document.getElementById(keysetName);
            if (keyset) {
                // Reattach keyset after 100ms to prevent the new shortcuts from firing
                setTimeout(() => {
                    keyset.parentNode.insertBefore(keyset, keyset.nextSibling);
                }, 100);
            }
        }
    }

    async getCustomizationData() {
        try {
            this.shortcutCustomizationData = await IOUtils.readJSON(this.filePath);
        } catch (e) {
            console.warn("Failed to read Natsumi KBS customization data:", e);
            this.shortcutCustomizationData = {};
        }
    }

    async saveCustomizationData() {
        try {
            await IOUtils.writeJSON(this.filePath, this.shortcutCustomizationData);
        } catch (e) {
            console.error("Failed to save Natsumi KBS customization data:", e);
        }
    }

    getKeyCombination(event) {
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

    ignoreShortcutHandling(duration) {
        if (this.ignoreTimeout) {
            clearTimeout(this.ignoreTimeout);
        }
        this.ignoreShortcuts = true;
        this.ignoreTimeout = setTimeout(() => {
            this.resetIgnore();
        }, duration);
    }

    resetIgnore() {
        if (this.ignoreTimeout) {
            clearTimeout(this.ignoreTimeout);
        }
        this.ignoreShortcuts = false;
        this.ignoreTimeout = null;
    }

    nativeHandleKeyboardShortcuts(shortcutName) {
        // Native shortcuts handler
        const selectedShortcutObject = this.shortcuts[shortcutName];

        // This function doesn't handle native shortcuts, only Natsumi's
        if (selectedShortcutObject instanceof NatsumiNativeKeyboardShortcut) {
            return;
        }

        // Prevent accidental duplicate execution (though this shouldn't happen)
        if (this.ignoreShortcuts || !selectedShortcutObject.nativeHandle) {
            return;
        }

        // Get shortcut action
        if (this.shortcutActions[shortcutName]) {
            this.shortcutActions[shortcutName]();
        } else {
            console.warn(`No action defined for shortcut: ${shortcutName}`);
        }
    }

    handleKeyboardShortcuts(event) {
        /*
        Shortcut modes:
        0. "Assert dominance": Cancels out all shortcuts to ensure Natsumi's shortcut is the only one running.
        1. "Double run": Allow both Natsumi and browser/website shortcuts to run at the same time
        2. "Take turns": Require double press to execute Natsumi's shortcut
        3. "Native handle": Offloads command handling to Firefox instead of letting Natsumi handle it
        */

        // Do not handle shortcuts if ignoring
        if (this.ignoreShortcuts) {
            return;
        }

        const keyCombi = this.getKeyCombination(event);

        if (ucApi.Prefs.get("natsumi.shortcuts.disabled").exists()) {
            if (ucApi.Prefs.get("natsumi.shortcuts.disabled").value) {
                return; // Shortcuts are disabled, so do nothing
            }
        }

        if (document.body.hasAttribute("natsumi-welcome")) {
            return;
        }

        const forbiddenKeys = [
            "meta",
            "control",
            "alt",
            "shift"
        ]

        // Ensure key is not forbidden
        if (forbiddenKeys.includes(keyCombi.key)) {
            return;
        }

        // Check if the key combination matches any defined shortcut
        let selectedShortcutName = null;
        let selectedShortcutObject = null;

        for (const shortcutName in this.shortcuts) {
            const shortcut = this.shortcuts[shortcutName];

            if (shortcut.unregistered) {
                continue;
            }

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

        // If the shortcut is set to be handled by Firefox, do nothing here
        if (selectedShortcutObject.nativeHandle) {
            return;
        }

        // If the shortcut needs a double press to activate, check if a timeout exists
        if (!this.shortcutsPending[selectedShortcutName] && selectedShortcutObject.requireDoublePress) {
            // If no timeout exists, create one
            this.shortcutsPending[selectedShortcutName] = setTimeout(() => {
                delete this.shortcutsPending[selectedShortcutName];
            }, 500); // 500ms timeout for double press detection
            return;
        } else {
            // If a timeout exists, clear it and proceed with the action
            clearTimeout(this.shortcutsPending[selectedShortcutName]);
            delete this.shortcutsPending[selectedShortcutName];
        }

        // "Assert dominance" if the browser should be the one executing the shortcut
        // (it's just canceling out any other actions that this shortcut would trigger)
        if (selectedShortcutObject.browserWins || selectedShortcutObject.requireDoublePress) {
            event.preventDefault();
            event.stopPropagation();
        }

        // Execute the action associated with the shortcut
        if (this.shortcutActions[selectedShortcutName]) {
            this.shortcutActions[selectedShortcutName]();
        } else {
            // Raise warning only if shortcut isn't a native one
            if (!(selectedShortcutObject instanceof NatsumiNativeKeyboardShortcut)) {
                console.warn(`No action defined for shortcut: ${selectedShortcutName}`);
            }
        }

        // Execute native keyboard shortcut action
        if (selectedShortcutObject instanceof NatsumiNativeKeyboardShortcut) {
            // If the shortcut is part of the developer toolbox commands, WHY AND HOW IS IT HERE. GET OUT.
            if (selectedShortcutObject.isDevSet) {
                console.error("Developer toolbox commands cannot be handled by Natsumi's command handler.")
                return;
            }

            // Get the key object
            let keyElement = document.getElementById(selectedShortcutName);
            keyElement.doCommand();
        }
    }
}

if (!document.body.natsumiKBSManager) {
    try {
        document.body.natsumiKBSManager = new NatsumiKBSManager();
        document.body.natsumiKBSManager.init();
    } catch (e) {
        console.error("Failed to initialize Natsumi Keyboard Shortcut Manager:", e);
    }
}
