import { ExtensionContext, workspace, window, Position, Range, TextDocumentChangeEvent, TextEditor, TextEditorDecorationType } from 'vscode';

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
} as const;

const decorations: TextEditorDecorationType[] = [];

export function activate(context: ExtensionContext) {
	console.log("activated");
	window.onDidChangeActiveTextEditor(colour, null, context.subscriptions);
	workspace.onDidChangeTextDocument(colour, null, context.subscriptions);

	function colour() {
		console.log("colouring");

		if (window.activeTextEditor) {
			for (const decoration of decorations) {
				decoration.dispose();
			}

			decorations.splice(0, decorations.length);

			const text = window.activeTextEditor.document.getText();
			const regex = /`[^\W_][^`]+`/g;
			const coloursRanges = new Map<string, Range[]>();
			const strikeRanges: Range[] = [];
			const lines = text.split("\n");

			let current;

			while (current = regex.exec(text)) {
				const { 0: string, index } = current;
				const line = text.slice(0, index).split("\n").length - 1;
				const startPos = new Position(line, index - lines.slice(0, line).join("\n").length - Number(!!line));

				let colourRanges = coloursRanges.get(string[1]);

				if (!colourRanges) {
					colourRanges = [];
					coloursRanges.set(string[1], colourRanges);
				}

				const innerStartPos = startPos.translate(0, 2);
				const innerEndPos = startPos.translate(0, string.length - 1);
				const endPos = startPos.translate(0, string.length);

				colourRanges.push(new Range(innerStartPos, innerEndPos));

				strikeRanges.push(new Range(startPos, innerStartPos));
				strikeRanges.push(new Range(innerEndPos, endPos));
			}

			for (let [ colourID, ranges ] of coloursRanges) {
				const decoration = window.createTextEditorDecorationType({
					color: `#${colourMap[colourID]}`
				});

				decorations.push(decoration);

				window.activeTextEditor.setDecorations(decoration, ranges);
			}

			const decoration = window.createTextEditorDecorationType({
				textDecoration: "line-through",
				opacity: "0.15"
			});

			decorations.push(decoration);

			window.activeTextEditor.setDecorations(decoration, strikeRanges);
		}
	}

	colour();
}

export function deactivate() {}
