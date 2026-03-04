# Documentation de Transmission - Projet Chrono Cours

Ce document est destiné à un agent IA ou un développeur souhaitant reprendre ou maintenir le projet **Chrono Cours**.

## 1. Présentation du Projet
**Chrono Cours** est une application web (SPA) minimaliste et élégante conçue pour suivre le temps restant durant une séance de cours ou une conférence. Elle offre une visualisation claire via un compte à rebours circulaire et des barres de progression segmentées par quarts d'heure.

## 2. Stack Technique
- **Framework :** React 19 (TypeScript)
- **Build Tool :** Vite 6
- **Styling :** Tailwind CSS v4 (utilisant `@variant dark` pour le mode sombre par classes)
- **Animations :** `motion/react` (anciennement Framer Motion)
- **Icônes :** `lucide-react`
- **Déploiement :** GitHub Actions -> GitHub Pages
- **Dépendances préparatoires (présentes dans `package.json` mais non utilisées dans le front-end) :** `@google/genai`, `express`, `better-sqlite3`, `dotenv` (Suggère une évolution future vers un backend ou l'intégration d'IA).

## 3. Architecture et Fichiers Clés
- `src/App.tsx` : Contient l'intégralité de la logique et de l'interface (environ 340 lignes).
- `src/index.css` : Configuration Tailwind v4 et utilitaires personnalisés (ex: `.no-scrollbar`).
- `package.json` : Contient les dépendances, y compris celles prêtes pour un éventuel futur backend.
- `.github/workflows/deploy.yml` : Workflow CI/CD pour le déploiement automatique sur GitHub Pages.

## 4. Fonctionnalités Clés & Logique

### A. Gestion des Créneaux Horaires (Auto-fill)
Au montage (`useEffect`), l'application pré-remplit les heures de début et de fin selon des créneaux standards. La bascule est **stricte** (à l'heure pile) :
- `08:15 - 09:45`
- `10:00 - 11:30`
- `11:30 - 13:00`
- `13:00 - 14:30` (Bascule dès 12:50 pour le cours de l'après-midi)
- `14:45 - 16:15`
- `16:30 - 18:00`

### B. Visualisation de la Progression
- **Cercle central :** Affiche le temps restant et le pourcentage global. Le pourcentage peut changer de précision au clic (0, 1, 2 décimales ou dynamique).
- **Barres latérales :** La progression est divisée en "blocs" de 15 minutes (quarts d'heure).
- **Logique de ligne :** Les barres sont groupées par 8 par ligne (`chunkedBars`). Si une ligne est incomplète, des placeholders sont ajoutés pour maintenir l'alignement.

### C. Responsive Design
- **Mobile Portrait :** Empilement vertical (`flex-col`). Icônes de contrôle réduites.
- **Mobile Paysage :** Disposition côte à côte (`landscape:flex-row`). Tout le contenu doit tenir sans scroll (`h-screen`, `overflow-hidden`).
- **Desktop :** Version agrandie du mode paysage mobile, centrée, occupant jusqu'à `1400px` de large.
- **Scrollbars :** Masquées via l'utilitaire `.no-scrollbar` (configuré dans `index.css`).

### D. Contrôles et Thème
- **Mode Sombre :** Géré par la classe `.dark` sur `html`. Persistance via `localStorage` ('theme').
- **Plein Écran :** Bouton visible uniquement sur mobile (écrans `< md`) pour forcer le mode `fullscreen`.

## 5. Conventions de Code
- **Tailwind v4 :** Utiliser les nouvelles syntaxes (ex: `@variant`, `@utility`).
- **Animations :** Privilégier `AnimatePresence` pour les transitions de montage/démontage.
- **État :** Utilisation intensive de `useState` et `useEffect` pour le rafraîchissement du timer (tous les 100ms en cours d'exécution).

## 6. Commandes Utiles
- `npm run dev` : Lancement local sur le port 3000 (accessible sur le réseau local via `--host=0.0.0.0`).
- `npm run build` : Build de production (génère `/dist`).
- `npm run lint` : Vérification du typage TypeScript.

---
*Dernière mise à jour : 02 Mars 2026*
