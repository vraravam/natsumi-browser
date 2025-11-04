export class NatsumiGlimpseChild extends JSWindowActorChild {
    constructor() {
        super();
        this.activationMethod = "alt";
        this.holdClickTimeout = null;
        this.usedHoldClick = false;
    }

    consoleLog(message) {
        this.sendAsyncMessage("Natsumi:ConsoleLog", {"message": message});
    }

    handleEvent(event) {
        switch (event.type) {
            case "DOMContentLoaded": {
                // Request for Glimpse activation method
                this.sendAsyncMessage("Natsumi:GlimpseActivationMethodRequest", {});
                break;
            }
            case "click": {
                this.onClickEvent(event);
                break;
            }
            case "mousedown": {
                this.onMouseDownEvent(event);
                break;
            }
            case "mouseup": {
                this.onMouseUpEvent(event);
                break;
            }
            default: {
                // Do nothing
                break;
            }
        }
    }

    onMouseDownEvent(event) {
        if (this.activationMethod !== "hold") {
            return;
        }

        let detectedLink = event.target.href || event.target.closest("A").href;
        if (!detectedLink) {
            return;
        }

        this.holdClickTimeout = setTimeout(() => {
            this.usedHoldClick = true;
            this.sendAsyncMessage("Natsumi:Glimpse", {
                content: detectedLink
            });
        }, 500);
    }

    onMouseUpEvent() {
        if (this.activationMethod !== "hold") {
            return;
        }

        if (this.holdClickTimeout) {
            clearTimeout(this.holdClickTimeout);
            this.holdClickTimeout = null;
        }
    }

    onClickEvent(event) {
        // for testing, force activation to be alt
        let detectedLink = event.target.href || event.target.closest("A").href;

        // Do not trigger on hold click activation
        if (this.usedHoldClick) {
            event.preventDefault();
            event.stopPropagation();
            this.usedHoldClick = false;
            return;
        }

        const hasModifier = (
            (event.altKey && this.activationMethod === "alt") ||
            (event.ctrlKey && this.activationMethod === "ctrl") ||
            (event.shiftKey && this.activationMethod === "shift") ||
            (event.metaKey && this.activationMethod === "meta")
        );

        if (hasModifier && detectedLink) {
            event.preventDefault();
            event.stopPropagation();

            this.sendAsyncMessage("Natsumi:Glimpse", {
                content: detectedLink
            });
        }
    }

    async receiveMessage(message) {
        if (message.name === "Natsumi:GlimpseActivationMethod") {
            this.activationMethod = message.data["method"];
        }
    }
}
