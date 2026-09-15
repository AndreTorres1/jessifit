import { describe, it, expect } from 'vitest'
import { parseTcx, parseGpx } from './activityFile'

describe('parseTcx', () => {
  const tcx = `<?xml version="1.0"?>
  <TrainingCenterDatabase>
    <Activities><Activity Sport="Running">
      <Id>2026-09-07T09:00:00Z</Id>
      <Lap><TotalTimeSeconds>2548.0</TotalTimeSeconds>
        <Track>
          <Trackpoint><Time>2026-09-07T09:00:00Z</Time><DistanceMeters>0.0</DistanceMeters></Trackpoint>
          <Trackpoint><Time>2026-09-07T09:42:28Z</Time><DistanceMeters>10000.0</DistanceMeters></Trackpoint>
        </Track>
      </Lap>
    </Activity></Activities>
  </TrainingCenterDatabase>`

  it('lê distância e tempo', () => {
    const r = parseTcx(tcx)
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.distanceKm).toBe(10)
      expect(r.seconds).toBe(2548)
      expect(r.date).toBe('2026-09-07T09:00:00.000Z')
    }
  })

  it('cai para o intervalo de tempos se não houver TotalTimeSeconds', () => {
    const noTotal = tcx.replace(/<TotalTimeSeconds>[^<]*<\/TotalTimeSeconds>/, '')
    const r = parseTcx(noTotal)
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.seconds).toBe(2548)
  })
})

describe('parseGpx', () => {
  const gpx = `<?xml version="1.0"?>
  <gpx><trk><trkseg>
    <trkpt lat="38.7000" lon="-9.1400"><time>2026-09-07T09:00:00Z</time></trkpt>
    <trkpt lat="38.7100" lon="-9.1400"><time>2026-09-07T09:20:00Z</time></trkpt>
    <trkpt lat="38.7200" lon="-9.1400"><time>2026-09-07T09:42:28Z</time></trkpt>
  </trkseg></trk></gpx>`

  it('calcula distância e tempo', () => {
    const r = parseGpx(gpx)
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.seconds).toBe(2548)
      // ~2.2 km entre os pontos (0.02° de latitude ≈ 2.22 km)
      expect(r.distanceKm).toBeGreaterThan(2)
      expect(r.distanceKm).toBeLessThan(2.5)
    }
  })
})
