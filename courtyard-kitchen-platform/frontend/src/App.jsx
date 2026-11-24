import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Link, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowDownRight, ArrowLeft, ArrowRight, ArrowUpRight, BadgeCheck, Bell, Check, CheckCircle2,
  ChefHat, ChevronDown, ChevronLeft, ChevronRight, CircleHelp, Clock3, Coffee, Compass,
  CreditCard, DoorOpen, Download, Eye, EyeOff, Facebook, FileImage, Flame, Flower2, ForkKnife,
  Headphones, Heart, Instagram, LayoutDashboard, Leaf, LogIn, LogOut, Mail, MapPin, Menu as MenuIcon,
  Minus, Music2, Package, Pencil, Phone, Plus, Search, Send, Settings, ShieldCheck, ShoppingBag,
  ShoppingCart, Sparkles, Star, Table2, Truck, User, UserPlus, Users, Utensils, Volume2, VolumeX,
  X, XCircle, CalendarDays, Trash2, RefreshCw, QrCode, ChevronUp, CircleCheck, Timer, Wallet,
  ClipboardList, ImagePlus, ExternalLink
} from 'lucide-react';
import { api, asset, imagePath, money } from './api';

const DEFAULT_SETTINGS = {
  restaurantName: 'The Courtyard Kitchen', tagline: 'Good food. Open air. Better company.',
  phone: '+260 97 000 0000', address: 'Lusaka, Zambia', currency: 'ZMW', deliveryFee: 25,
  paymentQr: '', paymentInstructions: 'Scan the QR code and use your order number as the payment reference.'
};
const HERO_SLIDES = [
  { image: '/assets/images/garden-courtyard.jpg', eyebrow: 'A little outside the ordinary', title: 'Make room for\nthe good stuff.', detail: 'Open-air moments, food made with feeling and a table that always has room for one more.' },
  { image: '/assets/images/smash-burger.jpg', eyebrow: 'The grill is calling', title: 'Fire-kissed.\nMade to linger.', detail: 'Big flavours, honest ingredients and the kind of first bite you talk about later.' },
  { image: '/assets/images/sharing-table.jpg', eyebrow: 'Better when shared', title: 'Come hungry.\nLeave happy.', detail: 'Gather your people around generous plates and let the afternoon take its time.' }
];
const CATEGORY_ICONS = { All: Utensils, Grill: Flame, Kitchen: ChefHat, Sides: Leaf, Platters: ForkKnife, Drinks: Coffee };
const ROLE_LABEL = { admin: 'Owner', cook: 'Kitchen', delivery: 'Delivery', waiter: 'Floor team', customer: 'Guest' };
const STATUS_LABEL = {
  placed: 'New order', requested: 'Requested', confirmed: 'Confirmed', preparing: 'Preparing', ready: 'Ready',
  out_for_delivery: 'On the way', delivered: 'Delivered', completed: 'Completed', seated: 'Seated', cancelled: 'Cancelled'
};

function readFile(file, maxMb = 5) {
  return new Promise((resolve, reject) => {
    if (!file) return resolve('');
    if (!/^image\/(png|jpeg|webp)$/.test(file.type)) return reject(new Error('Choose a PNG, JPG or WebP image.'));
    if (file.size > maxMb * 1024 * 1024) return reject(new Error(`Choose an image smaller than ${maxMb} MB.`));
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('The image could not be read.'));
    reader.readAsDataURL(file);
  });
}

function Toast({ toast, onClose }) {
  return <AnimatePresence>{toast && <motion.div className={`toast toast-${toast.type || 'success'}`} initial={{ opacity: 0, y: 20, scale: .96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10 }} role="status">
    <span className="toast-icon">{toast.type === 'error' ? <XCircle size={18}/> : <CheckCircle2 size={18}/>}</span>
    <span>{toast.message}</span><button aria-label="Dismiss notification" onClick={onClose}><X size={16}/></button>
  </motion.div>}</AnimatePresence>;
}

function Brand({ light = false, onClick }) {
  return <button className={`brand ${light ? 'brand-light' : ''}`} onClick={onClick} aria-label="The Courtyard Kitchen home">
    <span className="brand-mark"><span>c</span><i/></span><span className="brand-words"><strong>the courtyard</strong><small>KITCHEN & GARDEN</small></span>
  </button>;
}

function Header({ user, cartCount, onLogin, onCart, onLogout, onDashboard, onReserve }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => { const fn = () => setScrolled(window.scrollY > 20); window.addEventListener('scroll', fn); return () => window.removeEventListener('scroll', fn); }, []);
  const jump = (id) => { setMobileOpen(false); if (window.location.hash !== '#/') window.location.hash = '#/'; setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }), 80); };
  return <header className={`site-header ${scrolled ? 'is-scrolled' : ''}`}>
    <div className="header-inner shell">
      <Brand onClick={() => { setMobileOpen(false); window.location.hash = '#/'; window.scrollTo({ top: 0, behavior: 'smooth' }); }}/>
      <nav className={`main-nav ${mobileOpen ? 'nav-open' : ''}`} aria-label="Main navigation">
        <button onClick={() => jump('menu')}>The menu</button><button onClick={() => jump('story')}>Our space</button><button onClick={() => jump('visit')}>Find us</button>
        <button className="mobile-only" onClick={() => { setMobileOpen(false); onReserve(); }}>Book a table</button>
        {user && <button className="mobile-only" onClick={() => { setMobileOpen(false); onDashboard(); }}>My workspace</button>}
      </nav>
      <div className="header-actions">
        <button className="icon-button cart-trigger" aria-label={`Open basket, ${cartCount} items`} onClick={onCart}><ShoppingBag size={19}/>{cartCount > 0 && <span className="cart-count">{cartCount}</span>}</button>
        {user ? <div className="user-menu-wrap"><button className="user-pill" onClick={onDashboard}><span className="avatar-mini">{user.name?.slice(0,1)?.toUpperCase() || 'G'}</span><span>{user.name?.split(' ')[0]}</span><ChevronDown size={14}/></button><div className="user-dropdown"><button onClick={onDashboard}><LayoutDashboard size={15}/> Workspace</button><button onClick={onLogout}><LogOut size={15}/> Sign out</button></div></div> : <button className="btn btn-dark btn-small sign-in-btn" onClick={onLogin}>Sign in <ArrowUpRight size={15}/></button>}
        <button className="btn btn-copper btn-small reserve-top" onClick={onReserve}>Book a table <ArrowUpRight size={15}/></button>
      </div>
      <button className="mobile-menu-button" aria-label="Toggle menu" onClick={() => setMobileOpen((v) => !v)}>{mobileOpen ? <X/> : <MenuIcon/>}</button>
    </div>
  </header>;
}

