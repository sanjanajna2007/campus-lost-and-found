import React, { useState } from 'react'
import { Routes, Route, Link, NavLink, Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Search, MapPin, Bell, MessageCircle, X, PackageSearch } from 'lucide-react'
import { useStore, CATS } from './store.jsx'
import { findMatches } from './matching.js'
import { reply } from './chat.js'

const Badge = ({ t }) => <span className={`rounded-full px-2 py-0.5 text-xs ${t === 'lost' ? 'bg-red-500/20 text-red-300' : 'bg-acc/20 text-acc'}`}>{t}</span>
const Empty = ({ text }) => <div className="card text-center text-mute py-10">{text}</div>

function Nav() {
  const { me, logout, db } = useStore(); const nav = useNavigate()
  const unread = me ? db.notes.filter(n => n.user === me.id && !n.read).length : 0
  const L = ({ to, children }) => <NavLink to={to} className={({ isActive }) => `px-2 py-1 rounded ${isActive ? 'text-acc' : 'text-mute hover:text-white'}`}>{children}</NavLink>
  return <header className="sticky top-0 z-20 bg-bg/90 backdrop-blur border-b border-white/5"><div className="mx-auto max-w-6xl flex flex-wrap items-center gap-2 p-3">
    <Link to="/" className="flex items-center gap-2 font-bold text-lg"><PackageSearch className="text-acc"/>FindIt</Link>
    <nav className="flex flex-wrap gap-1 ml-4 text-sm"><L to="/browse">Browse</L><L to="/report/lost">Report lost</L><L to="/report/found">Report found</L>
      {me && <L to="/dashboard">Dashboard{unread > 0 && <span className="ml-1 text-acc">({unread})</span>}</L>}{me?.role === 'admin' && <L to="/admin">Admin</L>}</nav>
    <div className="ml-auto flex gap-2">{me ? <button className="btn2" onClick={() => { logout(); nav('/') }}>Log out</button> : <><Link className="btn2" to="/login">Log in</Link><Link className="btn" to="/register">Sign up</Link></>}</div></div></header>
}
function ItemCard({ it }) {
  return <Link to={`/item/${it.id}`} className="card block hover:border-acc/40 transition"><div className="flex justify-between"><h3 className="font-semibold">{it.name}</h3><Badge t={it.type}/></div>
    <p className="text-sm text-mute mt-1 line-clamp-2">{it.description}</p><p className="mt-2 text-xs text-mute flex items-center gap-1"><MapPin size={12}/>{it.location} · {it.date} · {it.category}{it.status === 'resolved' && ' · resolved'}</p></Link>
}
function Home() {
  const { db } = useStore(); const nav = useNavigate(); const [q, setQ] = useState('')
  const stats = [['Reports', db.items.length], ['Open', db.items.filter(i => i.status === 'open').length], ['Reunited', db.items.filter(i => i.status === 'resolved').length]]
  return <div className="mx-auto max-w-6xl p-4 space-y-10">
    <section className="py-12"><h1 className="text-4xl md:text-6xl font-bold max-w-2xl">Lost something on campus? Let's get it back to you.</h1>
      <form className="mt-6 flex gap-2 max-w-xl" onSubmit={e => { e.preventDefault(); nav(`/browse?q=${encodeURIComponent(q)}`) }}>
        <input className="inp" placeholder="Search by item name or description" value={q} onChange={e => setQ(e.target.value)}/><button className="btn"><Search size={16}/>Search</button></form>
      <div className="mt-4 flex flex-wrap gap-2"><Link className="btn" to="/browse">Browse items</Link><Link className="btn2" to="/report/lost">Report lost item</Link><Link className="btn2" to="/report/found">Report found item</Link></div></section>
    <section className="grid grid-cols-3 gap-3">{stats.map(([k, v]) => <div key={k} className="card text-center"><div className="text-3xl font-bold text-acc">{v}</div><div className="text-mute text-sm">{k}</div></div>)}</section>
    <section><h2 className="text-xl font-semibold mb-3">Recently reported</h2><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{db.items.slice(0, 6).map(i => <ItemCard key={i.id} it={i}/>)}</div></section>
    <section className="card"><h2 className="text-xl font-semibold mb-2">How it works</h2><p className="text-mute">Report what you lost or found, review suggested matches, then submit a claim with proof. An admin verifies it and you are notified. Meet in public campus spots and never share home addresses.</p></section>
    <p className="text-xs text-mute">Demo mode: data is stored in this browser only. Demo logins are on the Login page.</p></div>
}
function Browse() {
  const { db } = useStore(); const [sp] = useSearchParams()
  const [f, setF] = useState({ q: sp.get('q') || '', cat: '', type: '', date: '', loc: '', sort: 'new' })
  const set = k => e => setF({ ...f, [k]: e.target.value })
  const list = db.items.filter(i => (!f.q || (i.name + i.description).toLowerCase().includes(f.q.toLowerCase())) && (!f.cat || i.category === f.cat) && (!f.type || i.type === f.type)
    && (!f.date || i.date >= f.date) && (!f.loc || i.location.toLowerCase().includes(f.loc.toLowerCase()))).sort((a, b) => f.sort === 'new' ? b.date.localeCompare(a.date) : a.date.localeCompare(b.date))
  return <div className="mx-auto max-w-6xl p-4"><h1 className="text-2xl font-bold mb-3">Browse items</h1>
    <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-6 mb-4">
      <input className="inp" placeholder="Search" value={f.q} onChange={set('q')}/>
      <select className="inp" value={f.cat} onChange={set('cat')}><option value="">All categories</option>{CATS.map(c => <option key={c}>{c}</option>)}</select>
      <select className="inp" value={f.type} onChange={set('type')}><option value="">Lost &amp; found</option><option value="lost">Lost</option><option value="found">Found</option></select>
      <input className="inp" type="date" title="On or after" value={f.date} onChange={set('date')}/>
      <input className="inp" placeholder="Location" value={f.loc} onChange={set('loc')}/>
      <select className="inp" value={f.sort} onChange={set('sort')}><option value="new">Newest</option><option value="old">Oldest</option></select></div>
    {list.length ? <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{list.map(i => <ItemCard key={i.id} it={i}/>)}</div> : <Empty text="No items match these filters. Clear a filter or report the item."/>}</div>
}
function Item() {
  const { id } = useParams(); const { db, me, submitClaim, flash } = useStore(); const [msg, setMsg] = useState('')
  const it = db.items.find(x => x.id === id)
  if (!it) return <div className="p-6"><Empty text="Item not found."/></div>
  const owner = db.users.find(u => u.id === it.owner); const matches = findMatches(it, db.items)
  const mine = me && db.claims.find(c => c.itemId === id && c.by === me.id)
  return <div className="mx-auto max-w-3xl p-4 space-y-4"><div className="card space-y-2"><div className="flex justify-between"><h1 className="text-2xl font-bold">{it.name}</h1><Badge t={it.type}/></div>
    {it.image && <img src={it.image} alt={it.name} className="max-h-72 rounded-xl"/>}<p>{it.description}</p>
    <p className="text-sm text-mute">{it.category} · {it.date} · near {it.location} · reported by {owner?.name || 'a member'} · status: {it.status}</p></div>
    <div className="card"><h2 className="font-semibold mb-2">Claim this item</h2>
      {!me ? <Link className="btn" to="/login">Log in to claim</Link> : it.owner === me.id ? <p className="text-mute">This is your report.</p> : mine ? <p className="text-acc">Your claim is {mine.status}.</p> :
      <form onSubmit={e => { e.preventDefault(); if (msg.trim().length < 10) return flash('Describe proof in at least 10 characters'); submitClaim(id, msg); flash('Claim submitted') }}>
        <textarea className="inp" rows={3} placeholder="Describe proof of ownership (private details stay hidden from the public)" value={msg} onChange={e => setMsg(e.target.value)}/><button className="btn mt-2">Submit claim</button></form>}</div>
    <div className="card"><h2 className="font-semibold mb-2">Possible matches</h2>{matches.length ? matches.map(m => <Link key={m.item.id} to={`/item/${m.item.id}`} className="block py-2 border-t border-white/5"><b>{m.item.name}</b> <span className="text-acc">{m.score}% match</span><div className="text-xs text-mute">Because: {m.why}</div></Link>) : <p className="text-mute">No matches yet.</p>}</div></div>
}
function Report({ type }) {
  const { addItem, flash, me } = useStore(); const nav = useNavigate()
  const blank = { name: '', category: CATS[0], description: '', date: new Date().toISOString().slice(0, 10), location: '', contact: 'in-app', extra: '', image: '' }
  const [f, setF] = useState(blank); const [err, setErr] = useState({})
  if (!me) return <Navigate to="/login" replace/>
  const set = k => e => setF({ ...f, [k]: e.target.value })
  const pick = e => { const file = e.target.files[0]; if (!file) return
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) return setErr({ ...err, image: 'Use a JPG, PNG or WebP image' })
    if (file.size > 1e6) return setErr({ ...err, image: 'Image must be under 1 MB' })
    const r = new FileReader(); r.onload = () => { setF(p => ({ ...p, image: r.result })); setErr(p => ({ ...p, image: '' })) }; r.readAsDataURL(file) }
  const submit = e => { e.preventDefault(); const x = {}
    if (f.name.trim().length < 3) x.name = 'Enter an item name (3+ characters)'; if (f.description.trim().length < 10) x.description = 'Describe the item (10+ characters)'
    if (!f.location.trim()) x.location = 'Enter an approximate location'; setErr(x); if (Object.keys(x).length) return
    const id = addItem({ ...f, type }); flash('Report saved'); nav(`/item/${id}`) }
  const E = ({ k }) => err[k] ? <p className="text-red-300 text-xs mt-1">{err[k]}</p> : null
  return <form onSubmit={submit} className="mx-auto max-w-xl p-4 space-y-3"><h1 className="text-2xl font-bold">Report {type} item</h1>
    <div><input className="inp" placeholder="Item name" value={f.name} onChange={set('name')}/><E k="name"/></div>
    <select className="inp" value={f.category} onChange={set('category')}>{CATS.map(c => <option key={c}>{c}</option>)}</select>
    <div><textarea className="inp" rows={3} placeholder="Description" value={f.description} onChange={set('description')}/><E k="description"/></div>
    <input className="inp" type="date" value={f.date} onChange={set('date')}/>
    <div><input className="inp" placeholder="Approximate location (e.g. Library) – not a home address" value={f.location} onChange={set('location')}/><E k="location"/></div>
    <select className="inp" value={f.contact} onChange={set('contact')}><option value="in-app">Contact me in-app</option><option value="email">Via admin-relayed email</option></select>
    <input className="inp" placeholder="Additional information (optional)" value={f.extra} onChange={set('extra')}/>
    <div><input type="file" accept="image/jpeg,image/png,image/webp" onChange={pick}/><E k="image"/>{f.image && <img src={f.image} alt="Preview" className="mt-2 h-32 rounded-xl"/>}</div>
    <button className="btn">Submit report</button></form>
}
function Auth({ mode }) {
  const { login, register, flash } = useStore(); const nav = useNavigate(); const [f, setF] = useState({ name: '', email: '', password: '' }); const [err, setErr] = useState('')
  const set = k => e => setF({ ...f, [k]: e.target.value })
  const go = e => { e.preventDefault(); const ok = mode === 'login' ? login(f.email, f.password) : (f.name && f.password.length >= 6 ? register(f.name, f.email, f.password) : false)
    if (ok) { flash('Welcome'); nav('/dashboard') } else setErr(mode === 'login' ? 'Wrong email or password' : 'Enter a name, a new email and a 6+ character password') }
  return <form onSubmit={go} className="mx-auto max-w-sm p-4 space-y-3"><h1 className="text-2xl font-bold">{mode === 'login' ? 'Log in' : 'Create account'}</h1>
    {mode === 'register' && <input className="inp" placeholder="Name" value={f.name} onChange={set('name')}/>}
    <input className="inp" type="email" placeholder="Email" value={f.email} onChange={set('email')}/><input className="inp" type="password" placeholder="Password" value={f.password} onChange={set('password')}/>
    {err && <p className="text-red-300 text-sm">{err}</p>}<button className="btn">{mode === 'login' ? 'Log in' : 'Sign up'}</button>
    {mode === 'login' && <p className="text-xs text-mute">Demo: user@demo.com / user123 · admin@demo.com / admin123</p>}</form>
}
function Dashboard() {
  const { db, me, markRead, resetDemo } = useStore(); const [tab, setTab] = useState('reports')
  if (!me) return <Navigate to="/login" replace/>
  const mine = db.items.filter(i => i.owner === me.id), cl = db.claims.filter(c => c.by === me.id), nt = db.notes.filter(n => n.user === me.id)
  const T = ({ k, children }) => <button onClick={() => { setTab(k); if (k === 'notes') markRead() }} className={tab === k ? 'btn' : 'btn2'}>{children}</button>
  return <div className="mx-auto max-w-4xl p-4 space-y-4"><h1 className="text-2xl font-bold">Hi, {me.name}</h1>
    <div className="grid grid-cols-3 gap-3 text-center">{[['Reports', mine.length], ['Lost', mine.filter(i => i.type === 'lost').length], ['Found', mine.filter(i => i.type === 'found').length]].map(([k, v]) => <div key={k} className="card"><div className="text-2xl text-acc font-bold">{v}</div>{k}</div>)}</div>
    <div className="flex gap-2 flex-wrap"><T k="reports">My reports</T><T k="claims">My claims</T><T k="notes"><Bell size={14}/>Notifications</T></div>
    {tab === 'reports' && (mine.length ? mine.map(i => <ItemCard key={i.id} it={i}/>) : <Empty text="No reports yet."/>)}
    {tab === 'claims' && (cl.length ? cl.map(c => <div key={c.id} className="card">{db.items.find(i => i.id === c.itemId)?.name} – <b>{c.status}</b></div>) : <Empty text="No claims yet."/>)}
    {tab === 'notes' && (nt.length ? nt.map(n => <div key={n.id} className="card">{n.text}</div>) : <Empty text="No notifications."/>)}
    <button className="btn2" onClick={resetDemo}>Reset demo data</button></div>
}
function Admin() {
  const { db, me, decideClaim } = useStore()
  if (!me) return <Navigate to="/login" replace/>
  if (me.role !== 'admin') return <Navigate to="/dashboard" replace/>
  return <div className="mx-auto max-w-4xl p-4 space-y-4"><h1 className="text-2xl font-bold">Admin</h1>
    <div className="grid grid-cols-3 gap-3 text-center">{[['Users', db.users.length], ['Reports', db.items.length], ['Pending claims', db.claims.filter(c => c.status === 'pending').length]].map(([k, v]) => <div key={k} className="card"><div className="text-2xl text-acc font-bold">{v}</div>{k}</div>)}</div>
    <h2 className="font-semibold">Claims</h2>{db.claims.length ? db.claims.map(c => <div key={c.id} className="card"><b>{db.items.find(i => i.id === c.itemId)?.name}</b> by {db.users.find(u => u.id === c.by)?.name}: {c.message}
      <div className="mt-2 flex gap-2 items-center">{c.status === 'pending' ? <><button className="btn" onClick={() => decideClaim(c.id, 'approved')}>Approve</button><button className="btn2" onClick={() => decideClaim(c.id, 'rejected')}>Reject</button></> : <span className="text-acc">{c.status}</span>}</div></div>) : <Empty text="No claims to review."/>}
    <h2 className="font-semibold">Users</h2>{db.users.map(u => <div key={u.id} className="card">{u.name} · {u.email} · {u.role}</div>)}</div>
}
function Chat() {
  const [open, setOpen] = useState(false); const [q, setQ] = useState(''); const [log, setLog] = useState([{ b: 1, t: 'Hi, I am FindIt Assistant. Ask about reporting, claims, searching or safety.' }])
  const send = e => { e.preventDefault(); if (!q.trim()) return; setLog(l => [...l, { t: q }, { b: 1, t: reply(q) }]); setQ('') }
  return <div className="fixed bottom-4 right-4 z-30">{open ? <div className="w-72 card shadow-xl"><div className="flex justify-between mb-2"><b>FindIt Assistant</b><button onClick={() => setOpen(false)} aria-label="Close"><X size={16}/></button></div>
    <div className="h-48 overflow-auto space-y-2 text-sm">{log.map((m, i) => <p key={i} className={m.b ? 'text-acc2' : 'text-right'}>{m.t}</p>)}</div>
    <form onSubmit={send} className="mt-2 flex gap-1"><input className="inp" value={q} onChange={e => setQ(e.target.value)} placeholder="Ask something"/><button className="btn">Send</button></form></div>
    : <button className="btn rounded-full" onClick={() => setOpen(true)}><MessageCircle size={18}/>Help</button>}</div>
}
export default function App() {
  const { toast } = useStore()
  return <div className="min-h-screen"><Nav/><Routes>
    <Route path="/" element={<Home/>}/><Route path="/browse" element={<Browse/>}/><Route path="/item/:id" element={<Item/>}/>
    <Route path="/report/lost" element={<Report type="lost"/>}/><Route path="/report/found" element={<Report type="found"/>}/>
    <Route path="/login" element={<Auth mode="login"/>}/><Route path="/register" element={<Auth mode="register"/>}/>
    <Route path="/dashboard" element={<Dashboard/>}/><Route path="/admin" element={<Admin/>}/><Route path="*" element={<div className="p-6"><Empty text="Page not found."/></div>}/></Routes>
    <Chat/>{toast && <div className="fixed bottom-4 left-4 card border-acc/40 text-acc" role="status">{toast}</div>}</div>
}
