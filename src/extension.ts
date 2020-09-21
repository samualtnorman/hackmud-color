import { ExtensionContext, workspace, window, Position, Range } from 'vscode';

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

export function activate(context: ExtensionContext) {
	window.onDidChangeActiveTextEditor(colour, null, context.subscriptions);
	workspace.onDidChangeTextDocument(colour, null, context.subscriptions);

	function colour() {
		const text = window.activeTextEditor?.document.getText();

		if (text) {
			const regex = /`[a-zA-Z0-9][^`]+`/g;
			const colourRanges = new Map<string, Range[]>();
			const strikeRanges: Range[] = [];
			const lines = text.split("\n");

			let current;

			while (current = regex.exec(text)) {
				const line = text.slice(0, current.index).split("\n").length - 1;
				const startPos = new Position(line, current.index - lines.slice(0, line).join("\n").length);

				let ranges = colourRanges.get(current[0][1]);

				if (!ranges) {
					ranges = [];
					colourRanges.set(current[0][1], ranges);
				}

				ranges.push(new Range(startPos.translate(0, 2), startPos.translate(0, current[0].length - 1)));

				strikeRanges.push(new Range(startPos, startPos.translate(0, 2)));
				strikeRanges.push(new Range(startPos.translate(0, current[0].length - 1), startPos.translate(0, current[0].length)));
			}

			for (let [ key, value ] of colourRanges) {
				window.activeTextEditor?.setDecorations(window.createTextEditorDecorationType({
					color: `#${colourMap[key]}`
				}), value);
			}

			window.activeTextEditor?.setDecorations(window.createTextEditorDecorationType({
				textDecoration: "line-through",
				opacity: "0.5"
			}), strikeRanges);
		}
	}
}

export function deactivate() {}
