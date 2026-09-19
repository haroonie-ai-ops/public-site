// Intrinsic dimensions read from the bytes of an image, for criteria that
// state a pixel size (R-9.7 AC2's icon sizes, AC3's exact 1200x630 Open Graph
// raster).
//
// This reads headers only — no decoding, no dependency. The alternative is to
// trust the `sizes` attribute in the `<head>` or the `og:image:width` meta
// tag, which is what the suite did before QA-006 Finding 4.1 pointed out that
// `seo.spec.ts` asserts only that the `og:image` tag is NON-EMPTY. A tag
// claiming 1200x630 is a claim; the file's SOF/IHDR header is the fact.

export interface ImageMeta {
	format: 'png' | 'jpeg' | 'ico' | 'svg';
	width: number;
	height: number;
	/** For ICO: every (width, height) the container carries. */
	icoSizes?: { width: number; height: number }[];
}

function pngSize(b: Buffer): ImageMeta {
	// IHDR is always the first chunk, at a fixed offset after the signature.
	return { format: 'png', width: b.readUInt32BE(16), height: b.readUInt32BE(20) };
}

function jpegSize(b: Buffer): ImageMeta {
	// Walk the marker segments to the Start Of Frame, which is where the
	// dimensions live. SOF0/1/2/3, 5-7, 9-11, 13-15 all carry them; DHT
	// (0xC4), JPG (0xC8) and DAC (0xCC) share the 0xCn range and do not.
	let i = 2;
	while (i < b.length) {
		if (b[i] !== 0xff) {
			i += 1;
			continue;
		}
		const marker = b[i + 1];
		const length = b.readUInt16BE(i + 2);
		const isSof =
			marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc;
		if (isSof) {
			return { format: 'jpeg', height: b.readUInt16BE(i + 5), width: b.readUInt16BE(i + 7) };
		}
		i += 2 + length;
	}
	throw new Error('JPEG has no Start Of Frame marker');
}

function icoSizes(b: Buffer): ImageMeta {
	const count = b.readUInt16LE(4);
	const sizes: { width: number; height: number }[] = [];
	for (let n = 0; n < count; n += 1) {
		const entry = 6 + n * 16;
		// 0 in the ICO directory means 256 — the field is one byte.
		sizes.push({ width: b[entry] || 256, height: b[entry + 1] || 256 });
	}
	if (sizes.length === 0) throw new Error('ICO declares no images');
	return { format: 'ico', width: sizes[0].width, height: sizes[0].height, icoSizes: sizes };
}

/**
 * Identify an image and read its intrinsic size from its own header.
 *
 * Throws on anything it does not recognise rather than guessing: a criterion
 * that names "a raster image of exactly 1200x630" is not satisfied by a file
 * this cannot identify, and returning a plausible-looking zero would turn
 * that into a silent pass.
 */
export function imageMeta(buffer: Buffer): ImageMeta {
	if (buffer.length >= 24 && buffer.readUInt32BE(0) === 0x89504e47) return pngSize(buffer);
	if (buffer.length >= 4 && buffer[0] === 0xff && buffer[1] === 0xd8) return jpegSize(buffer);
	// ICO: reserved=0, type=1.
	if (buffer.length >= 6 && buffer.readUInt16LE(0) === 0 && buffer.readUInt16LE(2) === 1) {
		return icoSizes(buffer);
	}
	const head = buffer.subarray(0, 512).toString('utf8');
	if (/<svg[\s>]/i.test(head)) {
		// SVG has no intrinsic pixel size in the sense these criteria mean.
		// Reported as 0x0 and named `svg` so a caller asserting "raster" fails
		// on the format rather than on a dimension comparison.
		return { format: 'svg', width: 0, height: 0 };
	}
	throw new Error(
		`Unrecognised image format; first bytes: ${buffer.subarray(0, 8).toString('hex')}`,
	);
}
