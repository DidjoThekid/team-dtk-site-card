import { cleanCode, deleteMember, getMember, isAdmin, listMembers, setMember } from '../../lib/db.js';
import { del } from '@vercel/blob';

export default async function handler(req, res) {
  if (!isAdmin(req)) return res.status(401).json({ error: 'Mot de passe incorrect.' });
  try {
    if (req.method === 'GET') return res.json(await listMembers());

    if (req.method === 'POST') {
      const code = cleanCode(req.body?.code);
      const name = String(req.body?.name || '').trim().toUpperCase().slice(0, 40);
      const role = String(req.body?.role || 'MEMBRE').trim().toUpperCase().slice(0, 30);
      if (code.length !== 8) return res.status(400).json({ error: 'Le code doit contenir 8 chiffres.' });
      if (!name) return res.status(400).json({ error: 'Le nom est requis.' });
      const existing = await getMember(code);
      await setMember(code, { name, role, file: existing?.file || null });
      return res.json({ ok: true });
    }

    if (req.method === 'DELETE') {
      const code = cleanCode(req.query.code || req.body?.code);
      const m = await getMember(code);
      if (!m) return res.status(404).json({ error: 'Code introuvable.' });
      if (m.file?.url) await del(m.file.url).catch(() => {});
      await deleteMember(code);
      return res.json({ ok: true });
    }

    res.status(405).json({ error: 'Méthode non autorisée' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
}