function AuthModal({ onClose, onSuccess, notify }) {
  const [view, setView] = useState('signin');
  const [busy, setBusy] = useState(false);
  const [closing, setClosing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const change = (key) => (event) => setForm((old) => ({ ...old, [key]: event.target.value }));
  const submit = async (event) => {
    event.preventDefault(); setError(''); setBusy(true);
    try {
      const endpoint = view === 'signin' ? '/api/auth/login' : '/api/auth/register';
      const data = await api(endpoint, { method: 'POST', body: JSON.stringify(form) });
      setClosing(true);
      window.setTimeout(() => { onSuccess(data); onClose(); notify(`${view === 'signin' ? 'Welcome back' : 'Your account is ready'}, ${data.user.name.split(' ')[0]}.`, 'success'); }, 420);
    } catch (err) { setError(err.message); setBusy(false); }
  };
  return <AnimatePresence>
    <motion.div className="modal-backdrop auth-backdrop" initial={{ opacity: 0 }} animate={{ opacity: closing ? 0 : 1 }} exit={{ opacity: 0 }} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <motion.div className={`auth-panel ${closing ? 'auth-closing' : ''}`} initial={{ opacity: 0, y: 34, scale: .92, rotateX: 7 }} animate={closing ? { opacity: 0, y: 20, scaleY: .05, scaleX: .88, borderRadius: 40 } : { opacity: 1, y: 0, scale: 1, rotateX: 0 }} exit={{ opacity: 0, scale: .92 }} transition={{ type: 'spring', stiffness: 240, damping: 24 }}>
        <div className="auth-art">
          <div className="auth-orb auth-orb-one"/><div className="auth-orb auth-orb-two"/><div className="auth-orb auth-orb-three"/>
          <div className="auth-art-top"><Brand light onClick={onClose}/><button className="auth-close" onClick={onClose} aria-label="Close sign in"><X size={19}/></button></div>
          <div className="auth-art-content"><span className="eyebrow eyebrow-light"><span className="eyebrow-dot"/> YOUR TABLE IS WAITING</span><h2>Good things<br/>happen <em>around</em><br/>the table.</h2><p>Come as you are. We’ll take care of the rest.</p></div>
          <div className="auth-art-foot"><span>01 — GOOD FOOD</span><span>02 — OPEN AIR</span><span>03 — GOOD COMPANY</span></div>
        </div>
        <div className="auth-form-side">
          <div className="auth-mobile-title"><span className="eyebrow">WELCOME TO THE COURTYARD</span><h3>{view === 'signin' ? 'Good to see you.' : 'Let’s get acquainted.'}</h3></div>
          <div className="auth-switch"><button className={view === 'signin' ? 'active' : ''} onClick={() => { setView('signin'); setError(''); }}>Sign in</button><button className={view === 'signup' ? 'active' : ''} onClick={() => { setView('signup'); setError(''); }}>Create account</button></div>
          <div className="auth-heading"><span className="eyebrow">{view === 'signin' ? 'YOUR CORNER OF THE COURTYARD' : 'A SEAT WITH YOUR NAME ON IT'}</span><h3>{view === 'signin' ? 'Welcome back.' : 'Let’s get started.'}</h3><p>{view === 'signin' ? 'Sign in to manage your orders, reservations and more.' : 'Create an account to keep your favourite moments in one place.'}</p></div>
          <form className="auth-form" onSubmit={submit}>
            {view === 'signup' && <label className="field"><span>Your name</span><span className="input-wrap"><User size={16}/><input required minLength="2" value={form.name} onChange={change('name')} placeholder="David Mutemwa" autoComplete="name"/></span></label>}
            <label className="field"><span>Email address</span><span className="input-wrap"><Mail size={16}/><input required type="email" value={form.email} onChange={change('email')} placeholder="you@example.com" autoComplete="email"/></span></label>
            {view === 'signup' && <label className="field"><span>Phone number <small>OPTIONAL</small></span><span className="input-wrap"><Phone size={16}/><input value={form.phone} onChange={change('phone')} placeholder="+260 ..." autoComplete="tel"/></span></label>}
            <label className="field"><span>Password</span><span className="input-wrap"><ShieldCheck size={16}/><input required minLength={view === 'signup' ? 8 : 1} type={showPassword ? 'text' : 'password'} value={form.password} onChange={change('password')} placeholder={view === 'signup' ? 'At least 8 characters' : 'Enter your password'} autoComplete={view === 'signin' ? 'current-password' : 'new-password'}/><button type="button" className="input-action" onClick={() => setShowPassword((v) => !v)} aria-label="Toggle password visibility">{showPassword ? <EyeOff size={16}/> : <Eye size={16}/>}</button></span></label>
            {error && <p className="form-error"><CircleHelp size={15}/>{error}</p>}
            <button className="btn btn-green btn-block auth-submit" type="submit" disabled={busy}>{busy ? <span className="spinner"/> : <>{view === 'signin' ? 'Sign in to your account' : 'Create my account'} <ArrowUpRight size={17}/></>}</button>
          </form>
          <div className="auth-divider"><span/> <small>MADE FOR GOOD MOMENTS</small> <span/></div>
          <p className="auth-terms">By continuing, you agree to our house rules and a little more good food in your life.</p>
          <button className="staff-access-note" type="button" onClick={() => notify('Team accounts are created by the owner. Use the staff credentials provided by your manager.', 'info')}><Users size={14}/> Team member? <u>Ask your manager for access</u></button>
        </div>
      </motion.div>
    </motion.div>
  </AnimatePresence>;
}

function ReservationModal({ onClose, settings, user, notify }) {
  const [busy,setBusy] = useState(false), [error,setError] = useState(''), [complete,setComplete] = useState(false);
  const tomorrow = new Date(Date.now() + 86400000).toLocaleDateString('en-CA');
  const [form,setForm] = useState({ customerName:user?.name || '',customerEmail:user?.email || '',customerPhone:user?.phone || '',date:tomorrow,time:'18:30',guests:'2',occasion:'',notes:'' });
  const set = (key) => (e) => setForm((v) => ({ ...v,[key]:e.target.value }));
  const submit = async (e) => { e.preventDefault(); setError('');setBusy(true);try { await api('/api/reservations',{method:'POST',body:JSON.stringify(form)});setComplete(true);notify('Your table request has been sent. We’ll be in touch.','success'); } catch(err){setError(err.message);} finally{setBusy(false);} };
  return <motion.div className="modal-backdrop" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onMouseDown={(e)=>e.target===e.currentTarget&&onClose()}>
    <motion.div className="reservation-modal surface-modal" initial={{y:30,scale:.96,opacity:0}} animate={{y:0,scale:1,opacity:1}} exit={{y:15,opacity:0}} transition={{type:'spring',stiffness:260,damping:26}}>
      <div className="modal-photo" style={{backgroundImage:`linear-gradient(180deg,rgba(20,39,31,.06),rgba(20,39,31,.82)),url(${asset('/assets/images/restaurant-interior.jpg')})`}}><button className="modal-close modal-close-light" onClick={onClose}><X/></button><span className="eyebrow eyebrow-light"><span className="eyebrow-dot"/> SAVE YOUR SEAT</span><h2>A table<br/><em>for the good times.</em></h2><p>Tell us when you’re coming. We’ll make it lovely.</p></div>
      <div className="reservation-form-side">
        {complete ? <div className="success-panel"><div className="success-stamp"><Check size={28}/></div><span className="eyebrow">REQUEST RECEIVED</span><h3>We’ll save you a little space.</h3><p>Your reservation request is with our floor team. Look out for a confirmation by phone or email.</p><button className="btn btn-green btn-block" onClick={onClose}>Lovely, thank you <ArrowRight size={16}/></button></div> : <>
          <div className="modal-title-row"><div><span className="eyebrow">LET’S MAKE A PLAN</span><h3>Book a table</h3></div><span className="round-icon"><CalendarDays/></span></div>
          <form className="booking-form" onSubmit={submit}>
            <div className="field-grid"><label className="field"><span>Your name</span><input required value={form.customerName} onChange={set('customerName')} placeholder="Full name"/></label><label className="field"><span>Phone number</span><input required value={form.customerPhone} onChange={set('customerPhone')} placeholder="+260 ..."/></label></div>
            <label className="field"><span>Email address</span><input required type="email" value={form.customerEmail} onChange={set('customerEmail')} placeholder="you@example.com"/></label>
            <div className="field-grid field-grid-three"><label className="field"><span>Date</span><input required type="date" min={new Date().toLocaleDateString('en-CA')} value={form.date} onChange={set('date')}/></label><label className="field"><span>Time</span><select value={form.time} onChange={set('time')}>{['11:00','12:00','13:00','14:00','16:00','17:00','18:00','18:30','19:00','19:30','20:00','20:30'].map(t=><option key={t}>{t}</option>)}</select></label><label className="field"><span>Guests</span><select value={form.guests} onChange={set('guests')}>{Array.from({length:12},(_,i)=>i+1).map(n=><option key={n} value={n}>{n} {n===1?'guest':'guests'}</option>)}</select></label></div>
            <label className="field"><span>What brings you in? <small>OPTIONAL</small></span><select value={form.occasion} onChange={set('occasion')}><option value="">Just because</option><option>Birthday</option><option>Anniversary</option><option>Business lunch</option><option>Family gathering</option><option>Something special</option></select></label>
            <label className="field"><span>A note for us <small>OPTIONAL</small></span><textarea rows="2" value={form.notes} onChange={set('notes')} placeholder="A little something we should know?"/></label>
            {error&&<p className="form-error"><CircleHelp size={15}/>{error}</p>}
            <button className="btn btn-copper btn-block" disabled={busy}>{busy?<span className="spinner"/>:<>Request my table <ArrowUpRight size={17}/></>}</button>
            <p className="form-footnote">Reservations are requests until our team confirms your table.</p>
          </form>
        </>}
      </div>
    </motion.div>
  </motion.div>;
}

function CartDrawer({ open, onClose, cart, setCart, menu, user, settings, notify }) {
  const [step,setStep]=useState('basket'), [busy,setBusy]=useState(false), [error,setError]=useState(''), [order,setOrder]=useState(null);
  const [details,setDetails]=useState({customerName:user?.name||'',customerEmail:user?.email||'',customerPhone:user?.phone||'',orderType:'delivery',deliveryAddress:'',paymentMethod:'cash',notes:''});
  useEffect(()=>{ if(open){setStep('basket');setError('');setOrder(null);setDetails(v=>({...v,customerName:user?.name||v.customerName,customerEmail:user?.email||v.customerEmail,customerPhone:user?.phone||v.customerPhone}));}},[open,user]);
  const totalItems=cart.reduce((sum,item)=>sum+item.quantity,0), subtotal=cart.reduce((sum,item)=>sum+item.price*item.quantity,0), delivery=details.orderType==='delivery'?Number(settings.deliveryFee||25):0;
  const update=(id,delta)=>setCart((items)=>items.map((i)=>i.id===id?{...i,quantity:Math.max(0,Math.min(20,i.quantity+delta))}:i).filter(i=>i.quantity>0));
  const set=(key)=>(e)=>setDetails(v=>({...v,[key]:e.target.value}));
  const placeOrder=async(e)=>{e.preventDefault();setBusy(true);setError('');try{const data=await api('/api/orders',{method:'POST',body:JSON.stringify({...details,items:cart.map(({id,quantity})=>({id,quantity}))})});setOrder(data.order);setStep('success');setCart([]);notify('Your order is on its way to the kitchen.','success');}catch(err){setError(err.message);}finally{setBusy(false);}};
  return <AnimatePresence>{open&&<>
    <motion.div className="drawer-scrim" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={onClose}/>
    <motion.aside className="cart-drawer" initial={{x:'100%'}} animate={{x:0}} exit={{x:'100%'}} transition={{type:'spring',damping:28,stiffness:250}} aria-label="Your basket">
      <div className="drawer-header"><div><span className="eyebrow">A LITTLE SOMETHING FOR YOU</span><h3>{step==='success'?'Order received':step==='checkout'?'Almost there.':'Your basket'} <span className="drawer-count">{totalItems || ''}</span></h3></div><button className="icon-button" aria-label="Close basket" onClick={onClose}><X/></button></div>
      {step==='success' ? <div className="order-success"><div className="success-stamp"><Check size={28}/></div><span className="eyebrow">TICKET SENT TO THE KITCHEN</span><h3>That’s a good choice.</h3><p>Your reference is <strong>{order?.id?.slice(0,8).toUpperCase()}</strong>. Keep it handy if you need to ask us anything.</p><div className="order-receipt"><div><span>Order total</span><strong>{money(order?.total,settings.currency)}</strong></div><div><span>Collection</span><strong>{order?.orderType==='delivery'?'Delivery':'Pick-up'}</strong></div><div><span>Payment</span><strong>{order?.paymentMethod==='qr'?'QR payment':'Pay on arrival'}</strong></div></div>
        {order?.paymentMethod==='qr'&&settings.paymentQr&&<div className="qr-payment"><p>Scan to pay using your mobile money app</p><img src={settings.paymentQr} alt="Restaurant payment QR code"/><small>{settings.paymentInstructions}</small></div>}
        <button className="btn btn-green btn-block" onClick={onClose}>Back to the good stuff <ArrowRight size={16}/></button>
      </div> : step==='basket' ? <>
        <div className="drawer-body">{cart.length===0?<div className="empty-basket"><div className="empty-basket-icon"><ShoppingBag size={30}/></div><h4>Nothing in the basket. Yet.</h4><p>There’s something lovely waiting on the menu.</p><button className="btn btn-green" onClick={onClose}>Explore the menu <ArrowRight size={16}/></button></div>:<div className="basket-list">{cart.map(item=><div className="basket-item" key={item.id}><img src={imagePath(item.image_url)} alt={item.name}/><div className="basket-item-copy"><strong>{item.name}</strong><span>{money(item.price,settings.currency)}</span><div className="quantity-control"><button onClick={()=>update(item.id,-1)} aria-label={`Remove one ${item.name}`}><Minus size={13}/></button><b>{item.quantity}</b><button onClick={()=>update(item.id,1)} aria-label={`Add one ${item.name}`}><Plus size={13}/></button></div></div><strong className="basket-line-total">{money(item.price*item.quantity,settings.currency)}</strong></div>)}</div>}</div>
        {cart.length>0&&<div className="drawer-footer"><div className="subtotal-line"><span>Subtotal</span><strong>{money(subtotal,settings.currency)}</strong></div><p>Delivery is calculated at checkout.</p><button className="btn btn-copper btn-block" onClick={()=>setStep('checkout')}>Continue to checkout <ArrowRight size={17}/></button><button className="text-link centered" onClick={onClose}>Keep browsing</button></div>}
      </> : <>
        <div className="drawer-body checkout-body"><button className="back-link" onClick={()=>setStep('basket')}><ArrowLeft size={15}/> Back to basket</button><form id="checkout-form" className="checkout-form" onSubmit={placeOrder}><span className="eyebrow">DELIVERY DETAILS</span>
          <label className="field"><span>Your name</span><input required value={details.customerName} onChange={set('customerName')} placeholder="Full name"/></label><label className="field"><span>Email address</span><input required type="email" value={details.customerEmail} onChange={set('customerEmail')} placeholder="you@example.com"/></label><label className="field"><span>Phone number</span><input required value={details.customerPhone} onChange={set('customerPhone')} placeholder="+260 ..."/></label>
          <div className="order-type-toggle"><button type="button" className={details.orderType==='delivery'?'selected':''} onClick={()=>setDetails(v=>({...v,orderType:'delivery'}))}><Truck size={16}/> Delivery</button><button type="button" className={details.orderType==='pickup'?'selected':''} onClick={()=>setDetails(v=>({...v,orderType:'pickup'}))}><ShoppingBag size={16}/> Pick-up</button></div>
          {details.orderType==='delivery'&&<label className="field"><span>Where should we bring it?</span><input required value={details.deliveryAddress} onChange={set('deliveryAddress')} placeholder="Street, area, landmark"/></label>}
          <label className="field"><span>Payment</span><select value={details.paymentMethod} onChange={set('paymentMethod')}><option value="cash">Cash on {details.orderType==='delivery'?'delivery':'collection'}</option><option value="qr" disabled={!settings.paymentQr}>Pay by QR code {settings.paymentQr?'':'(not set up yet)'}</option></select></label>
          <label className="field"><span>Anything else? <small>OPTIONAL</small></span><textarea rows="2" value={details.notes} onChange={set('notes')} placeholder="Allergies, directions or a little note..."/></label>
          {error&&<p className="form-error"><CircleHelp size={15}/>{error}</p>}
        </form></div>
        <div className="drawer-footer checkout-footer"><div className="subtotal-line"><span>Food</span><strong>{money(subtotal,settings.currency)}</strong></div><div className="subtotal-line"><span>{details.orderType==='delivery'?'Delivery':'Pick-up'}</span><strong>{delivery?money(delivery,settings.currency):'Free'}</strong></div><div className="subtotal-line total-line"><span>Total</span><strong>{money(subtotal+delivery,settings.currency)}</strong></div><button type="submit" form="checkout-form" className="btn btn-green btn-block" disabled={busy}>{busy?<span className="spinner"/>:<>Place my order <ArrowUpRight size={17}/></>}</button></div>
      </>}
    </motion.aside>
  </>}</AnimatePresence>;
}

function MusicDock({ notify }) {
  const tracks=[{label:"Tell Me It's You",artist:'Aaron Pierre & Tiffany Boone',src:asset('/assets/audio/tell-me-its-you.mp3')},{label:'Blockbuster Instrumental',artist:'Background mix',src:asset('/assets/audio/blockbuster-background.mp3')}];
  const [playing,setPlaying]=useState(false),[track,setTrack]=useState(0),[open,setOpen]=useState(false),[muted,setMuted]=useState(false);
  const audio=useRef(null);
  useEffect(()=>{const el=audio.current;if(!el)return;el.src=tracks[track].src;el.volume=muted?0:.45;if(playing){el.play().catch(()=>{setPlaying(false);notify('Tap play again to start the music.','info');});}else el.pause();},[playing,track,muted]);
  useEffect(()=>{const el=audio.current;if(!el)return;const end=()=>setPlaying(false);el.addEventListener('ended',end);return()=>el.removeEventListener('ended',end);},[]);
  return <div className={`music-dock ${open?'music-dock-open':''}`}><audio ref={audio} preload="none"/><button className="music-main" onClick={()=>{setOpen(v=>!v);}} aria-label="Open music controls"><span className={`music-disc ${playing?'disc-spin':''}`}><Music2 size={16}/></span><span className="music-main-copy"><small>SET THE MOOD</small><strong>{playing?tracks[track].label:'A little background music'}</strong></span><ChevronUp size={15} className="music-chevron"/></button>
    <AnimatePresence>{open&&<motion.div className="music-controls" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:8}}><div className="music-now"><span className="music-eq">♫</span><div><strong>{tracks[track].label}</strong><small>{tracks[track].artist}</small></div></div><div className="music-control-row"><button onClick={()=>setPlaying(v=>!v)} className="music-play" aria-label={playing?'Pause':'Play'}>{playing?<span>Ⅱ</span>:<span>▶</span>}</button><button onClick={()=>setTrack(v=>(v+1)%tracks.length)} title="Next track"><ArrowRight size={16}/></button><button onClick={()=>setMuted(v=>!v)} title={muted?'Unmute':'Mute'}>{muted?<VolumeX size={16}/>:<Volume2 size={16}/>}</button></div><p>Music starts only when you press play.</p></motion.div>}</AnimatePresence>
  </div>;
}

