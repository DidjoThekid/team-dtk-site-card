import { put } from '@vercel/blob';
import { randomUUID } from 'node:crypto';
import { addRequest, listRequests } from '../lib/requests.js';

const RE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const RE_PHONE = /^[+\d][\d .()\-]{5,19}$/;
const EXT = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée' });
  try {
    const b = req.body || {};
    if (b.website) return res.json({ ok: true }); // anti-bot (champ piège)

    const email = String(b.email || '').trim().toLowerCase();
    const phone = String(b.phone || '').trim();
    const nom = String(b.nom || '').trim();
    const prenom = String(b.prenom || '').trim();
    const birth = String(b.birth || '').trim();
    const photoType = String(b.photoType || 'image/jpeg');
    const photoData = String(b.photo || '');

    if (!RE_EMAIL.test(email) || email.length > 120) return res.status(400).json({ error: 'Adresse e-mail invalide.' });
    if (phone && !RE_PHONE.test(phone)) return res.status(400).json({ error: 'Numéro de téléphone invalide.' });
    if (!nom || nom.length > 60) return res.status(400).json({ error: 'Le nom est requis.' });
    if (!prenom || prenom.length > 60) return res.status(400).json({ error: 'Le prénom est requis.' });

    const okDate = /^\d{4}-\d{2}-\d{2}$/.test(birth) && new Date(birth + 'T00:00:00Z').toISOString().slice(0, 10) === birth;
    if (!okDate) return res.status(400).json({ error: 'Date de naissance invalide.' });
    if (birth < '2000-01-01' || birth > '2017-12-31')
      return res.status(400).json({ error: 'La date de naissance doit être entre 2000 et 2017.' });

    if (!EXT[photoType] || !photoData) return res.status(400).json({ error: 'La photo est requise.' });
    const buf = Buffer.from(photoData, 'base64');
    if (buf.length < 1000 || buf.length > 3 * 1024 * 1024) return res.status(400).json({ error: 'Photo invalide ou trop lourde.' });

    const existing = await listRequests();
    if (existing.some((r) => r.email === email && r.status === 'pending'))
      return res.status(409).json({ error: 'Une demande est déjà en attente pour cette adresse e-mail.' });

    const id = randomUUID();
    const blob = await put(`demandes/${id}.${EXT[photoType]}`, buf, {
      access: 'public',
      addRandomSuffix: true,
      contentType: photoType,
    });

    await addRequest({
      id, email, phone, nom, prenom, birth,
      photo: blob.url,
      status: 'pending',
      code: null,
      createdAt: new Date().toISOString(),
    });
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
}
