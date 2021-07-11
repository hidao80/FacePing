/**
 *  Debugging screen for tablets
 *
 *  Usage:
 *     import debug from "./debugTablet.js";
 *     It is also useful to control on/off with the url parameter.
 *     const DEUBG = new URL(window.location.href).searchParams.get('DEBUG') ? true : false;  // Setting the debug flag
 *     debug.init(DEUBG);       // Debugging screen enabled
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
    div: document.createElement("div"),
    details: document.createElement("details"),

    // Output logs
    log: msg => {
        const str = typeof(msg) == "string" ? msg : JSON.stringify(msg,undefined,1);
        debug.div.insertAdjacentHTML("beforeend", `<p>${str}</p><hr>`);
        debug.div.scrollTop = debug.div.scrollHeight;
    },

    // Right-aligned (left-aligned by default)
    alignRight: (condition) => {
        if (condition) {
            debug.details.style.right = 0;
            debug.details.style.left = null;
        } else {
            debug.details.style.right = null;
            debug.details.style.left = 0;
        }
    },

    // Enabling the debug function
    init: isDisplay => {
        const summary = document.createElement("summary");
        summary.textContent = "Details: ";

        const moveOpposite = document.createElement("a");
        moveOpposite.insertAdjacentHTML("beforeend", "Move to the Opposite");
        moveOpposite.addEventListener("click", () => {
            debug.alignRight(debug.details.style.left == "0px");
        });
        summary.appendChild(moveOpposite);

        debug.div.setAttribute("id", "debug-div");
        debug.details.setAttribute("id", "debug-details");
        moveOpposite.setAttribute("id", "debug-opposite");

        debug.details.appendChild(summary);
        debug.details.appendChild(debug.div);

        document.body.appendChild(debug.details);

        document.head.insertAdjacentHTML("beforeend", `
        <style>
        #debug-details {
            display: none;
            position: absolute;
            top: 0;
            width: 350px;
            opacity: 0.6;
            z-index: 2000;
            background-color: gray;
            color: white;
        }
        #debug-details[open] {
            height: -webkit-fill-available;
            max-height: -webkit-fill-available;
        }
        #debug-div {
            height: calc(100% - 1.2rem);
            background-color: gray;
            color: white;
            overflow: scroll;
        }
        #debug-opposite {
            cursor: pointer;
            color: blue;
            font-weight: 800;
        }
        </style>
        `);

        // Whether to display or not
        if (isDisplay) {
            debug.details.style.display = "block";
            debug.details.style.left = 0;
            console.log = debug.log;  // Overwrite console.log
        }
    }
};

export default debug;
