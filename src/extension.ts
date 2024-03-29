import { DynamicMap } from "@samual/lib/DynamicMap"
import { createSourceFile, ScriptTarget, type Node, SyntaxKind } from "typescript"
import { commands, window, workspace, type DecorationRenderOptions, Range, type TextEditorDecorationType } from "vscode"

const gameColourCodesToHex = {
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
} satisfies Record<string, string>

type GameColourCode = `${keyof typeof gameColourCodesToHex}`

const forumColourCodesToHex = {
	...gameColourCodesToHex,
	6: "#7AB2F4",
	7: "#7AB2F4",
	8: "#7AB2F4",
	9: "#7AB2F4"
} satisfies Record<GameColourCode, string>

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
]

const decorations: TextEditorDecorationType[] = []

let config = workspace.getConfiguration("hackmud-color")

export function activate() {
	window.onDidChangeActiveTextEditor(decorate)
	workspace.onDidChangeTextDocument(decorate)
	workspace.onDidCloseTextDocument(decorate)
	workspace.onDidOpenTextDocument(decorate)

	workspace.onDidChangeConfiguration(() => {
		config = workspace.getConfiguration("hackmud-color")
		decorate()
	})

	commands.registerCommand("hackmud-color.toggle", () =>
		config.update("enabled", !config.get("enabled", true))
	)

	commands.registerCommand("hackmud-color.global-toggle", () =>
		config.update("enabled", !config.get("enabled", true), true)
	)

	decorate()
}

export function deactivate() {}

