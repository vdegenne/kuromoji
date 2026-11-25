import * as kuromoji from '@vdegenne/kuromoji-core'

type Tokenizer = kuromoji.Tokenizer<kuromoji.IpadicFeatures>

export type KuromojiProgress = kuromoji.DictionaryProgress

/**
 * Options for configuring a Kuromoji instance.
 */
export interface KuromojiOptions extends kuromoji.TokenizerBuilderOption {
	/**
	 * Path to the directory containing dictionary files.
	 * @default './dict/'
	 */
	dicPath?: string

	/**
	 * Dictionary file format.
	 * @default 'dat'
	 */
	dictFileFormat?: 'dat' | 'gz'

	/**
	 * Whether to load the dictionary immediately when the instance is created.
	 * @default false
	 */
	preload?: boolean

	/**
	 * Callback invoked when dictionary loading progress is updated.
	 */
	onProgress?: (progress: KuromojiProgress) => void
}

export class Kuromoji {
	private tokenizerPromise?: Promise<Tokenizer>
	private readingCache = new Map<string, Promise<string>>()

	readonly ready: Promise<void>

	constructor(options: KuromojiOptions = {}) {
		this.options = {
			dicPath: `./dict/`,
			dictFileFormat: 'dat',
			preload: false,
			...options,
		}

		this.ready = this.options.preload
			? this.loadTokenizer().then(() => undefined)
			: Promise.resolve()
	}

	private readonly options: Required<Omit<KuromojiOptions, 'onProgress'>> &
		Pick<KuromojiOptions, 'onProgress'>

	private loadTokenizer(): Promise<Tokenizer> {
		if (!this.tokenizerPromise) {
			this.tokenizerPromise = new Promise<Tokenizer>((resolve, reject) => {
				kuromoji
					.builder({
						dicPath: this.options.dicPath,
						dictFileFormat: this.options.dictFileFormat,
						onProgress: this.options.onProgress,
					})
					.build((error, tokenizer) => {
						if (error) {
							reject(error)
							return
						}

						resolve(tokenizer)
					})
			}).catch((error: unknown) => {
				this.tokenizerPromise = undefined
				throw error
			})
		}

		return this.tokenizerPromise
	}

	private katakanaToHiragana(text: string): string {
		return text.replace(/[ァ-ヶ]/g, (character) =>
			String.fromCharCode(character.charCodeAt(0) - 0x60),
		)
	}

	private async analyze(text: string): Promise<string> {
		if (!/\p{Script=Han}/u.test(text)) {
			return this.katakanaToHiragana(text)
		}

		const tokenizer = await this.loadTokenizer()
		const tokens = tokenizer.tokenize(text)

		let result = ''
		let cursor = 0

		for (const token of tokens) {
			const start = token.word_position - 1

			if (start > cursor) {
				result += text.slice(cursor, start)
			}

			const reading =
				token.reading && token.reading !== '*'
					? token.reading
					: token.surface_form

			result += this.katakanaToHiragana(reading)
			cursor = start + token.surface_form.length
		}

		result += text.slice(cursor)

		return result
	}

	toHiragana(text: string): Promise<string> {
		if (!text) {
			return Promise.resolve(text)
		}

		const cached = this.readingCache.get(text)

		if (cached) {
			return cached
		}

		const promise = this.analyze(text).catch((error: unknown) => {
			this.readingCache.delete(text)
			throw error
		})

		this.readingCache.set(text, promise)

		return promise
	}
}
