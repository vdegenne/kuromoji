import {mkdir, readdir, readFile, writeFile} from 'node:fs/promises'
import {join} from 'node:path'
import {promisify} from 'node:util'
import {gunzip} from 'node:zlib'

const gunzipAsync = promisify(gunzip)

const sourceDir = './node_modules/kuromoji/dict'
const targetDir = './dict'

await mkdir(targetDir, {recursive: true})

const files = await readdir(sourceDir)

for (const file of files.filter((file) => file.endsWith('.dat.gz'))) {
	const source = join(sourceDir, file)
	const target = join(targetDir, file.replace(/\.gz$/, ''))

	const compressed = await readFile(source)
	const decompressed = await gunzipAsync(compressed)

	await writeFile(target, decompressed)

	console.log(`Decompressed ${file}`)
}
