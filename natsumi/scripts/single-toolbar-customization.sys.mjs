export const customizationFilePath = PathUtils.join(PathUtils.profileDir, "natsumi-single-toolbar-buttons.json");
const blacklistedIds = [
    "sidebar-button",
    "back-button",
    "forward-button",
    "stop-reload-button",
    "urlbar-container",
    "unified-extensions-button"
]
const blacklistedTypes = [
    "toolbarspring"
]

export async function enableCustomizableToolbar() {
    let widgetsData = [];

    // Get widgets and keep track of their positions
    let widgets;
    try {
        widgets = CustomizableUI.getWidgetsInArea("nav-bar");
    } catch (e) {
        console.error("Failed to get widgets in nav-bar:", e);
        return;
    }

    let currentRelativePosition = 0;
    for (let i = 0; i < widgets.length; i++) {
        let widgetObject = widgets[i];

        // Ensure widget is not null
        if (!widgetObject) {
            continue;
        }

        let widgetNode = widgetObject.instances[0].node;

        if (blacklistedIds.includes(widgetObject.id)) {
            continue;
        }
        if (blacklistedTypes.includes(widgetNode.nodeName)) {
            continue;
        }

        widgetsData.push({
            "position": i,
            "relativePosition": currentRelativePosition,
            "id": widgetObject.id
        });
        currentRelativePosition++;
    }

    // Save widgets data
    try {
        await IOUtils.writeJSON(customizationFilePath, widgetsData);
    } catch (e) {
        console.error("Failed to write single toolbar buttons customization file:", e);
    }

    // Move stuff to overflow
    for (let i = 0; i < widgetsData.length; i++) {
        let widgetId = widgetsData[i].id;
        CustomizableUI.addWidgetToArea(widgetId, "widget-overflow-fixed-list", widgetsData[i].relativePosition);
    }
}

export async function resetCustomizableToolbar() {
    let widgetsData;

    // Read widgets data
    try {
        widgetsData = await IOUtils.readJSON(customizationFilePath);
    } catch (e) {
        console.error("Failed to read single toolbar buttons customization file:", e);
        return;
    }

    // Move widgets back into place
    for (let i = 0; i < widgetsData.length; i++) {
        let widgetId = widgetsData[i].id;
        CustomizableUI.addWidgetToArea(widgetId, "nav-bar", widgetsData[i].position);
    }
}