// ==UserScript==
// @include   chrome://global/content/pictureinpicture/player.xhtml*
// @ignorecache
// ==/UserScript==

function movePictureInPicture(event) {
    const currentX = screenX;
    const currentY = screenY;

    const movableX = screen.availWidth - window.innerWidth;
    const movableY = screen.availHeight - window.innerHeight;

    const nativePixelRatio = window.devicePixelRatio || 1;
    const nativeAvailableX = window.innerWidth * nativePixelRatio;
    const nativeAvailableY = window.innerHeight * nativePixelRatio;

    const width = event.pageX;
    const height = event.pageY;

    const movementMultiplier = 0.7;
    const movedX = Math.round(event.wheelDeltaX * movementMultiplier);
    const movedY = Math.round(event.wheelDeltaY * movementMultiplier);

    const newX = Math.min(
        Math.max(currentX + movedX, 0), movableX
    );
    const newY = Math.min(
        Math.max(currentY + movedY, 0), movableY
    );
    const nativeNewX = newX * nativePixelRatio + (width * nativePixelRatio);
    const nativeNewY = newY * nativePixelRatio + (height * nativePixelRatio);

    console.log(`Moving Picture-in-Picture to: (${newX}, ${newY}) (w: ${movableX}, h: ${movableY})`);
    document.querySelector("body").focus();
    window.windowUtils.sendNativeMouseEvent(nativeNewX, nativeNewY, 3, 0, 0, null);

    window.moveTo(newX, newY);
}

document.addEventListener("wheel", function (e) {
    // we only want to see how this works for now
    movePictureInPicture(e);
});