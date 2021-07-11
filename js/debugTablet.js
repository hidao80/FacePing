/**
 *  Debugging screen for tablets
 *
 *  Usage:
 *     import debug from "./debugTablet.js";
 *     It is also useful to control on/off with the url parameter.
 *     debug.init(true);       // Debugging screen enabled
 *     debug.alignRight(true); // Right-aligned (left-aligned by default)
 *
 *  Licence: MIT
 *
 *  Copyright 2021 hidao80
 *
 *  Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 *
 *  The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 *
 *  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
const debug = {
    // Output area
    pane: document.createElement("div"),

    // Output logs
    log: msg => {
        const str = typeof(msg) == "string" ? msg : JSON.stringify(msg,undefined,1);
        debug.pane.insertAdjacentHTML("beforeend", `<p>${str}</p><hr>`);
        debug.pane.scrollTop = debug.pane.scrollHeight;
    },

    // Right-aligned (left-aligned by default)
    alignRight: pos => {
        if (pos) {
            debug.pane.style.right = 0;
            debug.pane.style.left = null;
        } else {
            debug.pane.style.right = null;
            debug.pane.style.left = 0;
        }
    },

    // Enabling the debug function
    init: isDisplay => {
        debug.pane.style.display = "none";
        debug.pane.style.position = "absolute";
        debug.pane.style.backgroundColor = "gray";
        debug.pane.style.color = "white";
        debug.pane.style.top = 0;
        debug.pane.style.left = 0;
        debug.pane.style.height = "-webkit-fill-available";
        debug.pane.style.width = "350px";
        debug.pane.style.opacity = 0.6;
        debug.pane.style.zIndex = 2000;
        debug.pane.style.overflow = "scroll";

        document.body.appendChild(debug.pane);

        // Whether to display or not
        if (isDisplay) {
            debug.pane.style.display = "block";
            console.log = debug.log;  // Overwrite console.log
        }
    }
};

export default debug;
