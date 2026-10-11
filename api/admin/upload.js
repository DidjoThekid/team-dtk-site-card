import { cleanCode, getMember, isAdmin, setMember } from '../../lib/db.js';
import { put, del } from '@vercel/blob';

// Limite Vercel : ~4,5 Mo par requête (fichier encodé en base64 => ~3 Mo max).
export default async function handler(req, res) {
  if (!isAdmin(req)) return res.status(401).json({ error: 'Mot de passe incorrect.' });
  if (req.method === 'DELETE') {
    try {
      const code = cleanCode(req.query.code);
      const m = await getMember(code);
      if (!m) return res.status(404).json({ error: 'Code introuvable.' });
      if (m.file?.url) await del(m.file.url).catch(() => {});
      await setMember(code, { ...m, file: null });
      return res.json({ ok: true });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: 'Erreur serveur.' });
    }
  }
  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée' });
  try {
    const code = cleanCode(req.body?.code);
    const { filename, contentType, data } = req.body || {};
    const m = await getMember(code);
    if (!m) return res.status(404).json({ error: 'Code introuvable.' });
    if (!filename || !data) return res.status(400).json({ error: 'Fichier manquant.' });

    const buf = Buffer.from(data, 'base64');
    if (buf.length > 3.2 * 1024 * 1024) return res.status(413).json({ error: 'Fichier trop lourd (3 Mo max).' });

    const safe = String(filename).replace(/[^\w.\- ]/g, '_');
    const blob = await put(`cartes/${code}/${safe}`, buf, {
      access: 'public',
      addRandomSuffix: true,
      contentType: contentType || 'application/octet-stream',
    });
    if (m.file?.url) await del(m.file.url).catch(() => {});
    await setMember(code, { ...m, file: { url: blob.url, name: safe, type: contentType || 'application/octet-stream' } });
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erreur lors de l’envoi du fichier.' });
  }
}
