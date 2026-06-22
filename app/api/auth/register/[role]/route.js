import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { query, getClient } from '../../../../../lib/db';

const VALID = ['manufacturer', 'distributor', 'farmer'];

export async function POST(req, { params }) {
  const role = params.role;
  if (!VALID.includes(role)) return NextResponse.json({ error: 'Invalid role' }, { status: 400 });

  const body = await req.json();
  const { full_name, phone, email } = body;
  // Farmers authenticate with a 4-digit PIN; others use a password.
  const secret = role === 'farmer' ? body.pin : body.password;
  if (!full_name || !phone || !secret) {
    return NextResponse.json({ error: role === 'farmer' ? 'full_name, phone and PIN are required' : 'full_name, phone and password are required' }, { status: 400 });
  }
  if (role === 'farmer') {
    if (!/^[0-9]{4}$/.test(String(secret))) {
      return NextResponse.json({ error: 'PIN must be exactly 4 digits' }, { status: 400 });
    }
  } else if (String(secret).length < 6) {
    return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
  }

  const client = await getClient();
  try {
    await client.query('BEGIN');
    const exists = await client.query('SELECT 1 FROM users WHERE phone = $1', [phone]);
    if (exists.rowCount > 0) { await client.query('ROLLBACK'); return NextResponse.json({ error: 'Phone number already registered' }, { status: 409 }); }

    const password_hash = await bcrypt.hash(String(secret), 10);
    let org_id = null, block_id = null;

    if (role === 'manufacturer' || role === 'distributor') {
      if (!body.name) { await client.query('ROLLBACK'); return NextResponse.json({ error: 'Organization name is required' }, { status: 400 }); }
      // Society fields:
      //  - manufacturer sets its own society_code + is_exclusive
      //  - distributor records the society it is a member of (society_code), is_exclusive stays false
      const societyCode = body.society_code ? String(body.society_code).trim().slice(0, 10) : null;
      const isExclusive = role === 'manufacturer' ? !!body.is_exclusive : false;
      const orgRes = await client.query(
        `INSERT INTO organizations (name, type, address, district_id, state_id, registration_number, chairperson_name, society_code, is_exclusive)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`,
        [body.name, role, body.address || null, body.district_id || null, body.state_id || null,
         body.registration_number || null, body.chairperson_name || null, societyCode, isExclusive]
      );
      org_id = orgRes.rows[0].id;
    } else {
      block_id = body.block_id || null;
    }

    const u = await client.query(
      `INSERT INTO users (phone, email, password_hash, role, full_name, status, org_id, block_id, address)
       VALUES ($1,$2,$3,$4,$5,'pending',$6,$7,$8)
       RETURNING id, role, full_name, phone, email, status`,
      [phone, email || null, password_hash, role, full_name, org_id, block_id, body.address || null]
    );

    if (role === 'distributor' && Array.isArray(body.block_ids)) {
      for (const bid of body.block_ids) {
        await client.query(`INSERT INTO distributor_blocks (distributor_id, block_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`, [org_id, bid]);
      }
    }

    await client.query('COMMIT');
    return NextResponse.json({ message: 'Registration submitted. Your account is pending admin approval.', user: u.rows[0] }, { status: 201 });
  } catch (e) {
    await client.query('ROLLBACK');
    if (e.code === '23505') return NextResponse.json({ error: 'Phone or email already in use' }, { status: 409 });
    console.error('register', e);
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 });
  } finally {
    client.release();
  }
}
