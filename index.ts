import { normalize, posix } from "node:path";

const port = 5065;
const roots = [
	new URL("./src/", import.meta.url),
	new URL("./public/", import.meta.url),
];

function sanitizePath(pathname: string) {
	let decodedPathname: string;

	try {
		decodedPathname = decodeURIComponent(pathname);
	} catch {
		return null;
	}

	const requested = decodedPathname === "/" ? "/index.html" : decodedPathname;
	const normalized = normalize(requested).replace(/\\/g, "/");

	if (normalized.includes("..")) {
		return null;
	}

	return normalized.replace(/^\/+/, "");
}

async function resolveAsset(pathname: string) {
	const safePath = sanitizePath(pathname);

	if (!safePath) {
		return null;
	}

	for (const root of roots) {
		const candidate = new URL(posix.join(".", safePath), root);
		const file = Bun.file(candidate);

		if (await file.exists()) {
			return file;
		}
	}

	return null;
}

Bun.serve({
	port,
	async fetch(request) {
		if (request.method !== "GET" && request.method !== "HEAD") {
			return new Response("Method not allowed", {
				status: 405,
				headers: { Allow: "GET, HEAD" },
			});
		}

		const url = new URL(request.url);
		const file = await resolveAsset(url.pathname);

		if (!file) {
			return new Response("Not found", { status: 404 });
		}

		return new Response(file);
	},
});

console.log(`FutCard dev server running at http://localhost:${port}`);