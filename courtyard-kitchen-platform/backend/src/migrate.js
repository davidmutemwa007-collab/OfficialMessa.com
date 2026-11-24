import { randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { pool, query } from './db.js';

const schema = `
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin','cook','delivery','waiter','customer')),
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS menu_items (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'Kitchen',
  price NUMERIC(12,2) NOT NULL CHECK (price >= 0),
  image_url TEXT NOT NULL DEFAULT '',
  available BOOLEAN NOT NULL DEFAULT TRUE,
  featured BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  order_type TEXT NOT NULL CHECK (order_type IN ('delivery','pickup')),
  delivery_address TEXT,
  items JSONB NOT NULL,
  subtotal NUMERIC(12,2) NOT NULL,
  delivery_fee NUMERIC(12,2) NOT NULL DEFAULT 0,
  total NUMERIC(12,2) NOT NULL,
  payment_method TEXT NOT NULL DEFAULT 'cash',
  payment_status TEXT NOT NULL DEFAULT 'pending',
  status TEXT NOT NULL DEFAULT 'placed',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS reservations (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  reservation_date DATE NOT NULL,
  reservation_time TIME NOT NULL,
  guests INTEGER NOT NULL CHECK (guests BETWEEN 1 AND 20),
  occasion TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'requested',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS orders_created_at_idx ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS orders_status_idx ON orders(status);
CREATE INDEX IF NOT EXISTS reservations_date_idx ON reservations(reservation_date, reservation_time);
CREATE INDEX IF NOT EXISTS menu_category_idx ON menu_items(category);
`;

async function main() {
  await query(schema);
  const adminEmail = (process.env.ADMIN_EMAIL || 'davidmutemwa007@gmail.com').toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin1234';
  const adminHash = await bcrypt.hash(adminPassword, 12);
  await query(
    `INSERT INTO users (id,name,email,password_hash,role) VALUES ($1,$2,$3,$4,'admin')
     ON CONFLICT (email) DO NOTHING`,
    [randomUUID(), 'David Mutemwa', adminEmail, adminHash]
  );

  // Staff accounts are created by the owner from the Team access workspace.


  const count = await query('SELECT COUNT(*)::int AS count FROM menu_items');
  if (count.rows[0].count === 0) {
    const menu = [
      ['Courtyard Smash Burger','Double-seared beef, house sauce, cheddar, pickles and a soft toasted bun.','Grill',115,'/assets/images/smash-burger.jpg',true],
      ['Sticky Smokehouse Wings','Slow-glazed wings finished over open flame with a little heat.','Grill',98,'/assets/images/sticky-wings.jpg',true],
      ['Garden Wraps','Warm toasted wraps packed with grilled filling, greens and a bright herb dressing.','Kitchen',85,'/assets/images/grilled-wraps.jpg',false],
      ['Market Catch','Char-grilled fish served with greens, lemon and a choice of side.','Kitchen',165,'/assets/images/grilled-fish.jpg',true],
      ['Golden Skin Fries','Crisp, seasoned fries with our signature dipping sauce.','Sides',42,'/assets/images/crispy-fries.jpg',false],
      ['The Sharing Table','A generous mix of kitchen favourites made for the middle of the table.','Platters',240,'/assets/images/sharing-table.jpg',true],
      ['Citrus Cooler','Fresh citrus and a sparkling finish.','Drinks',35,'/assets/images/fresh-orange-juice.jpg',false],
      ['Tropical Fruit Juice','A chilled tropical blend for the sunny side of the day.','Drinks',30,'/assets/images/tropical-juice-ad.jpg',false],
      ['Courtyard Feast Board','A generous house spread built for sharing, with a little bit of everything.','Platters',220,'/assets/images/signature-spread.jpg',true],
      ['Classic Cola on Ice','An ice-cold classic, best enjoyed in the garden.','Drinks',28,'/assets/images/cola-on-ice.jpg',false],
      ['Bottled Cola','A chilled bottle to go with the good stuff.','Drinks',30,'/assets/images/cola-bottle-ad.jpg',false],
      ['Citrus Splash','Bright citrus notes with a fresh, chilled finish.','Drinks',32,'/assets/images/citrus-drink.jpg',false],
      ['The Original Cola','A familiar favourite, served cold.','Drinks',30,'/assets/images/cola-poster.jpg',false],
    ];
    for (const [name,description,category,price,image_url,featured] of menu) {
      await query(`INSERT INTO menu_items (id,name,description,category,price,image_url,featured) VALUES ($1,$2,$3,$4,$5,$6,$7)`, [randomUUID(),name,description,category,price,image_url,featured]);
    }
  }
  const defaults = {
    restaurantName: 'The Courtyard Kitchen',
    tagline: 'Good food. Open air. Better company.',
    phone: '+260 97 000 0000',
    address: 'Lusaka, Zambia',
    currency: 'ZMW',
    deliveryFee: 25,
    paymentQr: '',
    paymentInstructions: 'Scan the QR code and use your order number as the payment reference. Your order is confirmed once payment is checked.',
    instagram: '',
    whatsapp: ''
  };
  for (const [key,value] of Object.entries(defaults)) {
    await query(`INSERT INTO settings (key,value) VALUES ($1,$2::jsonb) ON CONFLICT(key) DO NOTHING`, [key, JSON.stringify(value)]);
  }
  console.log('Database ready and starter accounts/menu seeded.');
  await pool.end();
}

main().catch(async (error) => { console.error(error); await pool.end(); process.exit(1); });