function Hero({ onReserve, onCart, cartCount }) {
  const [slide,setSlide]=useState(0);
  useEffect(()=>{const t=window.setInterval(()=>setSlide(v=>(v+1)%HERO_SLIDES.length),7500);return()=>window.clearInterval(t);},[]);
  const current=HERO_SLIDES[slide];
  return <section className="hero-section" id="top"><div className="hero-backdrop" style={{backgroundImage:`linear-gradient(90deg,rgba(18,37,29,.95) 0%,rgba(18,37,29,.8) 44%,rgba(18,37,29,.2) 100%),url(${asset(current.image)})`}}/>
    <div className="hero-grain"/><div className="hero-grid shell"><div className="hero-copy"><motion.div key={`eyebrow-${slide}`} initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} className="hero-eyebrow eyebrow eyebrow-light"><span className="eyebrow-dot"/>{current.eyebrow}</motion.div><AnimatePresence mode="wait"><motion.h1 key={slide} initial={{opacity:0,y:24,filter:'blur(8px)'}} animate={{opacity:1,y:0,filter:'blur(0px)'}} exit={{opacity:0,y:-14}} transition={{duration:.55,ease:[.2,.7,.2,1]}}>{current.title.split('\n').map((line,i)=><span key={i}>{line}{i===0&&<br/>}</span>)}</motion.h1></AnimatePresence><p className="hero-description">{current.detail}</p>
      <div className="hero-ctas"><button className="btn btn-cream" onClick={()=>document.getElementById('menu')?.scrollIntoView({behavior:'smooth'})}>Explore the menu <ArrowUpRight size={17}/></button><button className="hero-quiet-link" onClick={onReserve}>Save me a table <ArrowRight size={16}/></button></div>
      <div className="hero-bottom-meta"><div className="hero-paging"><span>0{slide+1}</span><i/><span>0{HERO_SLIDES.length}</span></div><div className="hero-pager-buttons"><button onClick={()=>setSlide(v=>(v+HERO_SLIDES.length-1)%HERO_SLIDES.length)} aria-label="Previous slide"><ChevronLeft size={17}/></button><button onClick={()=>setSlide(v=>(v+1)%HERO_SLIDES.length)} aria-label="Next slide"><ChevronRight size={17}/></button></div><span className="hero-scroll-hint">SCROLL TO TASTE <ArrowDownRight size={15}/></span></div>
    </div>
    <div className="hero-media-stack"><div className="hero-image-caption"><span className="caption-number">01 / 03</span><span>THE COURTYARD EXPERIENCE</span></div><div className="hero-film-card"><div className="film-card-head"><span><i/> FRESH OFF THE GRILL</span><span>00:22</span></div><div className="film-card-video"><video autoPlay muted loop playsInline poster={asset("/assets/images/smash-burger.jpg")} src={asset("/assets/video/burger-cinematic.mp4")}/><div className="film-overlay"><span className="film-play-mark"><PlayIcon/></span><span>THE GOOD STUFF<br/><b>LOOKS LIKE THIS.</b></span></div></div><div className="film-card-foot"><span>MADE FRESH, EVERY DAY</span><span>↗</span></div></div><div className="hero-sticker"><span>GROWN WITH<br/>GOOD INTENTIONS</span><Leaf size={23}/></div></div>
    <div className="hero-side-note">LUSAKA · ZAMBIA <span/> OPEN FOR GOOD TIMES</div></div><div className="hero-bottom-ticker"><div><span>GOOD FOOD</span><i>✳</i><span>OPEN AIR</span><i>✳</i><span>BETTER COMPANY</span><i>✳</i><span>GOOD FOOD</span><i>✳</i><span>OPEN AIR</span><i>✳</i><span>BETTER COMPANY</span><i>✳</i></div></div>
  </section>;
}
function PlayIcon(){return <span className="play-triangle"/>;}

function SectionHeading({ kicker, title, emphasis, detail, action, onAction, light=false, align='left' }) {
  return <div className={`section-heading ${light?'section-heading-light':''} align-${align}`}><div><span className="eyebrow">{kicker}</span><h2>{title} {emphasis&&<em>{emphasis}</em>}</h2>{detail&&<p>{detail}</p>}</div>{action&&<button className="text-link heading-action" onClick={onAction}>{action} <ArrowUpRight size={16}/></button>}</div>;
}

