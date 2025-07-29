// ==UserScript==
// @include   main
// @ignorecache
// ==/UserScript==

// literally just a script for meowing because i felt cute :3

function makeCatNoisesBecauseIFeltVeryCuteWhenWritingThisSoHereIsAFunctionWithAnExcessivelyLongNameThatMakesRandomCatNoises() {
    const catNoises = [
        "meow",
        "mrrp",
        "mrrow",
        "nya"
    ]
    const catNoise = catNoises[Math.floor(Math.random() * catNoises.length)];
    console.log(`${catNoise} :3`);
}

makeCatNoisesBecauseIFeltVeryCuteWhenWritingThisSoHereIsAFunctionWithAnExcessivelyLongNameThatMakesRandomCatNoises();