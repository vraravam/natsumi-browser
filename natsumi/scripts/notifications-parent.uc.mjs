// ==UserScript==
// @include   main
// @ignorecache
// ==/UserScript==

import {NatsumiNotificationsParent} from "./notifications.sys.mjs";

const notificationsContainer = document.getElementById("natsumi-notifications-container");
if (!notificationsContainer) {
    new NatsumiNotificationsParent();
}