function MenuCard({ item, onAdd, currency }) {
  return <motion.article className="menu-card" layout whileHover={{y:-5}} transition={{duration:.2}}><div className="menu-card-photo"><img src={imagePath(item.image_url)} alt={item.name} loading="lazy"/><span className="menu-card-category">{item.category}</span><button className="menu-add" onClick={()=>onAdd(item)} aria-label={`Add ${item.name} to basket`}><Plus size={18}/></button>{item.featured&&<span className="featured-ribbon"><Star size={11} fill="currentColor"/> HOUSE FAVOURITE</span>}</div><div className="menu-card-content"><div><h3>{item.name}</h3><p>{item.description}</p></div><div className="menu-card-foot"><strong>{money(item.price,currency)}</strong><button onClick={()=>onAdd(item)}>Add to basket <Plus size={14}/></button></div></div></motion.article>;
}

function Home({ menu, settings, addToCart, onReserve, onCart, user, onLogin, notify }) {
  const [category,setCategory]=useState('All'),[search,setSearch]=useState('');
  const categories=useMemo(()=>['All',...new Set(menu.map(item=>item.category))],[menu]);
  const filtered=menu.filter(item=>(category==='All'||item.category===category)&&`${item.name} ${item.description}`.toLowerCase().includes(search.toLowerCase())&&item.available);
  const featured=menu.filter(item=>item.featured&&item.available).slice(0,3);
  return <main>
    <Hero onReserve={onReserve} onCart={onCart}/>
    <section className="intro-strip shell"><div className="intro-stamp"><Flower2 size={21}/><span>EST.<br/>2024</span></div><p>Not just a meal. <em>A reason to get together.</em></p><div className="intro-aside"><span>GOOD FOOD, MADE WITH FEELING</span><ArrowDownRight size={17}/></div></section>
    <section className="menu-section section-pad" id="menu"><div className="shell"><SectionHeading kicker="A MENU WITH A LITTLE SOUL" title="A few of our" emphasis="favourites." detail="From the grill to the garden, everything is made for the moment you’re in." action="Ask us what's cooking" onAction={onReserve}/>
      <div className="menu-toolbar"><div className="category-tabs">{categories.map((cat)=>{const Icon=CATEGORY_ICONS[cat]||Utensils;return <button key={cat} className={category===cat?'active':''} onClick={()=>setCategory(cat)}><Icon size={14}/>{cat}</button>;})}</div><label className="menu-search"><Search size={16}/><input placeholder="Find your favourite..." value={search} onChange={e=>setSearch(e.target.value)}/>{search&&<button onClick={()=>setSearch('')} aria-label="Clear search"><X size={14}/></button>}</label></div>
      {filtered.length>0?<motion.div className="menu-grid" layout>{filtered.map(item=><MenuCard key={item.id} item={item} onAdd={addToCart} currency={settings.currency}/>)}</motion.div>:<div className="menu-empty"><Search size={22}/><h3>Nothing on the menu by that name.</h3><p>Try another search or choose a different category.</p><button className="text-link" onClick={()=>{setCategory('All');setSearch('');}}>Show me everything <ArrowRight size={15}/></button></div>}
    </div></section>
    <section className="story-section section-pad" id="story"><div className="shell story-grid"><div className="story-image-grid"><div className="story-photo story-photo-main"><img src={asset("/assets/images/garden-courtyard.jpg")} alt="The Courtyard outdoor garden seating" loading="lazy"/><span className="photo-label">A SLOWER KIND OF AFTERNOON</span></div><div className="story-photo story-photo-small"><img src={asset("/assets/images/restaurant-interior.jpg")} alt="Warmly lit courtyard dining space" loading="lazy"/></div><div className="story-number-note"><strong>01<span>/</span>03</strong><small>THE SPACE IS YOURS</small></div></div><div className="story-copy"><span className="eyebrow"><span className="eyebrow-dot"/> A PLACE TO LAND</span><h2>We’re here for<br/>the <em>long lunch,</em><br/>the quick catch-up<br/>and everything between.</h2><p>Some places are made for passing through. We made this one for staying a little longer. Come for the food, find your favourite corner, and let the rest of the day sort itself out.</p><div className="story-values"><div><span>01</span><strong>Made with care</strong><small>Fresh ingredients. Big heart.</small></div><div><span>02</span><strong>Room to breathe</strong><small>Open air, easy company.</small></div><div><span>03</span><strong>Always welcome</strong><small>Your table is our table.</small></div></div><button className="btn btn-dark" onClick={onReserve}>Come spend some time <ArrowUpRight size={17}/></button></div></div></section>
    <section className="featured-section section-pad"><div className="shell"><SectionHeading kicker="STRAIGHT FROM OUR KITCHEN" title="The ones that" emphasis="get talked about." detail="A few plates our regulars come back for. We think you’ll understand why." light/><div className="featured-row">{(featured.length?featured:menu.slice(0,3)).map((item,i)=><motion.div className="featured-card" key={item.id} whileHover={{y:-7}}><div className="featured-index">0{i+1} <span>/ THE HOUSE EDIT</span></div><img src={imagePath(item.image_url)} alt={item.name} loading="lazy"/><div className="featured-card-copy"><span>{item.category.toUpperCase()}</span><h3>{item.name}</h3><div><strong>{money(item.price,settings.currency)}</strong><button onClick={()=>addToCart(item)} aria-label={`Add ${item.name}`}><Plus size={17}/></button></div></div></motion.div>)}</div></div></section>
    <section className="reserve-band"><div className="reserve-band-image" style={{backgroundImage:`linear-gradient(90deg,rgba(18,39,30,.88),rgba(18,39,30,.78) 48%,rgba(18,39,30,.26)),url(${asset('/assets/images/restaurant-interior.jpg')})`}}/><div className="reserve-band-content shell"><div><span className="eyebrow eyebrow-light">SOME THINGS ARE BETTER IN PERSON</span><h2>Your people.<br/><em>Your table.</em></h2><p>Make a little time for the good things. We’ll have the table ready.</p></div><button className="btn btn-cream" onClick={onReserve}>Reserve your spot <ArrowUpRight size={17}/></button><div className="reserve-orbit"><CalendarDays size={28}/><span>LET'S<br/>GET<br/>TOGETHER</span></div></div></section>
    <section className="visit-section section-pad" id="visit"><div className="shell visit-grid"><div className="visit-copy"><span className="eyebrow">YOUR NEXT GOOD IDEA</span><h2>Find us.<br/><em>Stay awhile.</em></h2><p>We’re tucked away in Lusaka, ready when you are. Drop by for lunch, bring the whole crew, or make an evening of it.</p><div className="visit-details"><div><span className="visit-icon"><MapPin size={17}/></span><div><small>COME FIND US</small><strong>{settings.address}</strong></div></div><div><span className="visit-icon"><Phone size={17}/></span><div><small>GIVE US A RING</small><strong>{settings.phone}</strong></div></div><div><span className="visit-icon"><Clock3 size={17}/></span><div><small>WHEN WE’RE HERE</small><strong>Every day · 10:00 – 22:00</strong></div></div></div><button className="btn btn-green" onClick={onReserve}>Book your table <ArrowUpRight size={17}/></button></div><div className="visit-photo-wrap"><div className="visit-photo"><img src={asset("/assets/images/garden-courtyard.jpg")} alt="Green courtyard garden with outdoor tables" loading="lazy"/></div><div className="visit-coordinates"><span>15°23' S</span><i/><span>28°19' E</span></div><div className="visit-photo-note"><span>TAKE THE SCENIC ROUTE</span><Compass size={18}/></div></div></div></section>
    <section className="newsletter-section"><div className="shell newsletter-inner"><div><span className="eyebrow eyebrow-light">A NOTE FROM THE COURTYARD</span><h2>Good things, <em>occasionally.</em></h2><p>Little updates, new plates and reasons to come by. No noise, promise.</p></div><form className="newsletter-form" onSubmit={e=>{e.preventDefault();notify('Thanks for stopping by. Newsletter sign-up will be connected once an email service is configured.','info');}}><label><Mail size={17}/><input type="email" required placeholder="Your email address"/></label><button aria-label="Subscribe"><ArrowRight size={19}/></button></form></div></section>
  </main>;
}

function Footer({ settings, onReserve, onLogin }) {
  return <footer className="site-footer"><div className="shell footer-main"><div className="footer-brand-col"><Brand light onClick={()=>{window.location.hash='#/';window.scrollTo({top:0,behavior:'smooth'});}}/><p>Good food. Open air.<br/>Better company.</p><div className="social-links"><a href={settings.instagram||'https://instagram.com'} target="_blank" rel="noreferrer" aria-label="Instagram"><Instagram size={17}/></a><a href="https://facebook.com" target="_blank" rel="noreferrer" aria-label="Facebook"><Facebook size={17}/></a><a href={`https://wa.me/${String(settings.phone||'').replace(/\D/g,'')}`} target="_blank" rel="noreferrer" aria-label="WhatsApp"><Phone size={17}/></a></div></div><div className="footer-link-col"><span>COME ON IN</span><button onClick={()=>document.getElementById('menu')?.scrollIntoView({behavior:'smooth'})}>The menu</button><button onClick={()=>document.getElementById('story')?.scrollIntoView({behavior:'smooth'})}>Our space</button><button onClick={onReserve}>Book a table</button></div><div className="footer-link-col"><span>NEED A HAND?</span><a href={`tel:${settings.phone}`}>Call the team</a><a href={`mailto:hello@thecourtyard.example`}>Send a note</a><button onClick={onLogin}>Team sign in</button></div><div className="footer-address-col"><span>COME FIND YOURSELF HERE</span><p>{settings.address}</p><strong>{settings.phone}</strong><button onClick={onReserve}>Save me a seat <ArrowUpRight size={14}/></button></div></div><div className="shell footer-bottom"><span>© {new Date().getFullYear()} THE COURTYARD KITCHEN</span><span>MADE FOR THE MOMENTS THAT MATTER.</span><button type="button" onClick={()=>window.scrollTo({top:0,behavior:'smooth'})}>BACK TO TOP ↑</button></div></footer>;
}

function StatCard({ icon:Icon, label, value, note, tone='cream' }) {
  return <div className={`stat-card stat-${tone}`}><div className="stat-card-icon"><Icon size={19}/></div><span>{label}</span><strong>{value}</strong><small>{note}</small></div>;
}
function StatusPill({ status }) { return <span className={`status-pill status-${String(status).replaceAll('_','-')}`}>{STATUS_LABEL[status]||status}</span>; }
function EmptyState({ icon:Icon=ClipboardList, title, detail }) { return <div className="dashboard-empty"><span><Icon size={23}/></span><h3>{title}</h3><p>{detail}</p></div>; }

