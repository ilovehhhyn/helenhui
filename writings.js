/* Shared registry of writings.
   Add one entry per writing, in page order. The dot hover-tooltips
   (desktop) and the mobile "writings" dropdown are both generated
   from this list, so a new writing is a one-line change here. */
(function () {
    "use strict";

    var WRITINGS = [
        { page: "page1.html", title: "Evolution of thought on writing" },
        { page: "page2.html", title: "On time" },
        { page: "page3.html", title: "On festivities and utility" },
        { page: "page4.html", title: "On love at 18 years old" },
        { page: "page5.html", title: "On starfish" },
        { page: "page6.html", title: "On gratitude" }
    ];

    function basename(href) {
        if (!href) return "";
        return href.split("/").pop().split("#")[0].split("?")[0];
    }

    /* These ride along on any page that loads this script — index.html and
       gallery.html included — so the styles ship with the script rather than
       living in writing.css, which only the writing pages load. */
    function injectStyles() {
        if (document.getElementById("writings-nav-styles")) return;
        var css = [
            /* --- desktop: hover tooltip on the dots --- */
            ".dot-tooltip {",
            "  position: fixed; z-index: 200; pointer-events: none;",
            "  background-color: rgba(0, 0, 0, 0.92); color: #ffffff;",
            "  border: 1px solid rgba(255, 255, 255, 0.25); border-radius: 8px;",
            "  padding: 6px 10px; font-family: Arial, sans-serif; font-size: 12px;",
            "  line-height: 1.2; white-space: nowrap; letter-spacing: 0.02em;",
            "  opacity: 0; transition: opacity 0.12s ease;",
            "}",
            ".dot-tooltip.visible { opacity: 1; }",

            /* --- mobile: dots can't be hovered, so list the writings instead --- */
            ".writings-nav { display: none; }",
            "@media (max-width: 768px) {",
            "  .writings-nav {",
            /* above index.html's .top-nav, whose box spans the full width on mobile */
            "    display: block; position: fixed; top: 16px; right: 16px;",
            "    z-index: 101; text-align: right;",
            "  }",
            "  .writings-toggle { display: none; }",
            "  .writings-summary {",
            "    display: inline-block; color: #ffffff; border: 1px solid #ffffff;",
            "    padding: 8px 16px; border-radius: 20px; cursor: pointer;",
            "    font-family: Arial, sans-serif; font-size: 0.85em;",
            "    letter-spacing: 0.05em; user-select: none;",
            "    background-color: #000000; transition: background-color 0.2s, color 0.2s;",
            "  }",
            "  .writings-summary:hover { background-color: #ffffff; color: #000000; }",
            "  .writings-links {",
            "    display: none; flex-direction: column; align-items: flex-end;",
            "    gap: 12px; margin-top: 12px; padding: 14px;",
            "    background-color: rgba(0, 0, 0, 0.92); border-radius: 12px;",
            "    border: 1px solid rgba(255, 255, 255, 0.25);",
            "    max-width: 78vw; max-height: 65vh; overflow-y: auto;",
            "  }",
            "  .writings-toggle:checked ~ .writings-links { display: flex; }",
            "  .writings-links a {",
            "    color: #ffffff; text-decoration: none; font-family: Arial, sans-serif;",
            "    font-size: 0.85em; line-height: 1.4; text-align: right;",
            "    border-bottom: 1px solid rgba(255, 255, 255, 0.3); padding-bottom: 6px;",
            "  }",
            "  .writings-links a:last-child { border-bottom: none; padding-bottom: 0; }",
            "  .writings-links a:hover { color: #cccccc; }",
            "}"
        ].join("\n");
        var style = document.createElement("style");
        style.id = "writings-nav-styles";
        style.textContent = css;
        document.head.appendChild(style);
    }

    /* A single shared tooltip positioned per-dot, rather than a ::after on the
       dot itself — the dots scale 1.3x on hover, which would scale the label
       along with them. */
    function setupTooltips(dots, titleByPage) {
        var canHover = !window.matchMedia || window.matchMedia("(hover: hover)").matches;
        if (!canHover) return;

        var tip = document.createElement("div");
        tip.className = "dot-tooltip";
        document.body.appendChild(tip);

        function show(dot, title) {
            tip.textContent = title;
            /* measure at a neutral spot before placing it */
            tip.style.left = "0px";
            tip.style.top = "0px";
            var box = tip.getBoundingClientRect();
            var dotBox = dot.getBoundingClientRect();
            var margin = 8;
            var left = dotBox.left + dotBox.width / 2 - box.width / 2;
            left = Math.max(margin, Math.min(left, window.innerWidth - box.width - margin));
            var top = dotBox.top - box.height - 10;
            if (top < margin) top = dotBox.bottom + 10;
            tip.style.left = left + "px";
            tip.style.top = top + "px";
            tip.classList.add("visible");
        }

        function hide() {
            tip.classList.remove("visible");
        }

        Array.prototype.forEach.call(dots, function (dot) {
            var title = titleByPage[basename(dot.getAttribute("href"))];
            if (!title) return;
            dot.setAttribute("aria-label", title);
            dot.addEventListener("mouseenter", function () { show(dot, title); });
            dot.addEventListener("mouseleave", hide);
            dot.addEventListener("blur", hide);
            dot.addEventListener("focus", function () { show(dot, title); });
        });

        window.addEventListener("scroll", hide, true);
    }

    function buildDropdown() {
        if (document.querySelector(".writings-nav")) return;

        var nav = document.createElement("div");
        nav.className = "writings-nav";

        var toggle = document.createElement("input");
        toggle.type = "checkbox";
        toggle.id = "writings-toggle";
        toggle.className = "writings-toggle";

        var summary = document.createElement("label");
        summary.setAttribute("for", "writings-toggle");
        summary.className = "writings-summary";
        summary.innerHTML = "writings &#9662;";

        var links = document.createElement("div");
        links.className = "writings-links";
        WRITINGS.forEach(function (w) {
            var a = document.createElement("a");
            a.href = w.page;
            a.textContent = w.title;
            links.appendChild(a);
        });

        nav.appendChild(toggle);
        nav.appendChild(summary);
        nav.appendChild(links);
        document.body.appendChild(nav);
    }

    function init() {
        var titleByPage = {};
        WRITINGS.forEach(function (w) { titleByPage[w.page] = w.title; });

        injectStyles();

        var dots = document.querySelectorAll("a.dot");
        if (dots.length) setupTooltips(dots, titleByPage);

        buildDropdown();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
