/**
 * Lê um ficheiro de atividade exportado do Garmin (ou Strava) e extrai a
 * distância e o tempo total. Suporta:
 *  - .fit  (formato original do Garmin, binário)
 *  - .tcx  (XML — Garmin Training Center)
 *  - .gpx  (XML — track de GPS)
 */

export type ParsedActivity =
  | { ok: true; distanceKm: number; seconds: number; date?: string }
  | { ok: false; error: string }

const R = 6371000 // raio da Terra (m)

function haversine(aLat: number, aLon: number, bLat: number, bLon: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(bLat - aLat)
  const dLon = toRad(bLon - aLon)
  const la1 = toRad(aLat)
  const la2 = toRad(bLat)
  const h =
    Math.sin(dLat / 2) ** 2 + Math.sin(dLon / 2) ** 2 * Math.cos(la1) * Math.cos(la2)
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)))
}

/** Extrai distância (m) e tempo (s) de um TCX. */
export function parseTcx(xml: string): ParsedActivity {
  const distances = [...xml.matchAll(/<DistanceMeters>\s*([\d.]+)\s*<\/DistanceMeters>/gi)]
    .map((m) => Number(m[1]))
    .filter((n) => !Number.isNaN(n))
  const times = [...xml.matchAll(/<TotalTimeSeconds>\s*([\d.]+)\s*<\/TotalTimeSeconds>/gi)]
    .map((m) => Number(m[1]))
    .filter((n) => !Number.isNaN(n))

  const distanceMeters = distances.length ? Math.max(...distances) : 0
  let seconds = times.reduce((a, b) => a + b, 0)

  const stamps = [...xml.matchAll(/<Time>\s*([^<]+?)\s*<\/Time>/gi)].map((m) => m[1])
  if (!seconds && stamps.length >= 2) {
    seconds = (Date.parse(stamps[stamps.length - 1]) - Date.parse(stamps[0])) / 1000
  }
  const date = stamps[0] ? new Date(stamps[0]).toISOString() : undefined

  if (!distanceMeters || !seconds || seconds < 0) {
    return { ok: false, error: 'Não consegui ler distância/tempo do TCX.' }
  }
  return { ok: true, distanceKm: distanceMeters / 1000, seconds: Math.round(seconds), date }
}

/** Extrai distância (haversine) e tempo (span) de um GPX. */
export function parseGpx(xml: string): ParsedActivity {
  const pts = [...xml.matchAll(/<trkpt[^>]*lat="([-\d.]+)"[^>]*lon="([-\d.]+)"[^>]*>/gi)].map(
    (m) => ({ lat: Number(m[1]), lon: Number(m[2]) }),
  )
  const stamps = [...xml.matchAll(/<time>\s*([^<]+?)\s*<\/time>/gi)].map((m) => m[1])

  if (pts.length < 2) return { ok: false, error: 'GPX sem pontos de percurso.' }
  let meters = 0
  for (let i = 1; i < pts.length; i++) {
    meters += haversine(pts[i - 1].lat, pts[i - 1].lon, pts[i].lat, pts[i].lon)
  }
  // primeiro <time> costuma ser o do trkpt inicial (ou metadata); usa o intervalo
  const timeStamps = stamps.filter(Boolean)
  let seconds = 0
  if (timeStamps.length >= 2) {
    seconds = (Date.parse(timeStamps[timeStamps.length - 1]) - Date.parse(timeStamps[0])) / 1000
  }
  const date = timeStamps[0] ? new Date(timeStamps[0]).toISOString() : undefined
  if (!seconds || seconds < 0) {
    return { ok: false, error: 'GPX sem tempos — usa TCX/FIT ou mete o tempo à mão.' }
  }
  return { ok: true, distanceKm: meters / 1000, seconds: Math.round(seconds), date }
}

/** Lê um .fit (binário) com o fit-file-parser (importado só quando é preciso). */
async function parseFit(buffer: ArrayBuffer): Promise<ParsedActivity> {
  const mod = await import('fit-file-parser')
  const FitParser = (mod as { default: new (o: unknown) => unknown }).default
  const parser = new FitParser({
    force: true,
    mode: 'list',
    lengthUnit: 'm',
    speedUnit: 'km/h',
  }) as { parse: (b: ArrayBuffer, cb: (err: unknown, data: unknown) => void) => void }

  return new Promise((resolve) => {
    parser.parse(buffer, (err, data) => {
      if (err) return resolve({ ok: false, error: 'Não consegui ler o ficheiro .FIT.' })
      const d = data as {
        sessions?: { total_distance?: number; total_elapsed_time?: number; total_timer_time?: number; start_time?: string | Date }[]
        records?: { distance?: number; timestamp?: string | Date }[]
      }
      const s = d.sessions?.[0]
      let distanceMeters = s?.total_distance ?? 0
      let seconds = s?.total_elapsed_time ?? s?.total_timer_time ?? 0
      let start = s?.start_time
      if ((!distanceMeters || !seconds) && d.records?.length) {
        const recs = d.records
        const last = recs[recs.length - 1]
        distanceMeters = distanceMeters || last?.distance || 0
        if (!seconds && recs[0]?.timestamp && last?.timestamp) {
          seconds = (Date.parse(String(last.timestamp)) - Date.parse(String(recs[0].timestamp))) / 1000
        }
        start = start || recs[0]?.timestamp
      }
      if (!distanceMeters || !seconds || seconds < 0) {
        return resolve({ ok: false, error: 'Ficheiro .FIT sem distância/tempo.' })
      }
      resolve({
        ok: true,
        distanceKm: distanceMeters / 1000,
        seconds: Math.round(seconds),
        date: start ? new Date(start).toISOString() : undefined,
      })
    })
  })
}

/** Lê e interpreta um ficheiro de atividade pelo tipo (extensão). */
export async function parseActivityFile(file: File): Promise<ParsedActivity> {
  const name = file.name.toLowerCase()
  try {
    if (name.endsWith('.fit')) {
      return await parseFit(await file.arrayBuffer())
    }
    const text = await file.text()
    if (name.endsWith('.tcx') || /<TrainingCenterDatabase/i.test(text)) return parseTcx(text)
    if (name.endsWith('.gpx') || /<gpx/i.test(text)) return parseGpx(text)
    return { ok: false, error: 'Formato não reconhecido. Usa .fit, .tcx ou .gpx.' }
  } catch {
    return { ok: false, error: 'Não consegui abrir o ficheiro.' }
  }
}
