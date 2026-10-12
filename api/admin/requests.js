import { isAdmin, setMember } from '../../lib/db.js';
import { deleteRequest, getRequest, listRequests, newCode, setRequest } from '../../lib/requests.js';
import { del } from '@vercel/blob';

export default async function handler(req, res) {
  if (!isAdmin(req)) return res.status(401).json({ error: 'Mot de passe incorrect.' });
  try {
    if (req.method === 'GET') return res.json(await listRequests());

    if (req.method === 'POST') {
      const { id, action } = req.body || {};
      const r = await getRequest(String(id || ''));
      if (!r) return res.status(404).json({ error: 'Demande introuvable.' });

      if (action === 'approve') {
        if (r.status === 'approved') return res.json({ ok: true, code: r.code });
        const code = await newCode();
        await setMember(code, { name: r.prenom.toUpperCase(), role: 'MEMBRE', file: null });
        await setRequest({ ...r, status: 'approved', code });
        return res.json({ ok: true, code });
      }

      if (action === 'reject' || action === 'delete') {
        if (r.photo) await del(r.photo).catch(() => {});
        await deleteRequest(r.id);
        return res.json({ ok: true });
      }
      return res.status(400).json({ error: 'Action inconnue.' });
    }
    res.status(405).json({ error: 'Méthode non autorisée' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
}