function Dashboard({ user, settings, updateSettings, updateMenu, notify, onLogout, onBackToSite }) {
  const isAdmin=user.role==='admin', isCustomer=user.role==='customer';
  const roleTabs = isAdmin ? [
    {id:'overview',label:'Overview',icon:LayoutDashboard},{id:'orders',label:'Orders',icon:ShoppingBag},{id:'reservations',label:'Reservations',icon:CalendarDays},{id:'menu',label:'Menu & products',icon:Utensils},{id:'team',label:'Team access',icon:Users},{id:'settings',label:'Settings',icon:Settings}
  ] : isCustomer ? [{id:'myorders',label:'My orders',icon:ShoppingBag},{id:'myreservations',label:'My reservations',icon:CalendarDays}] : [{id:'tasks',label:user.role==='cook'?'Kitchen queue':user.role==='delivery'?'Deliveries today':'Reservations today',icon:user.role==='cook'?ChefHat:user.role==='delivery'?Truck:Table2}];
  const [tab,setTab]=useState(roleTabs[0].id),[busy,setBusy]=useState(true),[error,setError]=useState('');
  const [overview,setOverview]=useState(null),[orders,setOrders]=useState([]),[reservations,setReservations]=useState([]),[items,setItems]=useState([]),[staff,setStaff]=useState([]),[tasks,setTasks]=useState([]);
  const [editing,setEditing]=useState(null),[editorOpen,setEditorOpen]=useState(false),[staffForm,setStaffForm]=useState({name:'',email:'',phone:'',role:'cook',password:''}),[staffBusy,setStaffBusy]=useState(false),[settingsForm,setSettingsForm]=useState(settings);
  const currency=settings.currency||'ZMW';
  const load=useCallback(async(quiet=false)=>{
    if(!quiet)setBusy(true);setError('');
    try {
      if(isAdmin){
        const [a,o,r,m,s,publicConfig]=await Promise.all([api('/api/admin/overview'),api('/api/admin/orders'),api('/api/admin/reservations'),api('/api/menu'),api('/api/admin/staff'),api('/api/public-settings')]);
        setOverview(a);setOrders(o.orders);setReservations(r.reservations);setItems(m.items);updateMenu(m.items);setStaff(s.staff);setSettingsForm(publicConfig);
      } else if(isCustomer){const [o,r]=await Promise.all([api('/api/customer/orders'),api('/api/customer/reservations')]);setOrders(o.orders);setReservations(r.reservations);}
      else {const data=await api('/api/staff/tasks');setTasks(data.tasks);}
    } catch(err){setError(err.message);} finally{if(!quiet)setBusy(false);}
  },[isAdmin,isCustomer,updateMenu]);
  useEffect(()=>{load();},[load]);
  useEffect(()=>{if(isAdmin&&['menu','team','settings'].includes(tab))return;const timer=window.setInterval(()=>load(true),45000);return()=>window.clearInterval(timer);},[isAdmin,load,tab]);
  const statusUpdate=async(path,status)=>{try{await api(path,{method:'PATCH',body:JSON.stringify({status})});notify('The update has been saved.','success');load();}catch(err){notify(err.message,'error');}};
  const paymentUpdate=async(id,paymentStatus)=>{try{await api(`/api/admin/orders/${id}/payment`,{method:'PATCH',body:JSON.stringify({paymentStatus})});notify('Payment status updated.','success');load();}catch(err){notify(err.message,'error');}};
  const saveMenu=async(payload)=>{try{if(editing?.id)await api(`/api/admin/menu/${editing.id}`,{method:'PUT',body:JSON.stringify(payload)});else await api('/api/admin/menu',{method:'POST',body:JSON.stringify(payload)});setEditorOpen(false);setEditing(null);notify(editing?.id?'Menu item updated.':'New item added to the menu.','success');load();}catch(err){notify(err.message,'error');}}
  const deleteMenu=async(item)=>{if(!window.confirm(`Remove ${item.name} from the menu?`))return;try{await api(`/api/admin/menu/${item.id}`,{method:'DELETE'});notify('Menu item removed.','success');load();}catch(err){notify(err.message,'error');}};
  const createStaff=async(e)=>{e.preventDefault();setStaffBusy(true);try{await api('/api/admin/staff',{method:'POST',body:JSON.stringify(staffForm)});setStaffForm({name:'',email:'',phone:'',role:'cook',password:''});notify('Team account created. Share the sign-in details securely.','success');load();}catch(err){notify(err.message,'error');}finally{setStaffBusy(false);}};
  const updateStaff=async(member,patch)=>{try{await api(`/api/admin/staff/${member.id}`,{method:'PATCH',body:JSON.stringify(patch)});notify('Team access updated.','success');load();}catch(err){notify(err.message,'error');}};
  const saveConfig=async(e)=>{e.preventDefault();try{const data=await api('/api/admin/settings',{method:'PUT',body:JSON.stringify(settingsForm)});updateSettings(data);notify('Your restaurant settings are saved.','success');}catch(err){notify(err.message,'error');}};
  const uploadSettingQr=async(file)=>{try{const data=await readFile(file);setSettingsForm(v=>({...v,paymentQr:data}));}catch(err){notify(err.message,'error');}};
  const [passwordForm,setPasswordForm]=useState({currentPassword:'',newPassword:''});
  const changePassword=async(e)=>{e.preventDefault();try{await api('/api/auth/change-password',{method:'POST',body:JSON.stringify(passwordForm)});setPasswordForm({currentPassword:'',newPassword:''});notify('Your password has been changed.','success');}catch(err){notify(err.message,'error');}};
  const todayLabel=new Intl.DateTimeFormat('en-ZM',{weekday:'long',day:'numeric',month:'long'}).format(new Date());
  return <main className="dashboard-page"><div className="dashboard-shell">
    <aside className="dashboard-sidebar"><div className="dashboard-side-brand"><Brand light onClick={onBackToSite}/><span className="workspace-label">WORKSPACE</span></div><div className="side-user"><span className="side-avatar">{user.name?.slice(0,1)?.toUpperCase()}</span><div><strong>{user.name}</strong><small>{ROLE_LABEL[user.role]}</small></div><span className="online-dot"/></div><span className="sidebar-section-label">YOUR DESK</span><nav className="dashboard-nav">{roleTabs.map(({id,label,icon:Icon})=><button key={id} className={tab===id?'active':''} onClick={()=>setTab(id)}><Icon size={17}/><span>{label}</span>{id==='orders'&&overview?.orders?.active>0&&<i>{overview.orders.active}</i>}</button>)}</nav><div className="sidebar-bottom"><button onClick={onBackToSite}><ArrowLeft size={16}/> Back to website</button><button onClick={onLogout}><LogOut size={16}/> Sign out</button><div className="sidebar-version"><span>THE COURTYARD KITCHEN</span><small>FIELD DESK · 1.0.0</small></div></div></aside>
    <section className="dashboard-content"><header className="dashboard-topbar"><div className="dashboard-breadcrumb"><span>THE COURTYARD</span><ChevronRight size={13}/><strong>{roleTabs.find(t=>t.id===tab)?.label||'Workspace'}</strong></div><div className="dashboard-top-actions"><span className="dashboard-date"><CalendarDays size={14}/>{todayLabel}</span><span className="topbar-divider"/><span className="topbar-status"><i/> ALL SYSTEMS NORMAL</span><button className="icon-button topbar-refresh" onClick={load} title="Refresh data"><RefreshCw size={16}/></button></div></header>
      <div className="dashboard-main-content">
        <div className="dashboard-page-heading"><div><span className="eyebrow">{isAdmin?'OWNER’S DESK':isCustomer?'YOUR COURTYARD':'TODAY AT THE COURTYARD'}</span><h1>{tab==='overview'?`Good ${new Date().getHours()<12?'morning':new Date().getHours()<17?'afternoon':'evening'}, ${user.name.split(' ')[0]}.`:roleTabs.find(t=>t.id===tab)?.label}</h1><p>{isAdmin?'Here’s what’s happening across your restaurant.':isCustomer?'Your good moments, all in one place.':'A live view of what needs your attention.'}</p></div>{isAdmin&&<button className="btn btn-green" onClick={()=>{setEditing(null);setEditorOpen(true);}}><Plus size={16}/> Add menu item</button>}</div>
        {error&&<div className="dashboard-error"><CircleHelp size={17}/><span>{error}</span><button onClick={load}>Try again</button></div>}
        {busy?<div className="dashboard-loading"><span className="spinner spinner-dark"/><span>Setting the table...</span></div>:<>
          {tab==='overview'&&isAdmin&&<OwnerOverview overview={overview} orders={orders} reservations={reservations} setTab={setTab} currency={currency}/>}
          {tab==='orders'&&isAdmin&&<OrdersBoard orders={orders} onStatus={(id,status)=>statusUpdate(`/api/admin/orders/${id}/status`,status)} onPayment={paymentUpdate} currency={currency} admin/>}
          {tab==='reservations'&&isAdmin&&<ReservationsBoard reservations={reservations} onStatus={(id,status)=>statusUpdate(`/api/admin/reservations/${id}/status`,status)} admin/>}
          {tab==='menu'&&isAdmin&&<MenuManager items={items} currency={currency} onEdit={(item)=>{setEditing(item);setEditorOpen(true);}} onDelete={deleteMenu} onAdd={()=>{setEditing(null);setEditorOpen(true);}}/>}
          {tab==='team'&&isAdmin&&<TeamManager staff={staff} form={staffForm} setForm={setStaffForm} onCreate={createStaff} busy={staffBusy} onUpdate={updateStaff}/>}
          {tab==='settings'&&isAdmin&&<SettingsManager form={settingsForm} setForm={setSettingsForm} onSave={saveConfig} onUploadQr={uploadSettingQr} passwordForm={passwordForm} setPasswordForm={setPasswordForm} onChangePassword={changePassword}/>}
          {tab==='tasks'&&!isAdmin&&!isCustomer&&<StaffTasks user={user} tasks={tasks} onStatus={statusUpdate} currency={currency}/>}
          {tab==='myorders'&&isCustomer&&<OrdersBoard orders={orders} currency={currency} customer/>}
          {tab==='myreservations'&&isCustomer&&<ReservationsBoard reservations={reservations} customer/>}
        </>}
      </div>
      <footer className="dashboard-footer"><span>THE COURTYARD KITCHEN · FIELD DESK</span><span>MADE TO KEEP THE GOOD THINGS MOVING.</span></footer>
    </section>
  </div>
  <AnimatePresence>{editorOpen&&<MenuEditor item={editing} onSave={saveMenu} onClose={()=>{setEditorOpen(false);setEditing(null);}}/>}</AnimatePresence>
  </main>;
}

