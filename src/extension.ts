import { workspace, window, Range, TextEditorDecorationType, commands, Position, DecorationRenderOptions } from "vscode";

const colourMap: Record<string, string> = {
	0: "#CACACA",
	1: "#FFFFFF",
	2: "#1EFF00",
	3: "#0070DD",
	4: "#B035EE",
	5: "#FF8000",
	6: "#FF8000",
	7: "#FF8000",
	8: "#FF8000",
	9: "#FF8000",
	a: "#000000",
	b: "#3F3F3F",
	c: "#676767",
	d: "#7D0000",
	e: "#8E3434",
	f: "#A34F00",
	g: "#725437",
	h: "#A88600",
	i: "#B2934A",
	j: "#939500",
	k: "#495225",
	l: "#299400",
	m: "#23381B",
	n: "#00535B",
	o: "#324A4C",
	p: "#0073A6",
	q: "#385A6C",
	r: "#010067",
	s: "#507AA1",
	t: "#601C81",
	u: "#43314C",
	v: "#8C0069",
	w: "#973984",
	x: "#880024",
	y: "#762E4A",
	z: "#101215",
	A: "#FFFFFF",
	B: "#CACACA",
	C: "#9B9B9B",
	D: "#FF0000",
	E: "#FF8383",
	F: "#FF8000",
	G: "#F3AA6F",
	H: "#FBC803",
	I: "#FFD863",
	J: "#FFF404",
	K: "#F3F998",
	L: "#1EFF00",
	M: "#B3FF9B",
	N: "#00FFFF",
	O: "#8FE6FF",
	P: "#0070DD",
	Q: "#A4E3FF",
	R: "#0000FF",
	S: "#7AB2F4",
	T: "#B035EE",
	U: "#E6C4FF",
	V: "#FF00EC",
	W: "#FF96E0",
	X: "#FF0070",
	Y: "#FF6A98",
	Z: "#0C112B"
};

const trustUsers: string[] = [
	"accts",
	"autos",
	"binmat",
	"chats",
	"corps",
	"escrow",
	"gui",
	"kernel",
	"market",
	"scripts",
	"sys",
	"trust",
	"users"
];

const decorations: TextEditorDecorationType[] = [];

let config = workspace.getConfiguration("hackmud-color");

export function activate() {
	window.onDidChangeActiveTextEditor(decorate);
	workspace.onDidChangeTextDocument(decorate);
	workspace.onDidChangeConfiguration(() => {
		config = workspace.getConfiguration("hackmud-color");
		decorate();
	});

	commands.registerCommand("hackmud-color.enable", () => {
		config.update("enabled", true);
	});

	commands.registerCommand("hackmud-color.disable", () => {
		config.update("enabled", false);
	});

	decorate();
}

export function deactivate() {}