function decorate() {
	for (const decoration of decorations.splice(0))
		decoration.dispose()

	if (!window.activeTextEditor || !config.get("enabled"))
		return

	const { positionAt, languageId } = window.activeTextEditor.document
	const text = window.activeTextEditor.document.getText()
	const coloursRanges = new DynamicMap<GameColourCode, Range[]>(() => [])
	const stringRanges: Range[] = []
	const strikeRanges: Range[] = []

	switch (languageId) {
		case "javascript":
		case "typescript": {
			const scriptOrangeRanges: Range[] = []
			const scriptGreyRanges: Range[] = []
			const scriptGreenRanges: Range[] = []
			const keyRanges: Range[] = []
			const valueRanges: Range[] = []

			createSourceFile("index.ts", text, ScriptTarget.ESNext, true).forEachChild(traverse)

			addDecoration({ color: gameColourCodesToHex.F }, scriptOrangeRanges)
			addDecoration({ color: gameColourCodesToHex.C }, scriptGreyRanges)
			addDecoration({ color: gameColourCodesToHex.L }, scriptGreenRanges)
			addDecoration({ color: gameColourCodesToHex.N }, keyRanges)
			addDecoration({ color: gameColourCodesToHex.V }, valueRanges)

			for (const [ colourID, ranges ] of coloursRanges)
				addDecoration({ color: gameColourCodesToHex[colourID] }, ranges)

			function traverse(node: Node) {
				let stringMatch

				if (node.kind == SyntaxKind.TemplateHead || node.kind == SyntaxKind.TemplateMiddle)
					stringMatch = node.getText().slice(1, -2)
					// processString(stringRanges, positionAt, node.getStart() + 1, node.getText().slice(1, -2), coloursRanges, strikeRanges, scriptOrangeRanges, scriptGreyRanges, scriptGreenRanges, keyRanges, valueRanges)
				else if (node.kind == SyntaxKind.StringLiteral || node.kind == SyntaxKind.TemplateTail || node.kind == SyntaxKind.FirstTemplateToken)
					stringMatch = node.getText().slice(1, -1)
					// processString(stringRanges, positionAt, node.getStart() + 1, node.getText().slice(1, -1), coloursRanges, strikeRanges, scriptOrangeRanges, scriptGreyRanges, scriptGreenRanges, keyRanges, valueRanges)
				else {
					node.forEachChild(traverse)
					return
				}

				const stringIndex = node.getStart() + 1

				// TODO custom nested colour mode (I'll basically just pull in my string processor but replace setColour function) (backburner)
				// TODO colour sectors
				// BUG inaccuracies with key value pair colouring

				stringRanges.push(new Range(positionAt(stringIndex), positionAt(stringIndex + stringMatch.length)))

				for (const { index, match } of matches(/`[^\W_]((?!`|\\n).)+`/g, stringMatch))
					colour(stringIndex + index, match)

				for (const { index, match } of matches(/\\./g, stringMatch)) {
					const offset = stringIndex + index

					if (match[1] === "n" || match[1] === "t")
						strikeRanges.push(new Range(positionAt(offset), positionAt(offset + 2)))
					else
						strikeRanges.push(new Range(positionAt(offset), positionAt(offset + 1)))
				}

				// Thank you @Dart#0719 and @Aniketos#3964 for help with regex
				for (let { index, match } of
					matches(/(?<!#[^s]?.*)(?:#s\.)?([a-z_][a-z0-9_]*\.[a-z_][a-z0-9_]*)/g, stringMatch)
				) {
					if (match[0] === "#") {
						index += 3
						match = match.slice(3)
					}

					const offset = stringIndex + index

					const user = match.split(".")[0]!;

					(trustUsers.includes(user) ? scriptOrangeRanges : scriptGreyRanges)
						.push(new Range(positionAt(offset), positionAt(offset + user.length)))

					scriptGreenRanges
						.push(new Range(positionAt(offset + user.length + 1), positionAt(offset + match.length)))
				}

				for (const { index, match } of matches(/([a-zA-Z_]\w*|"[^"]+?") ?: ?(\\?".*?"|[0-9]+|true|false|{|\[)/g, stringMatch)) {
					const offset = stringIndex + index
					const startPos = positionAt(offset)

					let colon

					if (match[0] === '"') {
						const keyEnd = match.indexOf('"', 1)

						colon = match.indexOf(":", keyEnd)

						if (/^[a-zA-Z_]\w*\\?$/.exec(match.slice(1, keyEnd))) {
							const keyStartPos = positionAt(offset + 1)
							const keyEndPos = positionAt(offset + keyEnd)

							keyRanges.push(new Range(keyStartPos, keyEndPos))
							strikeRanges.push(new Range(startPos, keyStartPos))
							strikeRanges.push(new Range(keyEndPos, positionAt(offset + keyEnd + 1)))
						} else
							keyRanges.push(new Range(startPos, positionAt(offset + keyEnd + 1)))
					} else {
						colon = match.indexOf(":")
						keyRanges.push(new Range(startPos, positionAt(offset + match.search(/ |:/))))
					}

					valueRanges.push(new Range(positionAt(offset + colon + 1 + match.slice(colon + 1).search(/[^ ]/)), positionAt(offset + match.length)))
				}

				for (const { index } of matches(/\\\\"/gs, stringMatch)) {
					const offset = stringIndex + index

					strikeRanges.push(new Range(positionAt(offset), positionAt(offset + 2)))
				}

				for (const { index, match } of matches(/@[a-z_][a-z_0-9]{0,24}(?![a-z_0-9])/gs, stringMatch)) {
					coloursRanges.get("C").push(new Range(positionAt(stringIndex + index), positionAt(stringIndex + index + 1)))

					let hash = 0

					for (const [ _, char ] of [ ...match.slice(1) ].entries())
						hash += (hash >> 1) + hash + "xi1_8ratvsw9hlbgm02y5zpdcn7uekof463qj".indexOf(char) + 1

					coloursRanges.get("JKMWLB"[hash % 6] as GameColourCode).push(new Range(
						positionAt(stringIndex + index + 1),
						positionAt(stringIndex + index + match.length)
					))
				}

				for (const { index, match } of matches(/DATA_(?:ALPHA|BETA|GAMMA|DELTA|ZETA|THETA|LAMBDA|EPSILON)_\d/gs, stringMatch))
					coloursRanges.get("q").push(new Range(positionAt(stringIndex + index), positionAt(stringIndex + index + match.length)))

				for (const { index, match } of matches(/KIN_(?:ALPHA|BETA|GAMMA|DELTA|ZETA|THETA|LAMBDA|EPSILON)_\d/gs, stringMatch))
					coloursRanges.get("N").push(new Range(positionAt(stringIndex + index), positionAt(stringIndex + index + match.length)))

				for (const { index, match } of matches(/FORM_(?:ALPHA|BETA|GAMMA|DELTA|ZETA|THETA|LAMBDA|EPSILON)_\d/gs, stringMatch))
					coloursRanges.get("l").push(new Range(positionAt(stringIndex + index), positionAt(stringIndex + index + match.length)))

				for (const { index, match } of matches(/VOID_(?:ALPHA|BETA|GAMMA|DELTA|ZETA|THETA|LAMBDA|EPSILON)_\d/gs, stringMatch))
					coloursRanges.get("I").push(new Range(positionAt(stringIndex + index), positionAt(stringIndex + index + match.length)))

				for (const { index, match } of matches(/CHAOS_(?:ALPHA|BETA|GAMMA|DELTA|ZETA|THETA|LAMBDA|EPSILON)_\d/gs, stringMatch))
					coloursRanges.get("D").push(new Range(positionAt(stringIndex + index), positionAt(stringIndex + index + match.length)))

				for (const { index, match } of matches(/CHOICE_(?:ALPHA|BETA|GAMMA|DELTA|ZETA|THETA|LAMBDA|EPSILON)_\d/gs, stringMatch))
					coloursRanges.get("F").push(new Range(positionAt(stringIndex + index), positionAt(stringIndex + index + match.length)))

				for (const { index, match } of matches(/(?:HJG|VNP|NGC|K|SPC)_\d\d\d\d/gs, stringMatch))
					coloursRanges.get("C").push(new Range(positionAt(stringIndex + index), positionAt(stringIndex + index + match.length)))
			}
		} break

		case "plaintext": {
			const linkRanges: Range[] = []

			stringRanges.push(new Range(positionAt(0), positionAt(text.length)))

			for (const { index, match } of matches(/`[^\W_][^`\n]+`/g, text))
				colour(index, match)

			for (const { index, match } of matches(/https:\/\/(www\.)?hackmud.com\/\S*/g, text))
				linkRanges.push(new Range(positionAt(index), positionAt(index + match.length)))

			addDecoration({ color: gameColourCodesToHex.P }, linkRanges)

			for (const [ colourID, ranges ] of coloursRanges)
				addDecoration({ color: forumColourCodesToHex[colourID] }, ranges)
		} break
	}

	addDecoration({ textDecoration: "line-through", opacity: "0.3" }, strikeRanges)
	addDecoration({ color: gameColourCodesToHex.S }, stringRanges)

	function colour(index: number, match: string) {
		if (!/`[^\W_](:.|.:|:)`/.exec(match)) {
			const startPos = positionAt(index)
			const innerStartPos = positionAt(index + 2)
			const innerEndPos = positionAt(index + match.length - 1)
			const endPos = positionAt(index + match.length)

			coloursRanges.get(match[1] as GameColourCode).push(new Range(innerStartPos, innerEndPos))
			strikeRanges.push(new Range(startPos, innerStartPos))
			strikeRanges.push(new Range(innerEndPos, endPos))
		}
	}
}

function addDecoration(decorationRenderOptions: DecorationRenderOptions, ranges: Range[]) {
	const decoration = window.createTextEditorDecorationType(decorationRenderOptions)

	decorations.push(decoration)
	window.activeTextEditor?.setDecorations(decoration, ranges)
}

function* matches(regex: RegExp, string: string) {
	let current

	while (current = regex.exec(string))
		yield { index: current.index, match: current[0] }
}
