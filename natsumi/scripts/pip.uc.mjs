// ==UserScript==
// @include   chrome://global/content/pictureinpicture/player.xhtml*
// @ignorecache
// ==/UserScript==

// Adjust this as needed
const movementMultiplier = 0.7;

let wheelTimeout = null;

function movePictureInPicture(event) {
    // Get current screen position
    const currentX = screenX;
    const currentY = screenY;

    // Get relative position of mouse within window
    const mouseRelativeX = event.pageX;
    const mouseRelativeY = event.pageY;

    // Get total movable area
    const movableX = screen.availWidth - window.innerWidth;
    const movableY = screen.availHeight - window.innerHeight;

    // Calculate movement based on scroll distance
    const movedX = Math.round(event.wheelDeltaX * movementMultiplier);
    const movedY = Math.round(event.wheelDeltaY * movementMultiplier);

    // Calculate new positions for window
    const newX = Math.min(
        Math.max(currentX + movedX, 0), movableX
    );
    const newY = Math.min(
        Math.max(currentY + movedY, 0), movableY
    );

    // Calculate new positions for mouse
    const nativePixelRatio = window.devicePixelRatio || 1;
    const nativeNewX = newX * nativePixelRatio + (mouseRelativeX * nativePixelRatio);
    let nativeNewY = newY * nativePixelRatio + (mouseRelativeY * nativePixelRatio);;

    // Move PiP window and mouse
    window.moveTo(newX, newY);

    // Ensure the new Y position has been applied correctly
    // Otherwise, move mouse based on that (this often happens due to certain OS behaviors)
    if (newY !== screenY) {
        nativeNewY = screenY * nativePixelRatio + (mouseRelativeY * nativePixelRatio);
    }

    // Move mouse position to allow further scrolling
    if (currentX === screenX && currentY === screenY) {
        // Nothing changed, so no need to move here
        // This prevents "locking" the mouse on OSes with smooth scrolling
        return;
    }

    window.windowUtils.sendNativeMouseEvent(nativeNewX, nativeNewY, 3, 0, 0, null);
    document.body.setAttribute("natsumi-scrolling", "true");

    if (wheelTimeout) {
        clearTimeout(wheelTimeout);
    }

    wheelTimeout = setTimeout(() => {
        document.body.removeAttribute("natsumi-scrolling");
    }, 100);
}

document.addEventListener("wheel", function (e) {
    // we only want to see how this works for now
    movePictureInPicture(e);
});