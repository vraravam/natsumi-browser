export class NatsumiTasterTabsChild extends JSWindowActorChild {
    constructor() {
        super();
        console.log("hello world - child");
    }

    handleEvent(event) {
        if (event.type === 'DOMContentLoaded') {
            // Trigger on loading the page
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