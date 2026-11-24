import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'node:crypto';
import { pool, query } from './db.js';

const app = express();
const PORT = Number(process.env.PORT || 4000);
const JWT_SECRET = process.env.JWT_SECRET || 'local-development-secret-change-me';
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173').split(',').map((item) => item.trim());

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin(origin, callback) {
  if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin) || /\.vercel\.app$/.test(new URL(origin).hostname) || /\.github\.io$/.test(new URL(origin).hostname)) return callback(null, true);
  return callback(new Error('Origin is not allowed by CORS'));
}, credentials: false }));
app.use(express.json({ limit: '12mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use('/api/auth/login', rateLimit({ windowMs: 15 * 60 * 1000, limit: 12, standardHeaders: true, legacyHeaders: false, message: { error: 'Too many sign-in attempts. Please try again in a few minutes.' } }));

const asyncRoute = (handler) => (req,res,next) => Promise.resolve(handler(req,res,next)).catch(next);
const clean = (value, max = 500) => String(value ?? '').trim().slice(0,max);
const isEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
const money = (value) => Math.round(Number(value) * 100) / 100;
const publicUser = (row) => ({ id: row.id, name: row.name, email: row.email, phone: row.phone, role: row.role });

function signToken(user) {
  return jwt.sign({ sub: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
}
const authenticate = asyncRoute(async (req,res,next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) return res.status(401).json({ error: 'Please sign in to continue.' });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const result = await query('SELECT id,name,email,phone,role,active FROM users WHERE id=$1', [payload.sub]);
    const user = result.rows[0];
    if (!user || !user.active) return res.status(401).json({ error: 'This account is unavailable.' });
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Your session has expired. Please sign in again.' });
  }
});
const allow = (...roles) => (req,res,next) => {
  if (!req.user || !roles.includes(req.user.role)) return res.status(403).json({ error: 'You do not have permission to access this section.' });
  next();
};
const staffOrAdmin = allow('admin','cook','delivery','waiter');

async function getSetting(key, fallback = null) {
  const result = await query('SELECT value FROM settings WHERE key=$1', [key]);
  return result.rows[0]?.value ?? fallback;
}
async function getSettings(keys = null) {
  const result = await query('SELECT key,value FROM settings');
  const all = Object.fromEntries(result.rows.map(({key,value}) => [key,value]));
  return keys ? Object.fromEntries(keys.filter((key) => key in all).map((key) => [key,all[key]])) : all;
}
function validateImage(value) {
  if (!value) return true;
  return typeof value === 'string' && (value.startsWith('/assets/') || value.startsWith('https://') || /^data:image\/(png|jpeg|jpg|webp);base64,/.test(value)) && value.length <= 9_000_000;
}

app.get('/api/health', (req,res) => res.json({ status: 'ok', service: 'courtyard-kitchen-api', timestamp: new Date().toISOString() }));

app.get('/api/menu', asyncRoute(async (req,res) => {
  const { rows } = await query(`SELECT id,name,description,category,price::float AS price,image_url,available,featured FROM menu_items ORDER BY featured DESC, category, name`);
  res.json({ items: rows });
}));
app.get('/api/public-settings', asyncRoute(async (req,res) => {
  res.json(await getSettings(['restaurantName','tagline','phone','address','currency','deliveryFee','paymentQr','paymentInstructions','instagram','whatsapp']));
}));

app.post('/api/auth/register', asyncRoute(async (req,res) => {
  const name = clean(req.body.name,100), email = clean(req.body.email,160).toLowerCase(), phone = clean(req.body.phone,40), password = String(req.body.password || '');
  if (name.length < 2 || !isEmail(email) || password.length < 8) return res.status(400).json({ error: 'Enter your name, a valid email and a password with at least 8 characters.' });
  const exists = await query('SELECT id FROM users WHERE email=$1',[email]);
  if (exists.rowCount) return res.status(409).json({ error: 'An account with this email already exists.' });
  const user = { id: randomUUID(), name, email, phone, role: 'customer' };
  const hash = await bcrypt.hash(password,12);
  await query('INSERT INTO users (id,name,email,phone,password_hash,role) VALUES ($1,$2,$3,$4,$5,$6)',[user.id,name,email,phone,hash,'customer']);
  res.status(201).json({ token: signToken(user), user });
}));
app.post('/api/auth/login', asyncRoute(async (req,res) => {
  const email = clean(req.body.email,160).toLowerCase(), password = String(req.body.password || '');
  if (!isEmail(email) || !password) return res.status(400).json({ error: 'Enter your email and password.' });
  const result = await query('SELECT * FROM users WHERE email=$1',[email]);
  const row = result.rows[0];
  if (!row || !row.active || !(await bcrypt.compare(password,row.password_hash))) return res.status(401).json({ error: 'That email and password do not match.' });
  const user = publicUser(row);
  res.json({ token: signToken(user), user });
}));
app.get('/api/auth/me', authenticate, (req,res) => res.json({ user: publicUser(req.user) }));
app.post('/api/auth/change-password', authenticate, asyncRoute(async (req,res) => {
  const current = String(req.body.currentPassword || ''), next = String(req.body.newPassword || '');
  if (next.length < 8) return res.status(400).json({ error: 'Your new password must be at least 8 characters.' });
  const r = await query('SELECT password_hash FROM users WHERE id=$1',[req.user.id]);
  if (!(await bcrypt.compare(current,r.rows[0].password_hash))) return res.status(400).json({ error: 'Your current password is incorrect.' });
  await query('UPDATE users SET password_hash=$1 WHERE id=$2',[await bcrypt.hash(next,12),req.user.id]);
  res.json({ message: 'Password updated.' });
}));

app.post('/api/orders', asyncRoute(async (req,res) => {
  const body = req.body || {};
  const name = clean(body.customerName,100), email = clean(body.customerEmail,160).toLowerCase(), phone = clean(body.customerPhone,40);
  const orderType = body.orderType === 'pickup' ? 'pickup' : 'delivery';
  const address = clean(body.deliveryAddress,300), paymentMethod = ['qr','cash'].includes(body.paymentMethod) ? body.paymentMethod : 'cash';
  if (name.length < 2 || !isEmail(email) || phone.length < 5) return res.status(400).json({ error: 'Add your name, a valid email and phone number.' });
  if (orderType === 'delivery' && address.length < 5) return res.status(400).json({ error: 'Please enter a delivery address.' });
  if (!Array.isArray(body.items) || body.items.length < 1 || body.items.length > 25) return res.status(400).json({ error: 'Your basket is empty or contains too many items.' });
  const ids = [...new Set(body.items.map((item) => clean(item.id,80)))];
  const found = await query('SELECT id,name,price::float AS price,image_url,available FROM menu_items WHERE id = ANY($1::text[])', [ids]);
  const menuById = new Map(found.rows.map((item) => [item.id,item]));
  const orderItems = [];
  for (const item of body.items) {
    const record = menuById.get(clean(item.id,80));
    const quantity = Math.max(1,Math.min(20,Math.floor(Number(item.quantity) || 1)));
    if (!record || !record.available) return res.status(400).json({ error: 'One of the items in your basket is no longer available. Refresh the menu and try again.' });
    orderItems.push({ id: record.id, name: record.name, price: record.price, quantity, image_url: record.image_url });
  }
  const subtotal = money(orderItems.reduce((sum,item) => sum + item.price * item.quantity,0));
  const deliveryFee = orderType === 'delivery' ? Number(await getSetting('deliveryFee',25)) : 0;
  const total = money(subtotal + deliveryFee);
  const order = { id: randomUUID(), name, email, phone, orderType, address, items: orderItems, subtotal, deliveryFee, total, paymentMethod, notes: clean(body.notes,500) };
  await query(`INSERT INTO orders (id,customer_name,customer_email,customer_phone,order_type,delivery_address,items,subtotal,delivery_fee,total,payment_method,notes)
    VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,$8,$9,$10,$11,$12)`,[order.id,name,email,phone,orderType,address,JSON.stringify(orderItems),subtotal,deliveryFee,total,paymentMethod,order.notes]);
  res.status(201).json({ order: { id: order.id, customerName:name, orderType, items:orderItems, subtotal, deliveryFee, total, paymentMethod, status:'placed', createdAt:new Date().toISOString() }, message:'Order received. The kitchen has your ticket.' });
}));
app.post('/api/reservations', asyncRoute(async (req,res) => {
  const b = req.body || {};
  const name = clean(b.customerName,100), email = clean(b.customerEmail,160).toLowerCase(), phone = clean(b.customerPhone,40);
  const date = clean(b.date,10), time = clean(b.time,5), guests = Math.floor(Number(b.guests));
  if (name.length < 2 || !isEmail(email) || phone.length < 5 || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time) || guests < 1 || guests > 20) return res.status(400).json({ error:'Complete the required details. Reservations support 1–20 guests.' });
  const requestedAt = new Date(`${date}T${time}:00+02:00`);
  if (Number.isNaN(requestedAt.getTime()) || requestedAt.getTime() < Date.now() - 60_000) return res.status(400).json({ error:'Choose a future date and time.' });
  const id = randomUUID();
  await query(`INSERT INTO reservations (id,customer_name,customer_email,customer_phone,reservation_date,reservation_time,guests,occasion,notes)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,[id,name,email,phone,date,time,guests,clean(b.occasion,80),clean(b.notes,500)]);
  res.status(201).json({ reservation:{ id, customerName:name, date, time, guests, status:'requested' }, message:'Your table request is in. We will confirm it shortly.' });
}));

app.get('/api/customer/orders', authenticate, asyncRoute(async (req,res) => {
  const { rows } = await query(`SELECT id,order_type,items,subtotal::float AS subtotal,delivery_fee::float AS delivery_fee,total::float AS total,payment_method,payment_status,status,created_at FROM orders WHERE customer_email=$1 ORDER BY created_at DESC LIMIT 30`,[req.user.email]);
  res.json({ orders: rows });
}));
app.get('/api/customer/reservations', authenticate, asyncRoute(async (req,res) => {
  const { rows } = await query(`SELECT id,reservation_date,reservation_time,guests,occasion,status FROM reservations WHERE customer_email=$1 ORDER BY reservation_date DESC,reservation_time DESC LIMIT 30`,[req.user.email]);
  res.json({ reservations: rows });
}));

app.get('/api/staff/tasks', authenticate, staffOrAdmin, asyncRoute(async (req,res) => {
  if (req.user.role === 'waiter') {
    const { rows } = await query(`SELECT id,customer_name,customer_phone,reservation_date::text,reservation_time::text,guests,occasion,notes,status FROM reservations WHERE reservation_date=(NOW() AT TIME ZONE 'Africa/Lusaka')::date ORDER BY reservation_time`);
    return res.json({ tasks: rows, type:'reservations' });
  }
  if (req.user.role === 'delivery') {
    const { rows } = await query(`SELECT id,customer_name,customer_phone,delivery_address,items,total::float AS total,status,created_at FROM orders WHERE order_type='delivery' AND status IN ('ready','out_for_delivery') AND (created_at AT TIME ZONE 'Africa/Lusaka')::date=(NOW() AT TIME ZONE 'Africa/Lusaka')::date ORDER BY created_at`);
    return res.json({ tasks: rows, type:'deliveries' });
  }
  const { rows } = await query(`SELECT id,customer_name,customer_phone,items,status,notes,created_at FROM orders WHERE status IN ('placed','confirmed','preparing') ORDER BY created_at`);
  res.json({ tasks: rows, type:'kitchen' });
}));

app.get('/api/admin/overview', authenticate, allow('admin'), asyncRoute(async (req,res) => {
  const [orders,reservations,revenue,menu,staff] = await Promise.all([
    query(`SELECT COUNT(*)::int AS total,COUNT(*) FILTER (WHERE status IN ('placed','confirmed','preparing'))::int AS active,COUNT(*) FILTER (WHERE (created_at AT TIME ZONE 'Africa/Lusaka')::date=(NOW() AT TIME ZONE 'Africa/Lusaka')::date)::int AS today FROM orders`),
    query(`SELECT COUNT(*)::int AS today,COUNT(*) FILTER (WHERE status='requested')::int AS pending FROM reservations WHERE reservation_date=(NOW() AT TIME ZONE 'Africa/Lusaka')::date`),
    query(`SELECT COALESCE(SUM(total),0)::float AS amount FROM orders WHERE status IN ('completed','delivered') AND (created_at AT TIME ZONE 'Africa/Lusaka')::date=(NOW() AT TIME ZONE 'Africa/Lusaka')::date`),
    query(`SELECT COUNT(*)::int AS total,COUNT(*) FILTER (WHERE available)::int AS available FROM menu_items`),
    query(`SELECT COUNT(*)::int AS total FROM users WHERE role <> 'customer' AND active=true`)
  ]);
  res.json({ orders:orders.rows[0], reservations:reservations.rows[0], revenue:revenue.rows[0], menu:menu.rows[0], staff:staff.rows[0] });
}));
app.get('/api/admin/orders', authenticate, allow('admin'), asyncRoute(async (req,res) => {
  const { rows } = await query(`SELECT id,customer_name,customer_email,customer_phone,order_type,delivery_address,items,subtotal::float AS subtotal,delivery_fee::float AS delivery_fee,total::float AS total,payment_method,payment_status,status,notes,created_at FROM orders ORDER BY created_at DESC LIMIT 150`);
  res.json({ orders: rows });
}));
app.patch('/api/admin/orders/:id/status', authenticate, allow('admin','cook','delivery'), asyncRoute(async (req,res) => {
  const status = clean(req.body.status,40);
  const allowed = {
    admin:['placed','confirmed','preparing','ready','out_for_delivery','delivered','completed','cancelled'],
    cook:['confirmed','preparing','ready'],
    delivery:['out_for_delivery','delivered']
  }[req.user.role] || [];
  if (!allowed.includes(status)) return res.status(400).json({ error:'That status change is not available for your role.' });
  const existing = await query('SELECT order_type FROM orders WHERE id=$1',[req.params.id]);
  if (!existing.rows[0]) return res.status(404).json({ error:'Order not found.' });
  if (req.user.role === 'delivery' && existing.rows[0].order_type !== 'delivery') return res.status(403).json({ error:'Delivery accounts can only update delivery orders.' });
  const { rows } = await query(`UPDATE orders SET status=$1,updated_at=NOW() WHERE id=$2 RETURNING id,status`,[status,req.params.id]);
  res.json({ order:rows[0] });
}));
app.patch('/api/admin/orders/:id/payment', authenticate, allow('admin'), asyncRoute(async (req,res) => {
  const paymentStatus = clean(req.body.paymentStatus,20);
  if (!['pending','paid','failed'].includes(paymentStatus)) return res.status(400).json({ error:'Choose pending, paid or failed.' });
  const { rows } = await query(`UPDATE orders SET payment_status=$1,updated_at=NOW() WHERE id=$2 RETURNING id,payment_status`,[paymentStatus,req.params.id]);
  if (!rows[0]) return res.status(404).json({ error:'Order not found.' });
  res.json({ order:rows[0] });
}));

app.get('/api/admin/reservations', authenticate, allow('admin','waiter'), asyncRoute(async (req,res) => {
  const { rows } = await query(`SELECT id,customer_name,customer_email,customer_phone,reservation_date::text,reservation_time::text,guests,occasion,notes,status,created_at FROM reservations ORDER BY reservation_date DESC,reservation_time LIMIT 150`);
  res.json({ reservations:rows });
}));
app.patch('/api/admin/reservations/:id/status', authenticate, allow('admin','waiter'), asyncRoute(async (req,res) => {
  const status = clean(req.body.status,40);
  if (!['confirmed','seated','completed','cancelled','requested'].includes(status)) return res.status(400).json({ error:'Invalid reservation status.' });
  const { rows } = await query(`UPDATE reservations SET status=$1,updated_at=NOW() WHERE id=$2 RETURNING id,status`,[status,req.params.id]);
  if (!rows[0]) return res.status(404).json({ error:'Reservation not found.' });
  res.json({ reservation:rows[0] });
}));

app.post('/api/admin/menu', authenticate, allow('admin'), asyncRoute(async (req,res) => {
  const b = req.body || {}, name=clean(b.name,120), description=clean(b.description,500), category=clean(b.category,60) || 'Kitchen', price=Number(b.price);
  if (name.length < 2 || !Number.isFinite(price) || price < 0 || !validateImage(b.imageUrl)) return res.status(400).json({ error:'Add a name, valid price and supported image.' });
  const item = { id:randomUUID(),name,description,category,price,image_url:clean(b.imageUrl,8_900_000),available:b.available !== false,featured:Boolean(b.featured) };
  await query(`INSERT INTO menu_items (id,name,description,category,price,image_url,available,featured) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,[item.id,item.name,item.description,item.category,item.price,item.image_url,item.available,item.featured]);
  res.status(201).json({ item });
}));
app.put('/api/admin/menu/:id', authenticate, allow('admin'), asyncRoute(async (req,res) => {
  const b = req.body || {}, name=clean(b.name,120), description=clean(b.description,500), category=clean(b.category,60) || 'Kitchen', price=Number(b.price);
  if (name.length < 2 || !Number.isFinite(price) || price < 0 || !validateImage(b.imageUrl)) return res.status(400).json({ error:'Add a name, valid price and supported image.' });
  const { rows } = await query(`UPDATE menu_items SET name=$1,description=$2,category=$3,price=$4,image_url=$5,available=$6,featured=$7,updated_at=NOW() WHERE id=$8 RETURNING id,name,description,category,price::float AS price,image_url,available,featured`,[name,description,category,price,clean(b.imageUrl,8_900_000),b.available !== false,Boolean(b.featured),req.params.id]);
  if (!rows[0]) return res.status(404).json({ error:'Menu item not found.' });
  res.json({ item:rows[0] });
}));
app.delete('/api/admin/menu/:id', authenticate, allow('admin'), asyncRoute(async (req,res) => {
  const result = await query('DELETE FROM menu_items WHERE id=$1',[req.params.id]);
  if (!result.rowCount) return res.status(404).json({ error:'Menu item not found.' });
  res.status(204).end();
}));
app.get('/api/admin/staff', authenticate, allow('admin'), asyncRoute(async (req,res) => {
  const { rows } = await query(`SELECT id,name,email,phone,role,active,created_at FROM users WHERE role <> 'customer' ORDER BY role,name`);
  res.json({ staff:rows });
}));
app.post('/api/admin/staff', authenticate, allow('admin'), asyncRoute(async (req,res) => {
  const name=clean(req.body.name,100), email=clean(req.body.email,160).toLowerCase(), phone=clean(req.body.phone,40), role=clean(req.body.role,20), password=String(req.body.password || '');
  if (name.length < 2 || !isEmail(email) || !['cook','delivery','waiter','admin'].includes(role) || password.length < 8) return res.status(400).json({ error:'Enter a name, valid email, staff role and password (8+ characters).' });
  const id=randomUUID();
  try {
    await query(`INSERT INTO users (id,name,email,phone,password_hash,role) VALUES ($1,$2,$3,$4,$5,$6)`,[id,name,email,phone,await bcrypt.hash(password,12),role]);
  } catch (error) { if (error.code==='23505') return res.status(409).json({ error:'That email is already in use.' }); throw error; }
  res.status(201).json({ staff:{ id,name,email,phone,role,active:true } });
}));
app.patch('/api/admin/staff/:id', authenticate, allow('admin'), asyncRoute(async (req,res) => {
  const { active, role } = req.body || {};
  if (req.params.id === req.user.id) return res.status(400).json({ error:'You cannot disable your own owner account.' });
  if (role && !['admin','cook','delivery','waiter'].includes(role)) return res.status(400).json({ error:'Invalid staff role.' });
  const fields=[], values=[];
  if (typeof active === 'boolean') { values.push(active); fields.push(`active=$${values.length}`); }
  if (role) { values.push(role); fields.push(`role=$${values.length}`); }
  if (!fields.length) return res.status(400).json({ error:'No staff changes were supplied.' });
  values.push(req.params.id);
  const { rows } = await query(`UPDATE users SET ${fields.join(',')} WHERE id=$${values.length} AND role <> 'customer' RETURNING id,name,email,phone,role,active`,values);
  if (!rows[0]) return res.status(404).json({ error:'Staff member not found.' });
  res.json({ staff:rows[0] });
}));
app.put('/api/admin/settings', authenticate, allow('admin'), asyncRoute(async (req,res) => {
  const accepted=['restaurantName','tagline','phone','address','currency','deliveryFee','paymentQr','paymentInstructions','instagram','whatsapp'];
  const updates=req.body || {};
  for (const key of accepted) {
    if (!(key in updates)) continue;
    const value=updates[key];
    if (key==='paymentQr' && !validateImage(value)) return res.status(400).json({ error:'Use a PNG, JPG or WebP image for the payment QR code.' });
    if (key==='deliveryFee' && (!Number.isFinite(Number(value)) || Number(value)<0)) return res.status(400).json({ error:'Delivery fee must be zero or more.' });
    await query(`INSERT INTO settings (key,value,updated_at) VALUES ($1,$2::jsonb,NOW()) ON CONFLICT(key) DO UPDATE SET value=EXCLUDED.value,updated_at=NOW()`,[key,JSON.stringify(value)]);
  }
  res.json(await getSettings(accepted));
}));

app.use((req,res) => res.status(404).json({ error:'That API route does not exist.' }));
app.use((error,req,res,next) => {
  console.error(error);
  if (res.headersSent) return next(error);
  res.status(500).json({ error: process.env.NODE_ENV === 'production' ? 'Something went wrong on the server. Please try again.' : error.message });
});

const server = app.listen(PORT, () => console.log(`Courtyard Kitchen API listening on ${PORT}`));
const shutdown = async () => { server.close(); await pool.end(); process.exit(0); };
process.on('SIGTERM',shutdown);
process.on('SIGINT',shutdown);
