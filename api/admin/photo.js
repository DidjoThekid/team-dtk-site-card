import { isAdmin } from '../../lib/db.js';
import { getRequest } from '../../lib/requests.js';

export default async function handler(req, res) {
  if (!isAdmin(req)) return res.status(401).json({ error: 'Mot de passe incorrect.' });
  try {
    const r = await getRequest(String(req.query.id || ''));
    if (!r || !r.photo) return res.status(404).json({ error: 'Photo introuvable.' });
    const f = await fetch(r.photo);
    if (!f.ok) return res.status(502).json({ error: 'Photo indisponible.' });
    const buf = Buffer.from(await f.arrayBuffer());
    res.setHeader('Content-Type', f.headers.get('content-type') || 'image/jpeg');
    res.setHeader('Cache-Control', 'private, no-store');
    res.send(buf);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
}