function OwnerOverview({ overview, orders, reservations, setTab, currency }) {
  const recentOrders=orders.slice(0,4), recentReservations=reservations.slice(0,4);
  return <div className="owner-overview"><div className="overview-welcome"><div><span className="overview-spark"><Sparkles size={17}/></span><div><strong>Your day, at a glance.</strong><p>Small details. Big picture. You’ve got this.</p></div></div><span className="overview-welcome-date">{new Date().toLocaleDateString('en-ZM',{day:'2-digit',month:'short',year:'numeric'})}</span></div>
    <div className="stats-grid"><StatCard icon={ShoppingBag} label="ORDERS TODAY" value={overview?.orders?.today??0} note={`${overview?.orders?.active??0} still in the works`} tone="green"/><StatCard icon={CalendarDays} label="TABLES TODAY" value={overview?.reservations?.today??0} note={`${overview?.reservations?.pending??0} awaiting confirmation`} tone="peach"/><StatCard icon={Wallet} label="TODAY'S SALES" value={money(overview?.revenue?.amount,currency)} note="Completed orders only" tone="cream"/><StatCard icon={Utensils} label="MENU ITEMS" value={overview?.menu?.available??0} note={`${overview?.menu?.total??0} listed in total`} tone="lavender"/></div>
    <div className="overview-two-col"><section className="dashboard-panel"><div className="panel-heading"><div><span className="eyebrow">THE KITCHEN WINDOW</span><h3>Latest orders</h3></div><button className="text-link" onClick={()=>setTab('orders')}>All orders <ArrowUpRight size={14}/></button></div>{recentOrders.length?recentOrders.map(order=><div className="mini-order" key={order.id}><span className="mini-order-icon"><ShoppingBag size={16}/></span><div><strong>{order.customer_name}</strong><small>{order.items?.length||0} items · {new Date(order.created_at).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</small></div><span className="mini-order-total">{money(order.total,currency)}</span><StatusPill status={order.status}/></div>):<EmptyState icon={ShoppingBag} title="No orders just yet" detail="New orders will show up here as they come in."/>}</section>
      <section className="dashboard-panel"><div className="panel-heading"><div><span className="eyebrow">THE FLOOR PLAN</span><h3>Table requests</h3></div><button className="text-link" onClick={()=>setTab('reservations')}>See schedule <ArrowUpRight size={14}/></button></div>{recentReservations.length?recentReservations.map(res=><div className="mini-order" key={res.id}><span className="mini-order-icon mini-reservation-icon"><Users size={16}/></span><div><strong>{res.customer_name}</strong><small>{res.guests} guests · {res.reservation_date} at {String(res.reservation_time).slice(0,5)}</small></div><StatusPill status={res.status}/></div>):<EmptyState icon={CalendarDays} title="No table requests yet" detail="Your upcoming reservations will appear here."/>}</section></div>
    <div className="overview-bottom-note"><span><ShieldCheck size={17}/></span><div><strong>Your workspace is looking good.</strong><p>You have {overview?.staff?.total??0} active team accounts. Keep roles and access up to date in Team access.</p></div><button className="text-link" onClick={()=>setTab('team')}>Manage team <ArrowRight size={14}/></button></div>
  </div>;
}

function OrdersBoard({ orders, onStatus, onPayment, currency, admin=false, customer=false }) {
  const [filter,setFilter]=useState('all'),[search,setSearch]=useState('');
  const filters=customer?['all','placed','preparing','ready','completed']:['all','placed','preparing','ready','out_for_delivery','completed'];
  const filtered=orders.filter(o=>(filter==='all'||o.status===filter)&&(!search||`${o.customer_name||''} ${o.id}`.toLowerCase().includes(search.toLowerCase())));
  const actionFor=(order)=>{
    if(order.status==='placed')return ['confirmed','Confirm order'];if(order.status==='confirmed')return ['preparing','Start preparing'];if(order.status==='preparing')return ['ready','Mark ready'];if(order.status==='ready'&&order.order_type==='delivery')return ['out_for_delivery','Send with driver'];if(order.status==='out_for_delivery')return ['delivered','Mark delivered'];if(order.status==='ready')return ['completed','Complete order'];if(order.status==='delivered')return ['completed','Complete order'];return null;
  };
  return <div className="board-view"><div className="board-toolbar"><div className="board-filters">{filters.map(f=><button key={f} className={filter===f?'active':''} onClick={()=>setFilter(f)}>{f==='all'?'All orders':STATUS_LABEL[f]}</button>)}</div><label className="board-search"><Search size={15}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by name or order..."/></label></div>
    {filtered.length? <div className="orders-list">{filtered.map(order=>{const next=actionFor(order);return <article className="order-card" key={order.id}><div className="order-card-top"><div className="order-ref"><span className="order-ref-icon"><ShoppingBag size={16}/></span><div><strong>#{order.id.slice(0,8).toUpperCase()}</strong><small>{new Date(order.created_at).toLocaleString([],{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}</small></div></div><StatusPill status={order.status}/></div><div className="order-card-mid"><div><small>{customer?'ORDER TYPE':'CUSTOMER'}</small><strong>{customer?(order.order_type==='delivery'?'Delivery':'Pick-up'):order.customer_name}</strong></div>{!customer&&<div><small>FULFILMENT</small><strong>{order.order_type==='delivery'?'Delivery':'Pick-up'}</strong></div>}<div><small>ITEMS</small><strong>{(order.items||[]).reduce((sum,i)=>sum+i.quantity,0)} pieces</strong></div><div><small>TOTAL</small><strong>{money(order.total,currency)}</strong></div></div>
      <div className="order-items-preview">{(order.items||[]).map((item,i)=><span key={i}>{item.quantity} × {item.name}</span>)}</div>{!customer&&<div className="order-card-bottom"><span><Phone size={13}/>{order.customer_phone}</span>{order.delivery_address&&<span><MapPin size={13}/>{order.delivery_address}</span>}<span className={`payment-tag ${order.payment_status==='paid'?'payment-paid':''}`}><CreditCard size={13}/>{order.payment_method==='qr'?'QR payment':'Cash'} · {order.payment_status==='paid'?'paid':'pending'}</span>{admin&&order.payment_status!=='paid'&&<button className="btn btn-outline btn-xs" onClick={()=>onPayment?.(order.id,'paid')}>Mark paid <Check size={13}/></button>}{next&&<button className="btn btn-green btn-xs" onClick={()=>onStatus?.(order.id,next[0])}>{next[1]} <ArrowRight size={14}/></button>}</div>}</article>})}</div>:<EmptyState icon={ShoppingBag} title="No orders in this view" detail={search?'Try a different search term.':'When orders arrive, they’ll appear here.'}/>}
  </div>;
}

function ReservationsBoard({ reservations, onStatus, admin=false, customer=false }) {
  const [filter,setFilter]=useState(customer?'all':'today');
  const today=new Date().toLocaleDateString('en-CA');
  const filtered=reservations.filter(r=>filter==='all'||(filter==='today'&&String(r.reservation_date).slice(0,10)===today)||(filter==='upcoming'&&String(r.reservation_date).slice(0,10)>=today));
  return <div className="board-view"><div className="board-toolbar"><div className="board-filters">{(customer?['all']:['today','upcoming','all']).map(f=><button key={f} className={filter===f?'active':''} onClick={()=>setFilter(f)}>{f==='all'?'All requests':f==='today'?'Today':'Upcoming'}</button>)}</div><div className="board-caption"><CalendarDays size={15}/>{filtered.length} {filtered.length===1?'reservation':'reservations'}</div></div>
    {filtered.length?<div className="reservation-list">{filtered.map(r=><article className="reservation-card" key={r.id}><div className="reservation-date-block"><strong>{new Date(`${String(r.reservation_date).slice(0,10)}T12:00:00`).toLocaleDateString('en-ZM',{day:'2-digit'})}</strong><span>{new Date(`${String(r.reservation_date).slice(0,10)}T12:00:00`).toLocaleDateString('en-ZM',{month:'short'}).toUpperCase()}</span></div><div className="reservation-details"><div className="reservation-name-row"><h3>{r.customer_name}</h3><StatusPill status={r.status}/></div><div className="reservation-meta"><span><Clock3 size={14}/>{String(r.reservation_time).slice(0,5)}</span><span><Users size={14}/>{r.guests} guests</span>{r.occasion&&<span><Sparkles size={14}/>{r.occasion}</span>}</div>{!customer&&<div className="reservation-contact"><span><Phone size={13}/>{r.customer_phone}</span><span><Mail size={13}/>{r.customer_email}</span></div>}{r.notes&&<p className="reservation-note">“{r.notes}”</p>}</div>{admin&&!['completed','cancelled','seated'].includes(r.status)&&<div className="reservation-actions">{r.status==='requested'&&<button className="btn btn-green btn-xs" onClick={()=>onStatus(r.id,'confirmed')}>Confirm <Check size={14}/></button>}{r.status==='confirmed'&&<button className="btn btn-green btn-xs" onClick={()=>onStatus(r.id,'seated')}>Seat guests <ArrowRight size={14}/></button>}</div>}</article>)}</div>:<EmptyState icon={CalendarDays} title="No tables on the books" detail="New reservation requests will show up here. Keep the kettle on."/>}
  </div>;
}

function MenuManager({ items, currency, onEdit, onDelete, onAdd }) {
  const [filter,setFilter]=useState('All'),[search,setSearch]=useState('');
  const categories=['All',...new Set(items.map(i=>i.category))];
  const visible=items.filter(i=>(filter==='All'||i.category===filter)&&i.name.toLowerCase().includes(search.toLowerCase()));
  return <div className="menu-manager"><div className="menu-manager-toolbar"><div className="board-filters">{categories.map(cat=><button key={cat} className={filter===cat?'active':''} onClick={()=>setFilter(cat)}>{cat}</button>)}</div><label className="board-search"><Search size={15}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search menu..."/></label></div><div className="managed-menu-grid">{visible.map(item=><article className="managed-menu-card" key={item.id}><img src={imagePath(item.image_url)} alt={item.name}/><div className="managed-menu-body"><div className="managed-menu-top"><span>{item.category}</span><span className={`availability-dot ${item.available?'available':'unavailable'}`}>{item.available?'Available':'Paused'}</span></div><h3>{item.name}</h3><p>{item.description}</p><div className="managed-menu-bottom"><strong>{money(item.price,currency)}</strong><div><button onClick={()=>onEdit(item)} title="Edit item"><Pencil size={15}/></button><button onClick={()=>onDelete(item)} title="Delete item"><Trash2 size={15}/></button></div></div></div></article>)}<button className="managed-add-card" onClick={onAdd}><span><Plus size={23}/></span><strong>Add another favourite</strong><small>Upload a photo, add the details and send it to the menu.</small></button></div>
  </div>;
}

function MenuEditor({ item, onSave, onClose }) {
  const [form,setForm]=useState({name:item?.name||'',description:item?.description||'',category:item?.category||'Grill',price:item?.price??'',imageUrl:item?.image_url||'/assets/images/smash-burger.jpg',available:item?.available??true,featured:item?.featured??false});
  const [busy,setBusy]=useState(false),[error,setError]=useState('');
  const set=(k)=>(e)=>setForm(v=>({...v,[k]:e.target.type==='checkbox'?e.target.checked:e.target.value}));
  const file=async(e)=>{try{const url=await readFile(e.target.files?.[0]);setForm(v=>({...v,imageUrl:url}));}catch(err){setError(err.message);}};
  const submit=async(e)=>{e.preventDefault();setBusy(true);setError('');try{await onSave({...form,price:Number(form.price)});}catch(err){setError(err.message);}finally{setBusy(false);}};
  return <motion.div className="modal-backdrop" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onMouseDown={e=>e.target===e.currentTarget&&onClose()}><motion.div className="editor-modal" initial={{y:25,scale:.97,opacity:0}} animate={{y:0,scale:1,opacity:1}} exit={{y:15,opacity:0}}><div className="editor-header"><div><span className="eyebrow">{item?'REFINE THE RECIPE':'SOMETHING NEW FROM THE KITCHEN'}</span><h3>{item?'Edit menu item':'Add to the menu'}</h3></div><button className="icon-button" onClick={onClose}><X/></button></div><form className="editor-form" onSubmit={submit}><div className="editor-two-col"><div><label className="field"><span>Item name</span><input required minLength="2" value={form.name} onChange={set('name')} placeholder="e.g. Courtyard smash burger"/></label><label className="field"><span>Description</span><textarea rows="3" value={form.description} onChange={set('description')} placeholder="Tell people what makes it special..."/></label><div className="field-grid"><label className="field"><span>Category</span><select value={form.category} onChange={set('category')}>{['Grill','Kitchen','Sides','Platters','Drinks','Desserts'].map(c=><option key={c}>{c}</option>)}</select></label><label className="field"><span>Price (ZMW)</span><input required type="number" min="0" step="1" value={form.price} onChange={set('price')} placeholder="0"/></label></div><label className="check-field"><input type="checkbox" checked={form.featured} onChange={set('featured')}/><span><strong>House favourite</strong><small>Feature this item in the highlights.</small></span></label><label className="check-field"><input type="checkbox" checked={form.available} onChange={set('available')}/><span><strong>Available to order</strong><small>Turn off when it’s sold out.</small></span></label></div><div className="editor-image-col"><div className="editor-image-preview"><img src={imagePath(form.imageUrl)} alt="Menu item preview"/></div><label className="upload-image-button"><ImagePlus size={17}/><span>Upload a food photo</span><input type="file" accept="image/png,image/jpeg,image/webp" onChange={file}/></label><small>PNG, JPG or WebP · up to 5 MB</small></div></div>{error&&<p className="form-error"><CircleHelp size={15}/>{error}</p>}<div className="editor-actions"><button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button><button className="btn btn-green" disabled={busy}>{busy?<span className="spinner"/>:<>{item?'Save changes':'Add to menu'} <ArrowUpRight size={16}/></>}</button></div></form></motion.div></motion.div>;
}

function TeamManager({ staff, form, setForm, onCreate, busy, onUpdate }) {
  const set=(k)=>(e)=>setForm(v=>({...v,[k]:e.target.value}));
  return <div className="team-manager"><div className="team-intro-card"><span className="team-intro-icon"><Users size={23}/></span><div><h3>Good people make good places.</h3><p>Create a separate sign-in for each role. Team members only see the work that belongs to them.</p></div><span className="team-count-bubble">{staff.filter(s=>s.active).length}<small>ACTIVE</small></span></div><div className="team-manager-grid"><section className="dashboard-panel create-staff-panel"><div className="panel-heading"><div><span className="eyebrow">ADD TO THE CREW</span><h3>Create team access</h3></div><span className="round-icon"><UserPlus/></span></div><form onSubmit={onCreate} className="staff-create-form"><label className="field"><span>Full name</span><input required minLength="2" value={form.name} onChange={set('name')} placeholder="Team member name"/></label><label className="field"><span>Email address</span><input required type="email" value={form.email} onChange={set('email')} placeholder="name@yourrestaurant.com"/></label><label className="field"><span>Phone <small>OPTIONAL</small></span><input value={form.phone} onChange={set('phone')} placeholder="+260 ..."/></label><label className="field"><span>Workspace role</span><select value={form.role} onChange={set('role')}><option value="cook">Cook / kitchen</option><option value="delivery">Delivery person</option><option value="waiter">Table reservations / waiter</option><option value="admin">Store owner / admin</option></select></label><label className="field"><span>Temporary password</span><input required minLength="8" type="password" value={form.password} onChange={set('password')} placeholder="At least 8 characters"/></label><button className="btn btn-green btn-block" disabled={busy}>{busy?<span className="spinner"/>:<>Create team account <Plus size={16}/></>}</button><p className="form-footnote">Share credentials privately. Team members can change their password after signing in.</p></form></section><section className="dashboard-panel team-list-panel"><div className="panel-heading"><div><span className="eyebrow">THE PEOPLE BEHIND IT</span><h3>Team members</h3></div><span className="team-list-count">{staff.length} accounts</span></div><div className="team-list">{staff.map(member=><div className="team-row" key={member.id}><span className={`team-avatar team-${member.role}`}>{member.name.slice(0,1).toUpperCase()}</span><div className="team-row-copy"><strong>{member.name}</strong><small>{member.email}</small></div><span className={`role-chip role-${member.role}`}>{ROLE_LABEL[member.role]}</span><button className={`team-access-toggle ${member.active?'enabled':''}`} onClick={()=>onUpdate(member,{active:!member.active})} title={member.active?'Disable account':'Enable account'}><i/></button></div>)}</div></section></div></div>;
}

function SettingsManager({ form, setForm, onSave, onUploadQr, passwordForm, setPasswordForm, onChangePassword }) {
  const set=(k)=>(e)=>setForm(v=>({...v,[k]:e.target.value}));
  return <div className="settings-manager"><form className="dashboard-panel settings-form" onSubmit={onSave}><div className="panel-heading"><div><span className="eyebrow">MAKE IT YOURS</span><h3>Restaurant details</h3><p>These details appear on the public site and customer checkout.</p></div><span className="round-icon"><Settings/></span></div><div className="settings-two-col"><label className="field"><span>Restaurant name</span><input value={form.restaurantName||''} onChange={set('restaurantName')} required/></label><label className="field"><span>Tagline</span><input value={form.tagline||''} onChange={set('tagline')}/></label><label className="field"><span>Phone number</span><input value={form.phone||''} onChange={set('phone')}/></label><label className="field"><span>Public address</span><input value={form.address||''} onChange={set('address')}/></label><label className="field"><span>Currency</span><select value={form.currency||'ZMW'} onChange={set('currency')}><option value="ZMW">Zambian Kwacha (ZMW)</option><option value="USD">US Dollar (USD)</option><option value="ZAR">South African Rand (ZAR)</option><option value="GBP">Pound Sterling (GBP)</option></select></label><label className="field"><span>Delivery fee</span><input type="number" min="0" value={form.deliveryFee??0} onChange={set('deliveryFee')}/></label><label className="field"><span>Instagram URL <small>OPTIONAL</small></span><input value={form.instagram||''} onChange={set('instagram')} placeholder="https://instagram.com/yourpage"/></label><label className="field"><span>WhatsApp number <small>OPTIONAL</small></span><input value={form.whatsapp||''} onChange={set('whatsapp')} placeholder="26097..."/></label></div><button className="btn btn-green">Save restaurant details <Check size={16}/></button></form>
    <div className="settings-payment-grid"><section className="dashboard-panel qr-settings-panel"><div className="panel-heading"><div><span className="eyebrow">GET PAID YOUR WAY</span><h3>QR payment code</h3><p>Upload the QR code customers should scan at checkout.</p></div><span className="round-icon"><QrCode/></span></div><div className="qr-upload-area">{form.paymentQr?<img src={form.paymentQr} alt="Uploaded payment QR code"/>:<div className="qr-placeholder"><QrCode size={36}/><span>YOUR PAYMENT QR</span></div>}<label className="upload-image-button"><ImagePlus size={16}/> Upload QR image<input type="file" accept="image/png,image/jpeg,image/webp" onChange={e=>onUploadQr(e.target.files?.[0])}/></label>{form.paymentQr&&<button className="text-link remove-qr" type="button" onClick={()=>setForm(v=>({...v,paymentQr:''}))}>Remove QR code</button>}</div><label className="field"><span>Payment instructions</span><textarea rows="3" value={form.paymentInstructions||''} onChange={set('paymentInstructions')}/></label><p className="form-footnote">QR images are saved in the database so they remain available after a Render restart.</p></section>
      <section className="dashboard-panel password-settings-panel"><div className="panel-heading"><div><span className="eyebrow">KEEP YOUR ACCESS SAFE</span><h3>Change your password</h3><p>Replace the starter password with something private.</p></div><span className="round-icon"><ShieldCheck/></span></div><form className="password-form" onSubmit={onChangePassword}><label className="field"><span>Current password</span><input required type="password" value={passwordForm.currentPassword} onChange={e=>setPasswordForm(v=>({...v,currentPassword:e.target.value}))}/></label><label className="field"><span>New password</span><input required type="password" minLength="8" value={passwordForm.newPassword} onChange={e=>setPasswordForm(v=>({...v,newPassword:e.target.value}))} placeholder="8 characters or more"/></label><button className="btn btn-outline btn-block">Update password <ArrowUpRight size={16}/></button></form></section></div>
  </div>;
}

function StaffTasks({ user, tasks, onStatus, currency }) {
  if(user.role==='cook')return <div className="staff-task-view"><div className="staff-shift-banner"><span className="staff-shift-icon"><ChefHat size={24}/></span><div><span className="eyebrow">KITCHEN DISPLAY</span><h3>Let’s get those plates moving.</h3><p>New and active tickets appear here. Update each one as it moves through the kitchen.</p></div><span className="live-indicator"><i/> LIVE QUEUE</span></div>{tasks.length?<div className="staff-ticket-grid">{tasks.map(order=><article className="staff-ticket" key={order.id}><div className="ticket-top"><span>ORDER #{order.id.slice(0,6).toUpperCase()}</span><StatusPill status={order.status}/></div><h3>{order.customer_name}</h3><small>{new Date(order.created_at).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})} · {order.items?.length||0} lines</small><div className="ticket-items">{(order.items||[]).map((it,i)=><div key={i}><span>{it.quantity}×</span>{it.name}</div>)}</div>{order.notes&&<p className="ticket-note">Note: {order.notes}</p>}<div className="ticket-actions">{order.status==='placed'&&<button className="btn btn-green btn-block" onClick={()=>onStatus(`/api/admin/orders/${order.id}/status`,'confirmed')}>Accept ticket <Check size={15}/></button>}{order.status==='confirmed'&&<button className="btn btn-green btn-block" onClick={()=>onStatus(`/api/admin/orders/${order.id}/status`,'preparing')}>Start preparing <Flame size={15}/></button>}{order.status==='preparing'&&<button className="btn btn-copper btn-block" onClick={()=>onStatus(`/api/admin/orders/${order.id}/status`,'ready')}>Ready for collection <CheckCircle2 size={15}/></button>}</div></article>)}</div>:<EmptyState icon={ChefHat} title="The pass is clear." detail="No active tickets right now. New orders will land here as soon as they’re placed."/>}</div>;
  if(user.role==='delivery')return <div className="staff-task-view"><div className="staff-shift-banner delivery-banner"><span className="staff-shift-icon"><Truck size={24}/></span><div><span className="eyebrow">DELIVERY RUN</span><h3>Good things are going places.</h3><p>Ready orders assigned for delivery appear here. Keep the customer in the loop.</p></div><span className="live-indicator"><i/> LIVE QUEUE</span></div>{tasks.length?<div className="delivery-list">{tasks.map(order=><article className="delivery-card" key={order.id}><div className="delivery-top"><span className="delivery-order-no">#{order.id.slice(0,8).toUpperCase()}</span><StatusPill status={order.status}/></div><div className="delivery-customer"><span className="delivery-avatar"><User size={17}/></span><div><strong>{order.customer_name}</strong><small>{order.customer_phone}</small></div><strong className="delivery-value">{money(order.total,currency)}</strong></div><div className="delivery-address"><MapPin size={16}/><p>{order.delivery_address||'Address not provided'}</p></div><div className="delivery-items">{(order.items||[]).map((it,i)=><span key={i}>{it.quantity} × {it.name}</span>)}</div>{order.status==='ready'?<button className="btn btn-green btn-block" onClick={()=>onStatus(`/api/admin/orders/${order.id}/status`,'out_for_delivery')}>I’ve picked this up <Truck size={16}/></button>:<button className="btn btn-copper btn-block" onClick={()=>onStatus(`/api/admin/orders/${order.id}/status`,'delivered')}>Mark as delivered <CheckCircle2 size={16}/></button>}</article>)}</div>:<EmptyState icon={Truck} title="No deliveries waiting." detail="When the kitchen marks an order ready for delivery, it will appear here."/>}</div>;
  return <div className="staff-task-view"><div className="staff-shift-banner waiter-banner"><span className="staff-shift-icon"><Table2 size={24}/></span><div><span className="eyebrow">FRONT OF HOUSE</span><h3>Every good visit starts with a warm welcome.</h3><p>Today’s table requests, guest counts and booking notes are all here.</p></div><span className="live-indicator"><i/> TODAY</span></div>{tasks.length?<div className="staff-reservation-list">{tasks.map(r=><article className="staff-reservation-card" key={r.id}><div className="staff-res-time"><strong>{String(r.reservation_time).slice(0,5)}</strong><span>{r.guests} GUESTS</span></div><div className="staff-res-copy"><h3>{r.customer_name}</h3><p><Phone size={13}/>{r.customer_phone}</p>{r.occasion&&<span className="occasion-label"><Sparkles size={13}/>{r.occasion}</span>}{r.notes&&<small>{r.notes}</small>}</div><StatusPill status={r.status}/><div className="staff-res-actions">{r.status==='requested'&&<button className="btn btn-green btn-xs" onClick={()=>onStatus(`/api/admin/reservations/${r.id}/status`,'confirmed')}>Confirm <Check size={13}/></button>}{r.status==='confirmed'&&<button className="btn btn-copper btn-xs" onClick={()=>onStatus(`/api/admin/reservations/${r.id}/status`,'seated')}>Seat guests <ArrowRight size={13}/></button>}{r.status==='seated'&&<button className="btn btn-outline btn-xs" onClick={()=>onStatus(`/api/admin/reservations/${r.id}/status`,'completed')}>Complete <Check size={13}/></button>}</div></article>)}</div>:<EmptyState icon={CalendarDays} title="No reservations for today." detail="Enjoy the breathing room. New table requests will appear here."/>}</div>;
}

function CustomerHome({ orders, reservations, user, notify }) {
  return <div className="customer-home"><div className="customer-welcome-card"><span className="customer-welcome-flower">✳</span><span className="eyebrow eyebrow-light">A LITTLE SPACE WITH YOUR NAME ON IT</span><h2>Good to have<br/><em>you here, {user.name.split(' ')[0]}.</em></h2><p>Keep an eye on the food, the plans and all the good things in between.</p></div><div className="customer-summary-grid"><div><span className="eyebrow">YOUR ORDERS</span><strong>{orders.length}</strong><small>Placed with us</small></div><div><span className="eyebrow">YOUR TABLES</span><strong>{reservations.length}</strong><small>Reservation requests</small></div><div><span className="eyebrow">YOUR STATUS</span><strong>Welcome</strong><small>Always a seat for you</small></div></div></div>;
}

function App() {
  const navigate=useNavigate(),location=useLocation();
  const [user,setUser]=useState(()=>{try{return JSON.parse(localStorage.getItem('courtyard-user')||'null');}catch{return null;}});
  const [menu,setMenu]=useState([]),[settings,setSettings]=useState(DEFAULT_SETTINGS),[cart,setCart]=useState(()=>{try{return JSON.parse(localStorage.getItem('courtyard-cart')||'[]');}catch{return [];}});
  const [authOpen,setAuthOpen]=useState(false),[cartOpen,setCartOpen]=useState(false),[reserveOpen,setReserveOpen]=useState(false),[toast,setToast]=useState(null);
  const notify=useCallback((message,type='success')=>{setToast({message,type});window.clearTimeout(window.__courtyardToastTimer);window.__courtyardToastTimer=window.setTimeout(()=>setToast(null),4500);},[]);
  useEffect(()=>{api('/api/menu').then(d=>setMenu(d.items||[])).catch(err=>console.warn(err.message));api('/api/public-settings').then(d=>setSettings(v=>({...v,...d}))).catch(()=>{});},[]);
  useEffect(()=>{localStorage.setItem('courtyard-cart',JSON.stringify(cart));},[cart]);
  useEffect(()=>{const expired=()=>{setUser(null);notify('Your session has expired. Please sign in again.','info');navigate('/');};window.addEventListener('courtyard:session-expired',expired);return()=>window.removeEventListener('courtyard:session-expired',expired);},[navigate,notify]);
  useEffect(()=>{if(location.pathname==='/dashboard'&&!user)navigate('/');},[location.pathname,user,navigate]);
  const addToCart=(item)=>{setCart(items=>{const exists=items.find(i=>i.id===item.id);return exists?items.map(i=>i.id===item.id?{...i,quantity:Math.min(20,i.quantity+1)}:i):[...items,{...item,quantity:1}];});notify(`${item.name} added to your basket.`,'success');};
  const cartCount=cart.reduce((sum,item)=>sum+item.quantity,0);
  const successLogin=(data)=>{localStorage.setItem('courtyard-token',data.token);localStorage.setItem('courtyard-user',JSON.stringify(data.user));setUser(data.user);navigate('/dashboard');};
  const logout=()=>{localStorage.removeItem('courtyard-token');localStorage.removeItem('courtyard-user');setUser(null);navigate('/');notify('You’ve signed out. See you again soon.','success');};
  const updateSettings=(data)=>setSettings(v=>({...v,...data}));
  const isDashboard=location.pathname==='/dashboard';
  return <>
    {!isDashboard&&<><Header user={user} cartCount={cartCount} onLogin={()=>setAuthOpen(true)} onCart={()=>setCartOpen(true)} onLogout={logout} onDashboard={()=>navigate('/dashboard')} onReserve={()=>setReserveOpen(true)}/><Home menu={menu} settings={settings} addToCart={addToCart} onReserve={()=>setReserveOpen(true)} onCart={()=>setCartOpen(true)} user={user} onLogin={()=>setAuthOpen(true)} notify={notify}/><Footer settings={settings} onReserve={()=>setReserveOpen(true)} onLogin={()=>setAuthOpen(true)}/><MusicDock notify={notify}/></>}
    {isDashboard&&user&&<Dashboard user={user} settings={settings} updateSettings={updateSettings} updateMenu={setMenu} notify={notify} onLogout={logout} onBackToSite={()=>navigate('/')}/>}
    <Toast toast={toast} onClose={()=>setToast(null)}/>
    <AnimatePresence>{authOpen&&<AuthModal onClose={()=>setAuthOpen(false)} onSuccess={successLogin} notify={notify}/>}</AnimatePresence>
    <AnimatePresence>{reserveOpen&&<ReservationModal onClose={()=>setReserveOpen(false)} settings={settings} user={user} notify={notify}/>}</AnimatePresence>
    <CartDrawer open={cartOpen} onClose={()=>setCartOpen(false)} cart={cart} setCart={setCart} menu={menu} user={user} settings={settings} notify={notify}/>
  </>;
}

export default App;