function decorate() {
	for (const decoration of decorations.splice(0)) {
		decoration.dispose();
	}

	if (window.activeTextEditor && config.get("enabled")) {
		const { positionAt, languageId } = window.activeTextEditor.document;
		const text = window.activeTextEditor.document.getText();
		const coloursRanges = new Map<string, Range[]>();
		const stringRanges: Range[] = [];
		const strikeRanges: Range[] = [];

		switch (languageId) {
			case "javascript":
			case "typescript": {
				const scriptOrangeRanges: Range[] = [];
				const scriptGreyRanges: Range[] = [];
				const scriptGreenRanges: Range[] = [];
				const keyRanges: Range[] = [];
				const valueRanges: Range[] = [];

				for (let { index: stringIndex, match: stringMatch } of matches(/\/\/.*$|"([^\\\n]|\\.|\\\n)*?"|'([^\\\n]|\\.|\\\n)*?'|\/([^\\]|\\.)*?\/|`([^\\\n]|\\.|\\\n)*?`/gm, text)) {
					if (stringMatch[0] !== "/") {
						stringIndex++;
						stringMatch = stringMatch.slice(1, -1);

						stringRanges.push(new Range(positionAt(stringIndex), positionAt(stringIndex + stringMatch.length)));

						for (const { index, match } of matches(/`[^\W_]((?!`|\\n).)+`/g, stringMatch)) {
							colour(positionAt, stringIndex + index, match, coloursRanges, strikeRanges);
						}

						for (const { index, match } of matches(/\\./g, stringMatch)) {
							const offset = stringIndex + index;

							if (match[1] === "n" || match[1] === "t") {
								strikeRanges.push(new Range(positionAt(offset), positionAt(offset + 2)));
							} else {
								strikeRanges.push(new Range(positionAt(offset), positionAt(offset + 1)));
							}
						}

						// Thank you @Dart#0719 and @Aniketos#3964 for help with regex
						for (let { index, match } of matches(/(?<!#[^s]?.*)(?:#s\.)?([a-z_][a-z0-9_]*\.[a-z_][a-z0-9_]*)/g, stringMatch)) {
							if (match[0] === "#") {
								index += 3;
								match = match.slice(3);
							}

							const offset = stringIndex + index;

							const [ user ] = match.split(".");

							(trustUsers.includes(user) ? scriptOrangeRanges : scriptGreyRanges).push(new Range(positionAt(offset), positionAt(offset + user.length)));
							scriptGreenRanges.push(new Range(positionAt(offset + user.length + 1), positionAt(offset + match.length)));
						}

						for (const { index, match } of matches(/([a-zA-Z_]\w*|"[^"]+?") ?: ?(\\?".*?"|[0-9]+|true|false|{|\[)/g, stringMatch)) {
							const offset = stringIndex + index;
							const startPos = positionAt(offset);

							let colon;

							if (match[0] === '"') {
								const keyEnd = match.indexOf('"', 1);

								colon = match.indexOf(":", keyEnd);

								if (/^[a-zA-Z_]\w*\\?$/.exec(match.slice(1, keyEnd))) {
									const keyStartPos = positionAt(offset + 1);
									const keyEndPos = positionAt(offset + keyEnd);

									keyRanges.push(new Range(keyStartPos, keyEndPos));
									strikeRanges.push(new Range(startPos, keyStartPos));
									strikeRanges.push(new Range(keyEndPos, positionAt(offset + keyEnd + 1)));
								} else {
									keyRanges.push(new Range(startPos, positionAt(offset + keyEnd + 1)));
								}
							} else {
								colon = match.indexOf(":");
								keyRanges.push(new Range(startPos, positionAt(offset + match.search(/ |:/))));
							}

							valueRanges.push(new Range(positionAt(offset + colon + 1 + match.slice(colon + 1).search(/[^ ]/)), positionAt(offset + match.length)));
						}

						for (const { index } of matches(/\\\\"/gs, stringMatch)) {
							const offset = stringIndex + index;

							strikeRanges.push(new Range(positionAt(offset), positionAt(offset + 2)));
						}
					}
				}

				addDecoration({ color: colourMap.F }, scriptOrangeRanges);
				addDecoration({ color: colourMap.C }, scriptGreyRanges);
				addDecoration({ color: colourMap.L }, scriptGreenRanges);
				addDecoration({ color: colourMap.N }, keyRanges);
				addDecoration({ color: colourMap.V }, valueRanges);

				break;
			} case "plaintext": {
				const linkRanges: Range[] = [];

				stringRanges.push(new Range(positionAt(0), positionAt(text.length)));

				for (const { index, match } of matches(/`[^\W_][^`\n]+`/g, text)) {
					colour(positionAt, index, match, coloursRanges, strikeRanges);
				}

				for (const { index, match } of matches(/https:\/\/(www.)?hackmud.com\/\S*/g, text)) {
					linkRanges.push(new Range(positionAt(index), positionAt(index + match.length)));
				}

				addDecoration({ color: colourMap.P }, linkRanges);

				break;
			}
		}

		for (const [ colourID, ranges ] of coloursRanges) {
			addDecoration({ color: colourMap[colourID] }, ranges);
		}

		addDecoration({ textDecoration: "line-through", opacity: "0.3" }, strikeRanges);
		addDecoration({ color: colourMap.S }, stringRanges);
	}
}

function colour(positionAt: (offset: number) => Position, index: number, match: string, coloursRanges: Map<string, Range[]>, strikeRanges: Range[]) {
	if (!/`[^\W_](:.|.:|:)`/.exec(match)) {
		const startPos = positionAt(index);
		const innerStartPos = positionAt(index + 2);
		const innerEndPos = positionAt(index + match.length - 1);
		const endPos = positionAt(index + match.length);

		let colourRanges = coloursRanges.get(match[1]);

		if (!colourRanges) {
			colourRanges = [];
			coloursRanges.set(match[1], colourRanges);
		}

		colourRanges.push(new Range(innerStartPos, innerEndPos));
		strikeRanges.push(new Range(startPos, innerStartPos));
		strikeRanges.push(new Range(innerEndPos, endPos));
	}
}

function addDecoration(decorationRenderOptions: DecorationRenderOptions, ranges: Range[]) {
	const decoration = window.createTextEditorDecorationType(decorationRenderOptions);

	decorations.push(decoration);
	window.activeTextEditor?.setDecorations(decoration, ranges);
}

function* matches(regex: RegExp, string: string) {
	let current;

	while (current = regex.exec(string)) {
		yield { index: current.index, match: current[0] };
	}
}
