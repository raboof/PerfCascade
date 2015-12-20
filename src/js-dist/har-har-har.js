/*HarHarHar build:20/12/2015 */

(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/*
DOM Helpers
*/
var dom = {
    newTextNode: function (text) {
        return document.createTextNode(text);
    },
    //creat html tag
    newTag: function (tagName, settings, css) {
        settings = settings || {};
        var tag = document.createElement(tagName);
        for (var attr in settings) {
            if (attr != "text") {
                tag[attr] = settings[attr];
            }
        }
        if (settings.text) {
            tag.textContent = settings.text;
        }
        else if (settings.childElement) {
            if (typeof settings.childElement === "object") {
                //if childNodes NodeList is passed in
                if (settings.childElement instanceof NodeList) {
                    //NodeList is does not inherit from array
                    Array.prototype.slice.call(settings.childElement, 0).forEach(function (childNode) {
                        tag.appendChild(childNode);
                    });
                }
                else {
                    tag.appendChild(settings.childElement);
                }
            }
            else {
                tag.appendChild(dom.newTextNode(settings.childElement));
            }
        }
        if (settings.class) {
            tag.className = settings.class;
        }
        tag.style.cssText = css || "";
        return tag;
    },
    tableFactory: function (id, headerBuilder, rowBuilder) {
        if (id === void 0) { id = ""; }
        var tableHolder = dom.newTag("div", {
            id: id,
            class: "table-holder"
        });
        var table = dom.newTag("table");
        var thead = dom.newTag("thead");
        thead.appendChild(headerBuilder(dom.newTag("tr")));
        table.appendChild(thead);
        table.appendChild(rowBuilder(dom.newTag("tbody")));
        tableHolder.appendChild(table);
        return tableHolder;
    },
    combineNodes: function (a, b) {
        var wrapper = document.createElement("div");
        if (typeof a === "object") {
            wrapper.appendChild(a);
        }
        else if (typeof a === "string") {
            wrapper.appendChild(dom.newTextNode(a));
        }
        if (typeof b === "object") {
            wrapper.appendChild(b);
        }
        else if (typeof b === "string") {
            wrapper.appendChild(dom.newTextNode(b));
        }
        return wrapper.childNodes;
    },
    addClass: function (el, className) {
        if (el.classList) {
            el.classList.add(className);
        }
        else {
            // IE doesn't support classList in SVG - also no need for dublication check i.t.m.
            el.setAttribute("class", el.getAttribute("class") + " " + className);
        }
        return el;
    },
    removeClass: function (el, className) {
        if (el.classList) {
            el.classList.remove(className);
        }
        else {
            //IE doesn't support classList in SVG - also no need for dublication check i.t.m.
            el.setAttribute("class", el.getAttribute("class").replace(new RegExp("(\\s|^)" + className + "(\\s|$)", "g"), "$2"));
        }
        return el;
    },
    removeAllChildren: function (el) {
        while (el.childNodes.length > 0) {
            el.removeChild(el.childNodes[0]);
        }
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = dom;

},{}],2:[function(require,module,exports){
/*
SVG Helpers
*/
var svg = {
    newEl: function (tagName, settings, css) {
        var el = document.createElementNS("http://www.w3.org/2000/svg", tagName);
        settings = settings || {};
        for (var attr in settings) {
            if (attr != "text") {
                el.setAttributeNS(null, attr, settings[attr]);
            }
        }
        el.textContent = settings.text || "";
        el.style.cssText = css || "";
        return el;
    },
    newTextEl: function (text, y, css) {
        if (css === void 0) { css = ""; }
        return svg.newEl("text", {
            fill: "#111",
            y: y.toString(),
            text: text
        }, (css + " text-shadow:0 0 4px #fff;"));
    },
    //needs access to body to measure size
    //TODO: refactor for server side use
    getNodeTextWidth: function (textNode) {
        var tmp = svg.newEl("svg:svg", {}, "visibility:hidden;");
        tmp.appendChild(textNode);
        window.document.body.appendChild(tmp);
        var nodeWidth = textNode.getBBox().width;
        tmp.parentNode.removeChild(tmp);
        return nodeWidth;
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = svg;

},{}],3:[function(require,module,exports){
/*
Helper to create waterfall timelines
*/
var svg_1 = require("../helpers/svg");
var dom_1 = require("../helpers/dom");
var waterfall = {
    //model for block and segment
    setupTimeLine: function (data) {
        var unit = data.durationMs / 100, barsToShow = data.blocks
            .filter(function (block) { return (typeof block.start == "number" && typeof block.total == "number"); })
            .sort(function (a, b) { return (a.start || 0) - (b.start || 0); }), maxMarkTextLength = data.marks.length > 0 ? data.marks.reduce(function (currMax, currValue) {
            return Math.max((typeof currMax == "number" ? currMax : 0), svg_1.default.getNodeTextWidth(svg_1.default.newTextEl(currValue.name, 0)));
        }) : 0, diagramHeight = (barsToShow.length + 1) * 25, chartHolderHeight = diagramHeight + maxMarkTextLength + 35;
        var timeLineHolder = svg_1.default.newEl("svg:svg", {
            height: Math.floor(chartHolderHeight),
            class: "water-fall-chart"
        });
        var timeLineLabelHolder = svg_1.default.newEl("g", { class: "labels" });
        var endline = svg_1.default.newEl("line", {
            x1: "0",
            y1: "0",
            x2: "0",
            y2: diagramHeight,
            class: "line-end"
        });
        var startline = svg_1.default.newEl("line", {
            x1: "0",
            y1: "0",
            x2: "0",
            y2: diagramHeight,
            class: "line-start"
        });
        var onRectMouseEnter = function (evt) {
            var targetRect = evt.target;
            dom_1.default.addClass(targetRect, "active");
            var xPosEnd = targetRect.x.baseVal.valueInSpecifiedUnits + targetRect.width.baseVal.valueInSpecifiedUnits + "%";
            var xPosStart = targetRect.x.baseVal.valueInSpecifiedUnits + "%";
            endline.x1.baseVal.valueAsString = xPosEnd;
            endline.x2.baseVal.valueAsString = xPosEnd;
            startline.x1.baseVal.valueAsString = xPosStart;
            startline.x2.baseVal.valueAsString = xPosStart;
            dom_1.default.addClass(endline, "active");
            dom_1.default.addClass(startline, "active");
            targetRect.parentNode.appendChild(endline);
            targetRect.parentNode.appendChild(startline);
        };
        var onRectMouseLeave = function (evt) {
            dom_1.default.removeClass(evt.target, "active");
            dom_1.default.removeClass(endline, "active");
            dom_1.default.removeClass(startline, "active");
        };
        var createRect = function (width, height, x, y, cssClass, label, segments) {
            var rectHolder;
            var rect = svg_1.default.newEl("rect", {
                width: (width / unit) + "%",
                height: height - 1,
                x: Math.round((x / unit) * 100) / 100 + "%",
                y: y,
                class: ((segments && segments.length > 0 ? "time-block" : "segment")) + " " + (cssClass || "block-undefined")
            });
            if (label) {
                rect.appendChild(svg_1.default.newEl("title", {
                    text: label
                })); // Add tile to wedge path
            }
            rect.addEventListener("mouseenter", onRectMouseEnter);
            rect.addEventListener("mouseleave", onRectMouseLeave);
            if (segments && segments.length > 0) {
                rectHolder = svg_1.default.newEl("g");
                rectHolder.appendChild(rect);
                segments.forEach(function (segment) {
                    if (segment.total > 0 && typeof segment.start === "number") {
                        rectHolder.appendChild(createRect(segment.total, 8, segment.start || 0.001, y, segment.cssClass, segment.name + " (" + Math.round(segment.start) + "ms - " + Math.round(segment.end) + "ms | total: " + Math.round(segment.total) + "ms)"));
                    }
                });
                return rectHolder;
            }
            else {
                return rect;
            }
        };
        var createBgRect = function (block) {
            var rect = svg_1.default.newEl("rect", {
                width: ((block.total || 1) / unit) + "%",
                height: diagramHeight,
                x: ((block.start || 0.001) / unit) + "%",
                y: 0,
                class: block.cssClass || "block-undefined"
            });
            rect.appendChild(svg_1.default.newEl("title", {
                text: block.name
            })); // Add tile to wedge path
            return rect;
        };
        var createTimeWrapper = function () {
            var timeHolder = svg_1.default.newEl("g", { class: "time-scale full-width" });
            for (var i = 0, secs = data.durationMs / 1000, secPerc = 100 / secs; i <= secs; i++) {
                var lineLabel = svg_1.default.newTextEl(i + "sec", diagramHeight);
                if (i > secs - 0.2) {
                    lineLabel.setAttribute("x", secPerc * i - 0.5 + "%");
                    lineLabel.setAttribute("text-anchor", "end");
                }
                else {
                    lineLabel.setAttribute("x", secPerc * i + 0.5 + "%");
                }
                var lineEl = svg_1.default.newEl("line", {
                    x1: secPerc * i + "%",
                    y1: "0",
                    x2: secPerc * i + "%",
                    y2: diagramHeight
                });
                timeHolder.appendChild(lineEl);
                timeHolder.appendChild(lineLabel);
            }
            return timeHolder;
        };
        var renderMarks = function () {
            var marksHolder = svg_1.default.newEl("g", {
                transform: "scale(1, 1)",
                class: "marker-holder"
            });
            data.marks.forEach(function (mark, i) {
                var x = mark.startTime / unit;
                var markHolder = svg_1.default.newEl("g", {
                    class: "mark-holder"
                });
                var lineHolder = svg_1.default.newEl("g", {
                    class: "line-holder"
                });
                var lineLableHolder = svg_1.default.newEl("g", {
                    class: "line-lable-holder",
                    x: x + "%"
                });
                mark.x = x;
                var lineLabel = svg_1.default.newTextEl(mark.name, diagramHeight + 25);
                //lineLabel.setAttribute("writing-mode", "tb")
                lineLabel.setAttribute("x", x + "%");
                lineLabel.setAttribute("stroke", "");
                lineHolder.appendChild(svg_1.default.newEl("line", {
                    x1: x + "%",
                    y1: 0,
                    x2: x + "%",
                    y2: diagramHeight
                }));
                if (data.marks[i - 1] && mark.x - data.marks[i - 1].x < 1) {
                    lineLabel.setAttribute("x", data.marks[i - 1].x + 1 + "%");
                    mark.x = data.marks[i - 1].x + 1;
                }
                //would use polyline but can't use percentage for points 
                lineHolder.appendChild(svg_1.default.newEl("line", {
                    x1: x + "%",
                    y1: diagramHeight,
                    x2: mark.x + "%",
                    y2: diagramHeight + 23
                }));
                var isActive = false;
                var onLableMouseEnter = function (evt) {
                    if (!isActive) {
                        isActive = true;
                        dom_1.default.addClass(lineHolder, "active");
                        //firefox has issues with this
                        markHolder.parentNode.appendChild(markHolder);
                    }
                };
                var onLableMouseLeave = function (evt) {
                    isActive = false;
                    dom_1.default.removeClass(lineHolder, "active");
                };
                lineLabel.addEventListener("mouseenter", onLableMouseEnter);
                lineLabel.addEventListener("mouseleave", onLableMouseLeave);
                lineLableHolder.appendChild(lineLabel);
                markHolder.appendChild(svg_1.default.newEl("title", {
                    text: mark.name + " (" + Math.round(mark.startTime) + "ms)",
                }));
                markHolder.appendChild(lineHolder);
                marksHolder.appendChild(markHolder);
                markHolder.appendChild(lineLableHolder);
            });
            return marksHolder;
        };
        timeLineHolder.appendChild(createTimeWrapper());
        timeLineHolder.appendChild(renderMarks());
        data.lines.forEach(function (block, i) {
            timeLineHolder.appendChild(createBgRect(block));
        });
        barsToShow.forEach(function (block, i) {
            var blockWidth = block.total || 1;
            var y = 25 * i;
            timeLineHolder.appendChild(createRect(blockWidth, 25, block.start || 0.001, y, block.cssClass, block.name + " (" + block.start + "ms - " + block.end + "ms | total: " + block.total + "ms)", block.segments));
            var blockLabel = svg_1.default.newTextEl(block.name + " (" + Math.round(block.total) + "ms)", (y + (block.segments ? 20 : 17)));
            if (((block.total || 1) / unit) > 10 && svg_1.default.getNodeTextWidth(blockLabel) < 200) {
                blockLabel.setAttribute("class", "inner-label");
                blockLabel.setAttribute("x", ((block.start || 0.001) / unit) + 0.5 + "%");
                blockLabel.setAttribute("width", (blockWidth / unit) + "%");
            }
            else if (((block.start || 0.001) / unit) + (blockWidth / unit) < 80) {
                blockLabel.setAttribute("x", ((block.start || 0.001) / unit) + (blockWidth / unit) + 0.5 + "%");
            }
            else {
                blockLabel.setAttribute("x", (block.start || 0.001) / unit - 0.5 + "%");
                blockLabel.setAttribute("text-anchor", "end");
            }
            blockLabel.style.opacity = block.name.match(/js.map$/) ? "0.5" : "1";
            timeLineLabelHolder.appendChild(blockLabel);
        });
        timeLineHolder.appendChild(timeLineLabelHolder);
        return timeLineHolder;
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = waterfall;

},{"../helpers/dom":1,"../helpers/svg":2}],4:[function(require,module,exports){
var waterfall_1 = require("./helpers/waterfall");
var dom_1 = require('./helpers/dom');
var har_1 = require('./transformers/har');
function showErrorMsg(msg) {
    alert(msg);
}
var outputHolder = document.getElementById("output");
function onFileInput(evt) {
    var files = evt.target.files;
    if (!files) {
        showErrorMsg("Failed to load HAR file");
        return;
    }
    var reader = new FileReader();
    reader.onload = (function (e) {
        var harData;
        try {
            //TODO: add proper check for HAR file and later other formats
            harData = JSON.parse(e.target["result"]);
        }
        catch (e) {
            showErrorMsg("File does not seem to be a valid HAR file");
            return undefined;
        }
        renderHar(harData.log);
    });
    reader.readAsText(files[0]);
}
document.getElementById('fileinput').addEventListener('change', onFileInput, false);
function renderHar(logData) {
    var data = har_1.default.transfrom(logData);
    var x = waterfall_1.default.setupTimeLine(data);
    dom_1.default.removeAllChildren(outputHolder);
    outputHolder.appendChild(x);
    console.log(x);
}
//Dev/Test only - load test file TODO: remove
window["fetch"]("test-data/www.google.co.kr.har").then(function (f) { return f.json().then(function (j) { return renderHar(j.log); }); });
console.log(waterfall_1.default);

},{"./helpers/dom":1,"./helpers/waterfall":3,"./transformers/har":5}],5:[function(require,module,exports){
var time_block_1 = require('../typing/time-block');
var HarTransformer = (function () {
    function HarTransformer() {
    }
    HarTransformer.makeBlockCssClass = function (mimeType) {
        var types = mimeType.split("/");
        switch (types[0]) {
            case "image": return "block-image";
        }
        switch (types[1]) {
            case "x-font-woff": return "block-font";
        }
        return "block-" + mimeType.split("/")[1];
    };
    HarTransformer.transfrom = function (data) {
        var _this = this;
        console.log("HAR created by %s(%s) of %s page(s)", data.creator.name, data.creator.version, data.pages.length);
        //temp - TODO: remove
        window["data"] = data;
        console["table"](data.entries);
        var lastEndTime = 0;
        //only support one page for now
        var blocks = data.entries
            .filter(function (entry) { return entry.pageref === data.pages[0].id; })
            .map(function (entry) {
            var currPage = data.pages.filter(function (page) { return page.id === entry.pageref; })[0];
            var pageStartDate = new Date(currPage.startedDateTime);
            var entryStartDate = new Date(entry.startedDateTime);
            var startRelative = entryStartDate.getTime() - pageStartDate.getTime();
            console.log(startRelative);
            if (lastEndTime < (startRelative + entry.time)) {
                lastEndTime = startRelative + entry.time;
            }
            return new time_block_1.default(entry.request.url, startRelative, startRelative + entry.time, _this.makeBlockCssClass(entry.response.content.mimeType), [], entry);
        });
        console["table"](blocks);
        return {
            durationMs: lastEndTime,
            blocks: blocks,
            marks: [],
            lines: [],
        };
    };
    return HarTransformer;
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = HarTransformer;

},{"../typing/time-block":6}],6:[function(require,module,exports){
var TimeBlock = (function () {
    function TimeBlock(name, start, end, cssClass, segments, rawResource) {
        if (cssClass === void 0) { cssClass = ""; }
        if (segments === void 0) { segments = []; }
        this.name = name;
        this.start = start;
        this.end = end;
        this.cssClass = cssClass;
        this.segments = segments;
        this.rawResource = rawResource;
        this.total = (typeof start !== "number" || typeof end !== "number") ? undefined : (end - start);
    }
    return TimeBlock;
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = TimeBlock;

},{}]},{},[4]);