import { inflateSync } from 'node:zlib';

// A minimal PNG reader, used by tests/contrast.spec.ts to sample the ACTUAL
// rendered pixels behind text.
//
// WHY THIS EXISTS. R-9.5 AC3 / R-5.1 AC6 require contrast over a gradient or
// photographic background to be measured "against the actual pixels behind
// each glyph". No computed style can answer that: `background-color` on a
// gradient element is `transparent`, so walking the ancestor chain finds the
// page's flat backdrop and reports a ratio for a surface that is not the one
// behind the text. The only honest measurement is to rasterise the page and
// read the pixels, which means decoding the PNG Playwright hands back.
//
// WHY NOT A LIBRARY. `sharp` is present in node_modules as a transitive
// dependency of Astro, and importing a transitive dependency is a silent
// coupling to somebody else's dependency tree. The alternative - adding it as
// a direct devDependency - buys a full image-processing toolchain, and a
// native binary that has already caused an EPERM install failure in this
// sandbox, to read four bytes per pixel. This decoder handles exactly the one
// format Playwright emits, verifies that assumption in IHDR rather than
// trusting it, and fails loudly if it is ever wrong.

export interface RawImage {
	width: number;
	height: number;
	/** RGBA, 4 bytes per pixel, row-major. */
	data: Buffer;
}

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

/**
 * Decode an 8-bit, non-interlaced, truecolour PNG - RGB (colour type 2) or
 * RGBA (colour type 6). Playwright emits both: a screenshot of a page whose
 * every pixel is opaque comes back as RGB, and one with any transparency as
 * RGBA, so a decoder that handled only RGBA failed on the very pages this is
 * used for. Output is normalised to 4 bytes per pixel either way, with an
 * opaque alpha supplied for RGB sources.
 *
 * Anything else throws by design: a silently mis-decoded image would produce
 * contrast numbers that look plausible and are wrong, which is worse than no
 * measurement at all.
 */
export function decodePng(buffer: Buffer): RawImage {
	if (!buffer.subarray(0, 8).equals(PNG_SIGNATURE)) {
		throw new Error('Not a PNG: signature mismatch');
	}

	let width = 0;
	let height = 0;
	/** Source bytes per pixel: 3 for RGB, 4 for RGBA. */
	let channels = 0;
	const idat: Buffer[] = [];

	let offset = 8;
	while (offset < buffer.length) {
		const length = buffer.readUInt32BE(offset);
		const type = buffer.toString('ascii', offset + 4, offset + 8);
		const body = buffer.subarray(offset + 8, offset + 8 + length);

		if (type === 'IHDR') {
			width = body.readUInt32BE(0);
			height = body.readUInt32BE(4);
			const bitDepth = body.readUInt8(8);
			const colourType = body.readUInt8(9);
			const interlace = body.readUInt8(12);
			if (bitDepth !== 8 || (colourType !== 2 && colourType !== 6) || interlace !== 0) {
				throw new Error(
					`Unsupported PNG: bitDepth=${bitDepth} colourType=${colourType} ` +
						`interlace=${interlace}. This decoder handles only 8-bit RGB or RGBA, ` +
						`non-interlaced, which is what Playwright screenshots produce.`,
				);
			}
			channels = colourType === 6 ? 4 : 3;
		} else if (type === 'IDAT') {
			idat.push(Buffer.from(body));
		} else if (type === 'IEND') {
			break;
		}

		offset += 12 + length; // length + type + body + CRC
	}

	if (width === 0 || height === 0 || channels === 0) throw new Error('PNG has no IHDR');

	// Filtering operates on the SOURCE layout (3 or 4 bytes per pixel); the
	// returned image is always RGBA. Unfilter in place first, then widen.
	const bytesPerPixel = channels;
	const stride = width * bytesPerPixel;
	const raw = inflateSync(Buffer.concat(idat));
	const out = Buffer.alloc(stride * height);

	// Undo the per-scanline filters (PNG spec section 9.2). Each scanline is
	// prefixed by one filter-type byte; every filter is defined in terms of
	// already-reconstructed bytes, so a single forward pass is sufficient.
	for (let y = 0; y < height; y += 1) {
		const filter = raw[y * (stride + 1)];
		const src = y * (stride + 1) + 1;
		const dst = y * stride;
		const up = dst - stride;

		for (let x = 0; x < stride; x += 1) {
			const value = raw[src + x];
			const a = x >= bytesPerPixel ? out[dst + x - bytesPerPixel] : 0;
			const b = y > 0 ? out[up + x] : 0;
			const c = y > 0 && x >= bytesPerPixel ? out[up + x - bytesPerPixel] : 0;

			let reconstructed: number;
			switch (filter) {
				case 0:
					reconstructed = value;
					break;
				case 1:
					reconstructed = value + a;
					break;
				case 2:
					reconstructed = value + b;
					break;
				case 3:
					reconstructed = value + ((a + b) >> 1);
					break;
				case 4: {
					// Paeth predictor.
					const p = a + b - c;
					const pa = Math.abs(p - a);
					const pb = Math.abs(p - b);
					const pc = Math.abs(p - c);
					const pr = pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
					reconstructed = value + pr;
					break;
				}
				default:
					throw new Error(`Unknown PNG filter type ${filter} on row ${y}`);
			}
			out[dst + x] = reconstructed & 0xff;
		}
	}

	if (channels === 4) return { width, height, data: out };

	// Widen RGB to RGBA so every caller reads a single, predictable stride.
	const rgba = Buffer.alloc(width * height * 4);
	for (let i = 0, j = 0; i < out.length; i += 3, j += 4) {
		rgba[j] = out[i];
		rgba[j + 1] = out[i + 1];
		rgba[j + 2] = out[i + 2];
		rgba[j + 3] = 255;
	}
	return { width, height, data: rgba };
}
