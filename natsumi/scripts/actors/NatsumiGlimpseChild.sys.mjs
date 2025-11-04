export class NatsumiGlimpseChild extends JSWindowActorChild {
    constructor() {
        super();
    }

    consoleLog(message) {
        this.sendAsyncMessage("Natsumi:ConsoleLog", {"message": message});
    }

    handleEvent(event) {
        switch (event.type) {
            case "DOMContentLoaded": {
                // Trigger on loading the page
                break;
            }
            case "click": {
                this.onClickEvent(event);
                break;
            }
            case "keydown": {

            }
            default: {
                // Do nothing
                break;
            }
        }
    }

    onClickEvent(event) {
        // for testing, force activation to be alt
        let detectedLink = event.target.href || event.target.closest("A").href;

        if (event.altKey && detectedLink) {
            event.preventDefault();
            event.stopPropagation();

            this.sendAsyncMessage("Natsumi:Glimpse", {
                content: detectedLink
            });
        }
    }
}
