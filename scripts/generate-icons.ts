const outDir = 'public/icons'
await Bun.$`mkdir -p ${outDir}`

function makeSvg(size: number) {
  const center = size / 2
  const r = Math.floor(size * 0.34)
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${Math.floor(size * 0.18)}" fill="#080c14"/>
  <circle cx="${center}" cy="${center}" r="${r}" fill="none" stroke="#00ff87" stroke-width="${Math.max(8, Math.floor(size * 0.05))}"/>
  <text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" font-size="${Math.floor(size * 0.34)}">⚽</text>
</svg>`
}

await Bun.write(`${outDir}/icon-192.svg`, makeSvg(192))
await Bun.write(`${outDir}/icon-512.svg`, makeSvg(512))
await Bun.write(`${outDir}/maskable-icon.svg`, makeSvg(512))

console.log('Generated SVG icon placeholders in public/icons')
