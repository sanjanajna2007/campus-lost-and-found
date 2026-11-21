import React, { createContext, useContext, useEffect, useState } from 'react'
export const CATS = ['Electronics','Books','Keys','Wallet/ID','Clothing','Bags','Other']
const d = n => new Date(Date.now() - n * 864e5).toISOString().slice(0, 10)
const SEED = {
 users: [{ id:'u1', name:'Demo User', email:'user@demo.com', password:'user123', role:'user' },
         { id:'u2', name:'Demo Admin', email:'admin@demo.com', password:'admin123', role:'admin' }],
 items: [
  { id:'i1', type:'lost', name:'Black Laptop Bag', category:'Bags', description:'Black backpack with a Dell laptop and charger', date:d(2), location:'Library', owner:'u1', status:'open' },
  { id:'i2', type:'found', name:'Backpack (black)', category:'Bags', description:'Black backpack found near the reading hall, laptop charger inside', date:d(1), location:'Library', owner:'u2', status:'open' },
  { id:'i3', type:'found', name:'Hostel Room Keys', category:'Keys', description:'Three keys on a blue keychain', date:d(4), location:'Canteen', owner:'u2', status:'open' },
  { id:'i4', type:'lost', name:'Student ID Card', category:'Wallet/ID', description:'ID card in a brown leather holder', date:d(3), location:'Sports Ground', owner:'u1', status:'open' } ],
 claims: [], notes: [] }
const Ctx = createContext(null)
export const useStore = () => useContext(Ctx)
const KEY = 'findit-demo-v1'
export function StoreProvider({ children }) {
  const [db, setDb] = useState(() => { try { return JSON.parse(localStorage.getItem(KEY)) || SEED } catch { return SEED } })
  const [me, setMe] = useState(() => { try { return JSON.parse(localStorage.getItem(KEY + '-me')) } catch { return null } })
  const [toast, setToast] = useState('')
  useEffect(() => { localStorage.setItem(KEY, JSON.stringify(db)) }, [db])
  useEffect(() => { localStorage.setItem(KEY + '-me', JSON.stringify(me)) }, [me])
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(''), 2500); return () => clearTimeout(t) }, [toast])
  const id = () => Math.random().toString(36).slice(2, 9)
  const notify = (user, text) => ({ id:id(), user, text, read:false, at:Date.now() })
  const api = {
    db, me, toast, flash: setToast,
    login(email, password) { const u = db.users.find(x => x.email === email && x.password === password); if (u) setMe(u); return !!u },
    register(name, email, password) {
      if (db.users.some(x => x.email === email)) return false
      const u = { id:id(), name, email, password, role:'user' }; setDb(p => ({ ...p, users:[...p.users, u] })); setMe(u); return true },
    logout() { setMe(null) },
    addItem(it) {
      console.log("ADD ITEM CALLED:", it);
      console.log("CURRENT USER:", me); 
      const n = { ...it, id:id(), owner:me.id, status:'open' }; setDb(p => ({ ...p, items:[n, ...p.items] })); return n.id },
    
    submitClaim(itemId, message) {
      const it = db.items.find(x => x.id === itemId)
      setDb(p => ({ ...p, claims:[{ id:id(), itemId, by:me.id, message, status:'pending', at:Date.now() }, ...p.claims],
        notes:[notify(it.owner, `New claim on "${it.name}"`), ...p.notes] })) },
    decideClaim(cid, status) {
      const c = db.claims.find(x => x.id === cid)
      setDb(p => ({ ...p, claims:p.claims.map(x => x.id === cid ? { ...x, status } : x),
        items:p.items.map(x => x.id === c.itemId && status === 'approved' ? { ...x, status:'resolved' } : x),
        notes:[notify(c.by, `Your claim was ${status}`), ...p.notes] })) },
    markRead() { setDb(p => ({ ...p, notes:p.notes.map(n => n.user === me?.id ? { ...n, read:true } : n) })) },
    resetDemo() { setDb(SEED); setToast('Demo data reset') } }
  return <Ctx.Provider value={api}>{children}</Ctx.Provider>
}
