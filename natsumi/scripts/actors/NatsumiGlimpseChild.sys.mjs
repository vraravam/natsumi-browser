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

            this.sendAsyncMessage("Natsumi:TasterTest", {
                content: event.target.href
            });
        }
    }

    async receiveMessage(message) {
        switch (message.name) {
            // Use this to trigger and receive content from the parent script.
        }
    }
}

/*class NatsumiTasterTabsChild extends JSWindowActorChild {
    constructor() {
        super();
        this.modifierPressed = false;
    }

    actorCreated() {
        console.log("actor is here! :3");
    }

    handleEvent(event) {
        console.log(event);

        if (event.defaultPrevented) {
            return;
        }

        if (event.type === "click") {
            this.onClickEvent(event);
        }
    }

    receiveMessage(message) {
        if (message.name === "Natsumi:TasterModifierPressed") {
            this.modifierPressed = message.data.pressed;
        }
    }

    onClickEvent(event) {
        console.log(event);
        console.log(event.target.closest);

        if (event.target.closest && this.modifierPressed) {
            event.stopPropagation();
            event.preventDefault();

            // Fire test message
            this.sendAsyncMessage("Natsumi:TasterTest", {
                content: "hello world!"
            });
        }
    }
}

export default NatsumiTasterTabsChild;
*/