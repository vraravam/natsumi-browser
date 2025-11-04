export class NatsumiGlimpseParent extends JSWindowActorParent {
    constructor() {
        super();
        this.natsumiMessageListeners = {}

        // Register listeners
        this.registerMessageListener("Natsumi:ConsoleLog", (message) => {
            console.log("[Child]", message.data["message"]);
        })
        this.registerMessageListener("Natsumi:Glimpse", (message) => {
            console.log("[Glimpse] Got Glimpse link from child:", message.data["content"]);
            this.browsingContext.topChromeWindow.natsumiGlimpse.activateGlimpse(message.data["content"]);
        })
    }

    registerMessageListener(messageName, callback) {
        if (this.natsumiMessageListeners[messageName]) {
            throw new Error("Listener already registered for message");
        }

        this.natsumiMessageListeners[messageName] = callback;
    }

    async receiveMessage(message) {
        if (!this.natsumiMessageListeners[message.name]) {
            console.warn("Got unexpected message from child:", message.name);
            return;
        }

        this.natsumiMessageListeners[message.name](message);
    }
}