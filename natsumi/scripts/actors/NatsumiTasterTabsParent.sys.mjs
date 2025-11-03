export class NatsumiTasterTabsParent extends JSWindowActorParent {
    constructor() {
        super();
        console.log("hello world - parent");
    }

    async receiveMessage(message) {
        if (message.name === "Natsumi:TasterTest") {
            console.log("Received test message from child:", message.data);
        }
    }
}