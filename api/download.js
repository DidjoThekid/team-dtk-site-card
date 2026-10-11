import { cleanCode, getMember } from '../lib/db.js';

export default async function handler(req, res) {
  try {
    const code = cleanCode(req.query.code);
    const m = code.length === 8 ? await getMember(code) : null;
    if (!m || !m.file) return res.status(404).send('Aucune pièce jointe pour ce code.');
    const r = await fetch(m.file.url);
    if (!r.ok) return res.status(502).send('Fichier indisponible.');
    const buf = Buffer.from(await r.arrayBuffer());
    const name = (m.file.name || 'Carte-Team-DTK').replace(/[^\w.\- ]/g, '_');
    res.setHeader('Content-Type', m.file.type || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${name}"`);
    res.setHeader('Cache-Control', 'private, no-store');
    res.send(buf);
  } catch (e) {
    console.error(e);
    res.status(500).send('Erreur serveur.');
  }
}
