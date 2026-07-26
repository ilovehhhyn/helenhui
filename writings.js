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

    /* The dropdown rides along on any page that loads this script, including
       index.html, so its styles ship with the script rather than the stylesheet. */
    function injectStyles() {
        if (document.getElementById("writings-nav-styles")) return;
        var css = [
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
            "    font-size: 0.85em; letter-spacing: 0.05em; user-select: none;",
            "    background-color: #000000; transition: background-color 0.2s, color 0.2s;",
            "  }",
            "  .writings-summary:hover { background-color: #ffffff; color: #000000; }",
            "  .writings-links {",
            "    display: none; flex-direction: column; align-items: flex-end;",
            "    gap: 12px; margin-top: 12px; padding: 14px;",
            "    background-color: rgba(0, 0, 0, 0.92); border-radius: 12px;",
            "    max-width: 78vw; max-height: 65vh; overflow-y: auto;",
            "  }",
            "  .writings-toggle:checked ~ .writings-links { display: flex; }",
            "  .writings-links a {",
            "    color: #ffffff; text-decoration: none; font-size: 0.85em;",
            "    line-height: 1.4; text-align: right;",
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

    function init() {
        var titleByPage = {};
        WRITINGS.forEach(function (w) { titleByPage[w.page] = w.title; });

        /* desktop: hover tooltip on every dot, wherever the dots appear */
        Array.prototype.forEach.call(document.querySelectorAll("a.dot"), function (dot) {
            var title = titleByPage[basename(dot.getAttribute("href"))];
            if (title) dot.setAttribute("title", title);
        });

        /* mobile: dots can't be hovered, so list the writings in a dropdown */
        if (document.querySelector(".writings-nav")) return;
        injectStyles();

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

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
