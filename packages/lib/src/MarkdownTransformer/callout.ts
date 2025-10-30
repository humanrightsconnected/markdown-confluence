// @ts-expect-error - markdown-it internal modules don't have type declarations
import type MarkdownIt from "markdown-it/lib";
// @ts-expect-error - markdown-it internal modules don't have type declarations
import type StateCore from "markdown-it/lib/rules_core/state_core";
// @ts-expect-error - markdown-it internal modules don't have type declarations
import Token from "markdown-it/lib/token";

const panelRegex =
	/\[!(?<calloutType>.*?)\](?<collapseType>[+-])?[ \t]*(?<title>.*)/;

//panelType Options: "info", "note", "warning", "success", "error", "custom"
const panelTypeToAttributesMap: Record<string, [string, string][]> = {
	note: [["panelType", "note"]],
	abstract: [
		["panelType", "custom"],
		["panelIconId", "784a28f7-4aed-4be0-8d1c-5528271ddf8e"],
		["panelIcon", ":wow:"],
		["panelIconText", "😮"],
		["panelColor", "#FF8F73"],
	],
	info: [["panelType", "info"]],
	todo: [
		["panelType", "custom"],
		["panelIconId", "784a28f7-4aed-4be0-8d1c-5528271ddf8e"],
		["panelIcon", ":wow:"],
		["panelIconText", ":wow:"],
		["panelColor", "#FF8F73"],
	],
	tip: [
		["panelType", "custom"],
		["panelIconId", "784a28f7-4aed-4be0-8d1c-5528271ddf8e"],
		["panelIcon", ":wow:"],
		["panelIconText", ":wow:"],
		["panelColor", "#FF8F73"],
	],
	success: [["panelType", "success"]],
	question: [
		["panelType", "custom"],
		["panelIconId", "784a28f7-4aed-4be0-8d1c-5528271ddf8e"],
		["panelIcon", ":wow:"],
		["panelIconText", ":wow:"],
		["panelColor", "#FF8F73"],
	],
	warning: [["panelType", "warning"]],
	failure: [["panelType", "error"]],
	danger: [
		["panelType", "custom"],
		["panelIconId", "784a28f7-4aed-4be0-8d1c-5528271ddf8e"],
		["panelIcon", ":wow:"],
		["panelIconText", ":wow:"],
		["panelColor", "#FF8F73"],
	],
	bug: [
		["panelType", "custom"],
		["panelIconId", "784a28f7-4aed-4be0-8d1c-5528271ddf8e"],
		["panelIcon", ":wow:"],
		["panelIconText", ":wow:"],
		["panelColor", "#FF8F73"],
	],
	example: [
		["panelType", "custom"],
		["panelIconId", "784a28f7-4aed-4be0-8d1c-5528271ddf8e"],
		["panelIcon", ":wow:"],
		["panelIconText", ":wow:"],
		["panelColor", "#FF8F73"],
	],
	quote: [
		["panelType", "custom"],
		["panelIconId", "784a28f7-4aed-4be0-8d1c-5528271ddf8e"],
		["panelIcon", ":wow:"],
		["panelIconText", ":wow:"],
		["panelColor", "#FF8F73"],
	],
};

function getPanelAttributes(calloutType: string): [string, string][] {
	const calloutTypeCheck = calloutType.toLowerCase();
	const toReturn = panelTypeToAttributesMap[calloutTypeCheck];
	if (toReturn) {
		return toReturn;
	}

	// @ts-expect-error - TypeScript thinks "info" key could be undefined, but it's always defined in panelTypeToAttributesMap
	return panelTypeToAttributesMap["info"];
}

/**
 * Markdown-it plugin that converts special blockquote callouts into ADF panel/expand nodes.
 */
export default function calloutPlugin(md: MarkdownIt): void {
	md.core.ruler.push("panel", panel);
	md.core.ruler.push("expand", () => false);
}

function capitalizeFirstLetter(string: string) {
	return string.charAt(0).toUpperCase() + string.slice(1);
}

/**
 * Core rule that recognizes callout/expand syntax inside blockquotes and rewrites tokens.
 */
export function panel(state: StateCore): boolean {
	let isInCallout = false;
	let adfType = "panel";
	let calloutStartIndex = 0;
	let blockTitle = "";
	const newTokens = state.tokens.reduce(
		(
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			previousTokens: any[],
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			token: any,
			currentIndex: number,
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			allTokens: any[],
		) => {
			let tokenToReturn = token;
			if (token.type === "blockquote_open") {
				let currentCheck = currentIndex + 1; // Start after this token

				while (true) {
					const tokenToCheck = allTokens[currentCheck];
					currentCheck = currentCheck + 1;
					if (!tokenToCheck) {
						continue;
					}
					if (tokenToCheck.type === "blockquote_close") {
						break;
					}
					if (tokenToCheck.content === "") {
						continue;
					}

					const check = tokenToCheck.content.match(panelRegex);

					if (
						check === null ||
						check === undefined ||
						check.groups === undefined
					) {
						continue;
					}

					const calloutType = check.groups["calloutType"] ?? "info";
					const collapseType = check.groups["collapseType"];
					const title = check.groups["title"];
					calloutStartIndex = currentCheck - 1;
					isInCallout = true;
					blockTitle = title ? title : calloutType;

					if (collapseType === "+" || collapseType === "-") {
						adfType = "expand";
						tokenToReturn = new state.Token("expand_open", "", 0);
						tokenToReturn.markup = ">";
						tokenToReturn.block = true;
						tokenToReturn.nesting = 1;

						tokenToReturn.attrs = [["title", blockTitle]];
					} else {
						adfType = "panel";
						tokenToReturn = new state.Token("panel_open", "", 0);
						tokenToReturn.markup = ">";
						tokenToReturn.block = true;
						tokenToReturn.nesting = 1;
						tokenToReturn.attrs = getPanelAttributes(calloutType);
					}

					break;
				}
			}
			if (token.type === "blockquote_close" && isInCallout) {
				token.type = `${adfType}_close`;
				token.tag = "";
			}
			if (currentIndex === calloutStartIndex && isInCallout) {
				const check = token.content.match(panelRegex);
				const calloutTitle = capitalizeFirstLetter(blockTitle);
				if (check && check.length > 1) {
					token.content = token.content.replace(
						check[0],
						calloutTitle,
					);
					if (token.children) {
						for (let i = 0; i < token.children.length; i++) {
							const child = token.children[i];
							if (child && child.content.includes(check[0])) {
								child.content = child.content.replace(
									check[0],
									calloutTitle,
								);
								break;
							}
						}
					}
				}
			}

			return [...previousTokens, tokenToReturn];
		},
		[] as Token[],
	);

	state.tokens = newTokens;
	return true;
}
