import { workspace, window, Range, TextEditorDecorationType, commands, Position } from 'vscode';

const colourMap: Record<string, string> = {
	0: "CACACA",
	1: "FFFFFF",
	2: "1EFF00",
	3: "0070DD",
	4: "B035EE",
	5: "FF8000",
	6: "FF8000",
	7: "FF8000",
	8: "FF8000",
	9: "FF8000",
	a: "000000",
	b: "3F3F3F",
	c: "676767",
	d: "7D0000",
	e: "8E3434",
	f: "A34F00",
	g: "725437",
	h: "A88600",
	i: "B2934A",
	j: "939500",
	k: "495225",
	l: "299400",
	m: "23381B",
	n: "00535B",
	o: "324A4C",
	p: "0073A6",
	q: "385A6C",
	r: "010067",
	s: "507AA1",
	t: "601C81",
	u: "43314C",
	v: "8C0069",
	w: "973984",
	x: "880024",
	y: "762E4A",
	z: "101215",
	A: "FFFFFF",
	B: "CACACA",
	C: "9B9B9B",
	D: "FF0000",
	E: "FF8383",
	F: "FF8000",
	G: "F3AA6F",
	H: "FBC803",
	I: "FFD863",
	J: "FFF404",
	K: "F3F998",
	L: "1EFF00",
	M: "B3FF9B",
	N: "00FFFF",
	O: "8FE6FF",
	P: "0070DD",
	Q: "A4E3FF",
	R: "0000FF",
	S: "7AB2F4",
	T: "B035EE",
	U: "E6C4FF",
	V: "FF00EC",
	W: "FF96E0",
	X: "FF0070",
	Y: "FF6A98",
	Z: "0C112B"
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

export function activate() {
	window.onDidChangeActiveTextEditor(decorate);
	workspace.onDidChangeTextDocument(decorate);
	workspace.onDidChangeConfiguration(decorate);

	commands.registerCommand("hackmud-color.enable", () => {
		console.log("test");
		workspace.getConfiguration("hackmud-color").update("enabled", true);
		// colour();
	});

	commands.registerCommand("hackmud-color.disable", () => {
		workspace.getConfiguration("hackmud-color").update("enabled", false);
		// colour();
	});

	decorate();
}

export function deactivate() {}

function decorate() {
	for (const decoration of decorations.splice(0)) {
		decoration.dispose();
	}

	if (workspace.getConfiguration("hackmud-color").get("enabled") && window.activeTextEditor) {
		const { positionAt, languageId } = window.activeTextEditor.document;
		const text = window.activeTextEditor.document.getText();
		const coloursRanges = new Map<string, Range[]>();
		const stringRanges: Range[] = [];
		const strikeRanges: Range[] = [];

		switch (languageId) {
			case "javascript":
			case "typescript":
				for (const { index: stringIndex, match: stringMatch } of matches(/""|''|".*?[^\\]"|'.*?[^\\]'/gs, text)) {
					if (stringMatch.length > 2) {
						stringRanges.push(new Range(positionAt(stringIndex + 1), positionAt(stringIndex + stringMatch.length - 1)));

						for (const { index, match } of matches(/`[^\W_]((?!`|\\n).)+`/g, stringMatch)) {
							colour(positionAt, stringIndex + index, match, coloursRanges, strikeRanges);
						}

						for (const { index, match } of matches(/\\n|\\t/g, stringMatch)) {
							const offset = stringIndex + index;
							strikeRanges.push(new Range(positionAt(offset), positionAt(offset + match.length)));
						}

						for (const { index, match } of matches(/[a-z]\w*\.\w+/g, stringMatch)) {
							const offset = stringIndex + index;
							const [ user, script ] = match.split(".");

							if (trustUsers.includes(user)) {
								let colourRanges = coloursRanges.get("F");

								if (!colourRanges) {
									colourRanges = [];
									coloursRanges.set("F", colourRanges);
								}

								colourRanges.push(new Range(positionAt(offset), positionAt(offset + user.length)));
							} else {
								let colourRanges = coloursRanges.get("C");

								if (!colourRanges) {
									colourRanges = [];
									coloursRanges.set("C", colourRanges);
								}

								colourRanges.push(new Range(positionAt(offset), positionAt(offset + user.length)));
							}

							{
								let colourRanges = coloursRanges.get("L");

								if (!colourRanges) {
									colourRanges = [];
									coloursRanges.set("L", colourRanges);
								}

								colourRanges.push(new Range(positionAt(offset + user.length + 1), positionAt(offset + match.length)));
							}
						}
					}
				}

				break;
			case "plaintext":
				stringRanges.push(new Range(positionAt(0), positionAt(text.length)));

				for (const { index, match } of matches(/`[^\W_][^`\n]+`/g, text)) {
					colour(positionAt, index, match, coloursRanges, strikeRanges);
				}

				break;
		}

		for (const [ colourID, ranges ] of coloursRanges) {
			const decoration = window.createTextEditorDecorationType({
				color: `#${colourMap[colourID]}`
			});

			decorations.push(decoration);

			window.activeTextEditor.setDecorations(decoration, ranges);
		}

		{
			const decoration = window.createTextEditorDecorationType({
				textDecoration: "line-through",
				opacity: "0.3"
			});

			decorations.push(decoration);

			window.activeTextEditor.setDecorations(decoration, strikeRanges);
		}

		{
			const decoration = window.createTextEditorDecorationType({
				color: "#7AB2F4"
			});

			decorations.push(decoration);

			window.activeTextEditor.setDecorations(decoration, stringRanges);
		}
	}
}

function colour(positionAt: (offset: number) => Position, index: number, match: string, coloursRanges: Map<string, Range[]>, strikeRanges: Range[]) {
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

function* matches(regex: RegExp, string: string) {
	let current;

	while (current = regex.exec(string)) {
		yield { index: current.index, match: current[0] };
	}
}
