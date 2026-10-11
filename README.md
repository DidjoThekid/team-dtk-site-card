# Cartes Team DTK

Site où chaque membre entre son code à 8 chiffres, voit son profil et télécharge sa Carte Team DTK.
Panel admin sur `/admin.html` : ajouter / supprimer un code, ajouter / remplacer / retirer une carte.

## Déploiement

1. Crée un dépôt GitHub et pousse ce dossier :
   ```bash
   git init && git add . && git commit -m "Cartes Team DTK"
   git branch -M main
   git remote add origin https://github.com/TON-COMPTE/team-dtk-cartes.git
   git push -u origin main
   ```
2. Sur vercel.com : **Add New → Project** → importe le dépôt → Deploy.
3. Dans le projet Vercel → **Storage** :
   - **Create → Blob** (stocke les cartes)
   - **Create → Upstash Redis** via Marketplace (stocke les codes)
   Connecte-les au projet (les variables d’environnement s’ajoutent seules).
4. **Settings → Environment Variables** : ajoute `ADMIN_PASSWORD` (ton mot de passe admin).
5. **Deployments → Redeploy**.

Au premier accès, les 8 membres d’origine sont créés automatiquement.
Domaine perso (ex. `cartes.dumble.fr`) : Settings → Domains.
