export class DynamicMap<K, V> extends Map<K, V> {
	constructor(private fallbackHandler: (key: K) => V) { super() }

	override get(key: K) {
		if (super.has(key))
			return super.get(key)!

		const value = this.fallbackHandler(key)

		super.set(key, value)

		return value
	}
}

export function* matches(regex: RegExp, string: string) {
	let current

	while (current = regex.exec(string))
		yield { index: current.index, match: current[0] }
}