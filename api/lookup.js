import { cleanCode, getMember } from '../lib/db.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée' });
  try {
    const code = cleanCode(req.body?.code);
    if (code.length !== 8) return res.status(400).json({ error: 'Le code doit contenir 8 chiffres.' });
    const m = await getMember(code);
    if (!m) return res.status(404).json({ error: 'Code inconnu.' });
    res.json({ code, name: m.name, role: m.role, hasCard: !!m.file, fileName: m.file?.name || null });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
}
