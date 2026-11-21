// Local rule-based matcher. Replace findMatches() with an API call to plug in a real AI model.
const words = s => new Set(s.toLowerCase().match(/[a-z]{3,}/g) || [])
const jac = (a, b) => { const A = words(a), B = words(b); const i = [...A].filter(x => B.has(x)).length; return i / (A.size + B.size - i || 1) }
export function findMatches(item, all) {
  return all.filter(o => o.type !== item.type && o.status === 'open').map(o => {
    const n = jac(item.name, o.name), ds = jac(item.description, o.description)
    const cat = item.category === o.category ? 1 : 0
    const days = Math.abs(new Date(item.date) - new Date(o.date)) / 864e5, dt = Math.max(0, 1 - days / 14)
    const loc = item.location.trim().toLowerCase() === o.location.trim().toLowerCase() ? 1 : 0
    const score = Math.round((n * 0.25 + ds * 0.25 + cat * 0.2 + dt * 0.15 + loc * 0.15) * 100)
    const why = [cat && 'same category', loc && 'same location', n > 0 && 'similar name', ds > 0.1 && 'shared description keywords', dt > 0.6 && 'close dates'].filter(Boolean)
    return { item:o, score, why:why.join(', ') || 'weak similarity' } }).filter(m => m.score >= 25).sort((a, b) => b.score - a.score)
}
