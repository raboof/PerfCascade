import * as heuristics from "../../helpers/heuristics";
import * as icons from "../../helpers/icons";
import * as misc from "../../helpers/misc";
import * as svg from "../../helpers/svg";
import { Context } from "../../typing/context";
import { RectData } from "../../typing/rect-data";
import {WaterfallEntry} from "../../typing/waterfall";
import * as indicators from "./svg-indicators";
import * as rowSubComponents from "./svg-row-subcomponents";

// initial clip path
const clipPathElProto = svg.newClipPath("titleClipPath");
clipPathElProto.appendChild(svg.newRect({
  "height": "100%",
  "width": "100%",
}));

// Create row for a single request
export function createRow(context: Context, index: number, rectData: RectData, entry: WaterfallEntry,
                          labelXPos: number, onDetailsOverlayShow: EventListener): SVGGElement {

  const y = rectData.y;
  const rowHeight = rectData.height;
  const leftColumnWith = context.options.leftColumnWith;

  let rowCssClass = ["row-item"];
  if (heuristics.isInStatusCodeRange(entry.rawResource, 500, 599)) {
    rowCssClass.push("status5xx");
  }
  if (heuristics.isInStatusCodeRange(entry.rawResource, 400, 499)) {
    rowCssClass.push("status4xx");
  } else if (entry.rawResource.response.status !== 304 &&
    heuristics.isInStatusCodeRange(entry.rawResource, 300, 399)) {
    // 304 == Not Modified, so not an issue
    rowCssClass.push("status3xx");
  }

  let rowItem = svg.newG(rowCssClass.join(" "));
  let leftFixedHolder = svg.newSvg("left-fixed-holder", {
    "width": `${leftColumnWith}%`,
    "x": "0",
  });
  let flexScaleHolder = svg.newSvg("flex-scale-waterfall", {
    "width": `${100 - leftColumnWith}%`,
    "x": `${leftColumnWith}%`,
  });

  let requestNumber = `${index + 1}. `;

  let rect = rowSubComponents.createRect(rectData, entry.segments, entry.total);
  let shortLabel = rowSubComponents.createRequestLabelClipped(labelXPos, y,
    requestNumber + misc.resourceUrlFormatter(entry.name, 40), rowHeight);
  let fullLabel = rowSubComponents.createRequestLabelFull(labelXPos, y, requestNumber + entry.name, rowHeight);

  let rowName = rowSubComponents.createNameRowBg(y, rowHeight, onDetailsOverlayShow);
  let rowBar = rowSubComponents.createRowBg(y, rowHeight, onDetailsOverlayShow);
  let bgStripe = rowSubComponents.createBgStripe(y, rowHeight, (index % 2 === 0));

  // create and attach request block
  rowBar.appendChild(rect);

  let x = 3;

  if (context.options.showMimeTypeIcon) {
    const icon = indicators.getMimeTypeIcon(entry);
    rowName.appendChild(icons[icon.type](x, y + 3, icon.title));
    x += icon.width;
  }

  if (context.options.showIndicatorIcons) {
    // Create and add warnings for potential issues
    indicators.getIndicatorIcons(entry, context.docIsSsl).forEach((icon: indicators.Icon) => {
      rowName.appendChild(icons[icon.type](x, y + 3, icon.title));
      x += icon.width;
    });
  }
  rowSubComponents.appendRequestLabels(rowName, shortLabel, fullLabel);

  flexScaleHolder.appendChild(rowBar);
  leftFixedHolder.appendChild(clipPathElProto.cloneNode(true));
  leftFixedHolder.appendChild(rowName);

  rowItem.appendChild(bgStripe);
  rowItem.appendChild(flexScaleHolder);
  rowItem.appendChild(leftFixedHolder);

  return rowItem;
}
