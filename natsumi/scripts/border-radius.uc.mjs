// ==UserScript==
// @include      main
// @ignorecache
// ==/UserScript==

const cssFix = `
  @media (-moz-platform: linux) {
    :root[windowtype="navigator:browser"]:not([gtktiledwindow="true"]):not([sizemode="maximized"]) body {
      &::after,
      &::before {
        border-radius: env(-moz-gtk-csd-titlebar-radius, 5px) !important;
      }
    }
  }
`;

const radiusFix = document.createElement("style");
radiusFix.id = "natsumi-radius-fix";
radiusFix.textContent = cssFix;
document.head.appendChild(radiusFix);
