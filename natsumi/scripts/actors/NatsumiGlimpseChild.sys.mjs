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
            default: {
                // Do nothing
                break;
            }
        }
    }

    onClickEvent(event) {
        // for testing, force activation to be alt
        if (event.altKey && event.target.href) {
            event.preventDefault();
            event.stopPropagation();

            this.sendAsyncMessage("Natsumi:Glimpse", {
                content: event.target.href
            });
        }
    }
}
