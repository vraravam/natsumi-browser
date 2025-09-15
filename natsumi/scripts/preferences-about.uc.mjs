// ==UserScript==
// @include   about:preferences*
// @include   about:settings*
// @ignorecache
// @loadOrder 11
// ==/UserScript==

let version;
let branch;

function convertToXUL(node) {
    // noinspection JSUnresolvedReference
    return window.MozXULElement.parseXULToFragment(node);
}

function addAboutPane() {
    let prefsView = document.getElementById("mainPrefPane");
    let homePane = prefsView.querySelector("#firefoxHomeCategory");

    const isStable = branch === "stable";
    const browserName = AppConstants.MOZ_APP_BASENAME;
    const forkedFox = browserName.toLowerCase() !== "firefox";
    let browserVersion = Services.appinfo.version;
    let forkedVersion = AppConstants.MOZ_APP_VERSION_DISPLAY;

    if (browserName.toLowerCase() === "floorp") {
        // Browser version format: [Firefox version]@[Floorp version] (e.g. 142.0.2@12.1.14)
        forkedVersion = forkedVersion.split("@")[1];
    }

    let nodeString = `
        <hbox id="natsumiAboutCategory" class="subcategory" data-category="paneNatsumiAbout" hidden="true">
            <html:h1>About Natsumi</html:h1>
        </hbox>
        <groupbox id="natsumiAboutGroup" class="subcategory" data-category="paneNatsumiAbout" hidden="true">
            <div id="natsumi-about-container">
                <div id="natsumi-about-icon"></div>
                <div id="natsumi-about-name">Natsumi Browser</div>
                <div id="natsumi-about-version-container">
                    <div id="natsumi-about-version"></div>
                    <div id="natsumi-about-stability-badge" hidden="${isStable}"></div>
                </div>
                <div class="natsumi-about-vertical-separator"></div>
                <div id="natsumi-about-mission-container">
                    <div id="natsumi-about-mission">
                        Natsumi is built to make your browser more beautiful and functional, yet remain as customizable
                        as possible.                        
                    </div>
                </div>
                <div class="natsumi-about-vertical-separator"></div>
                <div id="natsumi-about-links-container">
                    <html:a href="https://github.com/greeeen-dev/natsumi-browser" class="natsumi-about-link">Source code</html:a>
                </div>
            </div>
        </groupbox>
    `

    prefsView.insertBefore(convertToXUL(nodeString), homePane);

    // Set metadata
    let versionNode = document.getElementById("natsumi-about-version");
    if (forkedFox) {
        versionNode.textContent = `${version} on ${browserName} ${forkedVersion} (Firefox ${browserVersion})`;
    } else {
        versionNode.textContent = `${version} on Firefox ${browserVersion}`;
    }
}

function addToSidebar() {
    let nodeString = `
    <richlistitem id="natsumi-about" class="category" value="paneNatsumiAbout" data-l10n-id="category-natsumi-shortcuts" data-l10n-attrs="tooltiptext" align="center" tooltiptext="About Natsumi">
        <image class="category-icon"/>
        <label class="category-name" flex="1">
            About Natsumi
        </label>
    </richlistitem>
    `
    let sidebar = document.getElementById("categories");
    const generalPane = sidebar.querySelector("#category-general");
    sidebar.appendChild(convertToXUL(nodeString));

    // noinspection JSUnresolvedReference
    gCategoryInits.set("paneNatsumiAbout", {
        _initted: true,
        init: () => {}
    });
}

// Get Natsumi version
let versionPath = "chrome://natsumi/content/version.json";
fetch(versionPath).then(response => response.json()).then(data => {
    version = data.version;
    branch = data.branch;
    addToSidebar();
    addAboutPane();
}).catch(error => {
    console.error("Failed to fetch Natsumi version:", error);
    version = "Unknown";
    branch = "stable";
    addToSidebar();
    addAboutPane();
});