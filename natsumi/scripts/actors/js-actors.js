const _actors = new Set();
let _lazy = {};

ChromeUtils.defineESModuleGetters(_lazy, {
    ActorManagerParent: 'resource://gre/modules/ActorManagerParent.sys.mjs',
});

const injectAPI = () => {
    if (_actors.has("NatsumiTasterTabs")) {
        return;
    }

    const decl = {};
    decl["NatsumiTasterTabs"] = {
        parent: {
            esModuleURI: 'chrome://natsumi/content/scripts/actors/NatsumiTasterTabsParent.sys.mjs',
        },
        child: {
            esModuleURI: 'chrome://natsumi/content/scripts/actors/NatsumiTasterTabsChild.sys.mjs',
            events: {
                DOMContentLoaded: {},
            },
        },
        matches: [
            "https://example.com/*",
        ],
    };

    try {
        _lazy.ActorManagerParent.addJSWindowActors(decl);
        _actors.add("event");
    } catch (e) {
        console.warn(`Failed to register JSWindowActor: ${e}`);
    }
}

export default injectAPI;

/*
const {ActorManagerParent} = ChromeUtils.importESModule("resource://gre/modules/ActorManagerParent.sys.mjs");

let JSWindowActors = {
    NatsumiTasterTabs: {
        parent: {
            esModuleURI: "resource://natsumi-actors/NatsumiTasterTabsParent.sys.mjs"
        },
        child: {
            esModuleURI: "resource://natsumi-actors/NatsumiTasterTabsChild.sys.mjs",
            events: {
                DOMContentLoaded: {},
            },
        },
        allFrames: true,
        matches: ["*://*\/*"]
    }
}

export class NatsumiActorWrapper {
    addWindowActors(actors) {
        console.log("Registering actors...");
        ActorManagerParent.addJSWindowActors(actors);
    }
}

try {
    let actorWrapper = new NatsumiActorWrapper();
    actorWrapper.addWindowActors(JSWindowActors);
    console.log("actors added...maybe?")
} catch (e) {
    console.error("Failed to add Natsumi JS Window Actors:", e);
}*/