# Kanyo — plan d’implémentation

## 1. Vision produit

Kanyo aide une personne à comprendre le comportement observable de sa peau, à construire un profil cosmétique évolutif et à trouver des produits plus susceptibles de lui convenir.

Le produit ne doit pas présenter le résultat comme un diagnostic médical. Le vocabulaire recommandé est **skin profile**, **skin assessment** et **cosmetic guidance**. Les réponses pouvant révéler un risque (réaction importante, traitement prescrit, affection diagnostiquée, grossesse, etc.) doivent déclencher des précautions, une limitation des recommandations et, si nécessaire, une invitation à consulter un professionnel de santé.

Langue par défaut : anglais. Le français est disponible dans toute l’interface et pour tout le contenu éditorial.

## 2. Périmètre du MVP

### Inclus

- Inscription, connexion, récupération du compte et suppression du compte.
- Questionnaire adaptatif bilingue avec sauvegarde automatique et reprise ultérieure.
- Profil cutané calculé et explicable.
- Mise à jour des réponses et recalcul automatique du profil et des recommandations.
- Catalogue de produits skincare avec recherche et filtres.
- Fiche produit : marque, catégorie, ingrédients, usages, précautions, score informatif et sources.
- Indication personnalisée : **Good match**, **Potential match**, **Use with caution**, **Not enough information**.
- Explication de la compatibilité : raisons positives, incompatibilités, précautions et niveau de confiance.
- Recommandations de produits et de routine simple selon priorités, budget, textures et préférences.
- Avis publics avec note, commentaire, date d’utilisation et type de peau déclaré au moment de l’avis.
- Notes privées, visibles uniquement par leur auteur.
- Signalement et modération des avis publics.
- Back-office minimal pour produits, ingrédients, règles et modération.
- Consentement, export et suppression des données personnelles.

### Reporté après le MVP

- Analyse de photos ou caméra.
- Diagnostic médical ou détection de pathologies.
- Marketplace, paiement et affiliation.
- Réseau social, messagerie et abonnements entre membres.
- Recommandations générées librement par un LLM.
- Import automatique massif de catalogues sans contrôle humain.

## 3. Architecture recommandée

```text
Navigateur / mobile web
        |
        v
Next.js + TypeScript (Vercel)
        |
        | API HTTPS avec JWT Supabase
        v
API TypeScript (Railway)
        |
        +--> moteur de profil et de compatibilité
        +--> recherche, modération, administration
        +--> tâches asynchrones d’import/recalcul
        |
        v
Supabase
  - Auth
  - PostgreSQL
  - Storage
  - Row Level Security
```

### Choix techniques

- **Front-end** : Next.js App Router, TypeScript, Tailwind CSS, composants accessibles, formulaires typés et i18n par routes `/en` et `/fr`.
- **Back-end** : Node.js TypeScript avec Fastify ou NestJS sur Railway. Fastify est suffisant pour le MVP ; NestJS devient intéressant si l’équipe grandit rapidement.
- **Base et identité** : Supabase Postgres + Auth. Le front n’accède directement qu’aux opérations simples et protégées ; les décisions de recommandation passent par l’API Railway.
- **Fichiers** : Supabase Storage pour les images produits et les avatars.
- **Contrats** : schémas Zod/OpenAPI partagés entre le front et l’API.
- **Tests** : Vitest pour les règles, Playwright pour les parcours, pgTAP/Supabase tests pour les politiques RLS.
- **Observabilité** : logs structurés sans réponses sensibles, suivi d’erreurs, métriques de latence et journal des versions du moteur.

## 4. Normalisation du questionnaire

Le document actuel est une excellente base métier, mais il ne doit pas être codé directement dans les écrans. Il contient une ancienne séquence de questions au début, des doublons autour des petites peaux/tiraillements et une numérotation discontinue.

### Travail éditorial initial

1. Fusionner les questions qui mesurent le même signal.
2. Remplacer les numéros visibles par des identifiants stables, par exemple `oiliness_end_of_day`, `cleanse_tightness` et `barrier_water_sting`.
3. Classer chaque question dans une dimension : sébum, sécheresse, déshydratation, sensibilité, barrière, imperfections, pigmentation, contexte médical, expérience, environnement ou préférences.
4. Définir les embranchements (`visible_if`) et les réponses exclusives. Par exemple, “aucune” et “je préfère ne pas répondre” ne peuvent pas coexister avec les autres choix.
5. Séparer le texte de l’interface des données métier afin que l’anglais et le français utilisent les mêmes clés.
6. Faire valider le questionnaire et les règles de précaution par un dermatologue ou un professionnel qualifié avant publication.

### Modèle d’une question

Chaque question possède :

- une clé immuable ;
- une version ;
- un type (`single`, `multi`, `rank`, `text`, `product_search`) ;
- des libellés EN/FR ;
- des aides EN/FR ;
- des options ordonnées ;
- une règle de visibilité ;
- des contraintes de validation ;
- les signaux métier produits par chaque réponse.

La tranche d’âge doit utiliser des cartes ou boutons radio plutôt qu’un curseur : il s’agit de catégories discrètes, et non d’une valeur continue.

## 5. Profil cutané et moteur de recommandation

### Dimensions calculées

- production de sébum ;
- sécheresse ;
- déshydratation ;
- sensibilité/réactivité ;
- état de la barrière cutanée ;
- tendance aux imperfections ;
- tendance aux marques/pigmentation ;
- priorités utilisateur ;
- expérience avec les actifs ;
- contraintes de sécurité ;
- préférences de texture, budget et complexité de routine.

Chaque dimension conserve un score interne, une catégorie lisible, un niveau de confiance et les réponses qui ont contribué au résultat. L’utilisateur voit une explication simple, pas seulement une note.

### Compatibilité produit

Le score personnalisé ne doit pas être une moyenne opaque. Il est calculé en quatre étapes :

1. **Blocages et précautions** : grossesse/allaitement, traitement déclaré, allergie connue, barrière très fragilisée, réaction antérieure ou condition diagnostiquée.
2. **Adéquation fonctionnelle** : catégorie du produit et bénéfices attendus face aux priorités.
3. **Tolérance probable** : actifs, concentration connue, parfum, huiles essentielles, alcool, texture et historique personnel.
4. **Préférences** : budget, texture, vegan, complexité de routine et produits déjà utilisés.

Le résultat retourne : un statut, un score interne éventuel, un niveau de confiance, des `reason_codes`, une version de règles et la date de calcul. Une composition incomplète doit produire **Not enough information**, jamais une fausse certitude.

### Score de fiche produit

Afficher séparément :

- la qualité et la complétude des données ;
- les informations sur les ingrédients et les sources ;
- l’adéquation au profil personnel ;
- la note moyenne de la communauté.

Ces éléments ne doivent pas être fusionnés en une note unique laissant croire à une vérité scientifique universelle.

## 6. Modèle de données initial

### Utilisateurs et confidentialité

- `profiles`
- `user_consents`
- `user_preferences`
- `assessment_sessions`
- `assessment_answers`
- `skin_profile_snapshots`
- `user_product_experiences`
- `private_product_notes`

### Questionnaire et règles

- `questionnaire_versions`
- `questions`
- `question_options`
- `question_translations`
- `profile_rule_sets`
- `profile_rules`
- `compatibility_rule_sets`
- `compatibility_rules`

### Catalogue

- `brands`
- `products`
- `product_translations`
- `product_variants`
- `ingredients`
- `ingredient_aliases`
- `ingredient_translations`
- `product_ingredients`
- `ingredient_evidence`
- `product_claims`
- `product_sources`
- `product_images`

### Recommandations et communauté

- `compatibility_results`
- `recommendation_runs`
- `recommendation_items`
- `public_reviews`
- `review_reactions`
- `review_reports`
- `moderation_actions`

### Règles d’accès essentielles

- Réponses, profils, recommandations et notes privées : propriétaire uniquement.
- Avis publiés : lecture publique ; création et modification par leur auteur uniquement.
- Brouillons d’avis : auteur uniquement.
- Catalogue publié : lecture publique ; écriture réservée aux administrateurs.
- Données de modération : modérateurs et administrateurs uniquement.
- Clé `service_role` : serveur Railway uniquement, jamais dans le navigateur ni dans une variable `NEXT_PUBLIC_*`.
- RLS activée et testée sur chaque table exposée, avec permissions SQL minimales par opération.

## 7. API initiale

- `POST /assessments` — commencer une évaluation.
- `PATCH /assessments/:id/answers` — enregistrer une ou plusieurs réponses.
- `POST /assessments/:id/complete` — valider et calculer le profil.
- `GET /me/skin-profile` — récupérer le profil courant et ses explications.
- `GET /me/skin-profile/history` — historique des profils.
- `GET /products` — recherche, filtres et pagination.
- `GET /products/:slug` — fiche complète.
- `GET /products/:id/compatibility` — compatibilité avec l’utilisateur courant.
- `GET /recommendations` — recommandations actuelles.
- `POST /products/:id/reviews` — publier un avis.
- `PUT /products/:id/private-note` — enregistrer une note privée.
- `POST /reviews/:id/report` — signaler un avis.
- Routes `/admin/*` — catalogue, règles, sources et modération.

Tous les changements de réponses créent un nouveau snapshot du profil et invalident les compatibilités calculées. Le recalcul immédiat couvre les produits consultés et recommandés ; le reste peut être recalculé en tâche de fond.

## 8. Parcours principaux

### Première utilisation

1. Choix de langue.
2. Explication du service, limites médicales et consentement.
3. Questionnaire par sections, avec barre de progression et sauvegarde automatique.
4. Vérification des priorités.
5. Profil cutané expliqué.
6. Recommandations initiales et précautions.

### Mise à jour du profil

1. L’utilisateur ouvre son espace **My skin**.
2. Il modifie une section ou refait l’évaluation.
3. Kanyo affiche ce qui a changé.
4. Une nouvelle version du profil est enregistrée.
5. Recommandations et compatibilités sont recalculées.

### Fiche produit

1. Résumé du produit et composition.
2. Compatibilité personnelle avec raisons et niveau de confiance.
3. Informations générales sourcées.
4. Avis publics.
5. Expérience personnelle et note privée dans un bloc clairement séparé.

## 9. Sécurité, conformité et qualité

- Minimisation des données ; ne demander que ce qui influence réellement une recommandation.
- Consentement explicite et versionné pour les informations sensibles.
- Chiffrement en transit et au repos ; secrets uniquement côté serveur.
- Export, correction et suppression du compte et des données.
- Durée de conservation documentée.
- Aucun détail médical, réponse au questionnaire ou note privée dans les logs applicatifs.
- Pseudonymes publics et protection contre l’énumération des comptes.
- Rate limiting, CAPTCHA adaptatif et protection anti-spam pour les avis.
- Modération, signalement, statut de publication et piste d’audit.
- Sources et date de dernière vérification sur les informations d’ingrédients.
- Messages d’urgence clairs pour gonflement, brûlure importante ou réaction sévère.
- Revue juridique avant lancement, notamment RGPD, allégations santé, données sensibles et règles applicables aux dispositifs médicaux.

## 10. Phases de réalisation

### Phase 0 — cadrage et validation métier

- Normaliser les questions et leurs embranchements.
- Définir les dimensions du profil et les règles de prudence.
- Définir la méthodologie des fiches produits et les sources autorisées.
- Faire relire le contenu clinique et les avertissements.

**Sortie :** questionnaire version 1, matrice réponses → signaux, charte éditoriale EN/FR et liste des alertes.

### Phase 1 — fondations techniques

- Initialiser le monorepo TypeScript.
- Créer les applications front et API.
- Configurer CI, lint, tests et environnements.
- Créer les projets Supabase, Vercel et Railway après validation de la région et des coûts.
- Relier GitHub aux environnements Preview/Staging/Production.
- Mettre en place Auth et le socle RLS.

**Sortie :** inscription/connexion fonctionnelle, déploiements automatiques et test de sécurité RLS.

### Phase 2 — questionnaire et profil

- Construire le moteur de formulaire piloté par configuration.
- Ajouter autosave, reprise, branches conditionnelles et i18n.
- Implémenter le moteur de profil versionné.
- Construire l’écran de résultat et l’historique.

**Sortie :** parcours complet validé sur mobile et desktop.

### Phase 3 — catalogue produit

- Construire le back-office de saisie et validation.
- Importer un petit jeu de produits vérifiés.
- Ajouter recherche, filtres et fiches produits.
- Afficher les sources et la complétude des données.

**Sortie :** catalogue pilote de 50 à 100 produits contrôlés.

### Phase 4 — compatibilité et recommandations

- Implémenter les règles de blocage, prudence, adéquation et préférence.
- Ajouter explications et niveau de confiance.
- Construire les recommandations et le recalcul après modification du profil.
- Ajouter tests de non-régression sur des profils synthétiques.

**Sortie :** moteur auditable avec cas de référence validés par le métier.

### Phase 5 — communauté et journal privé

- Avis publics, édition, suppression et signalement.
- Notes privées et historique d’expérience.
- Modération et back-office.
- Agrégats de notes résistants au spam.

**Sortie :** publication publique sécurisée sans fuite de données privées.

### Phase 6 — préparation du lancement

- Audit accessibilité, sécurité, RLS et performances.
- Tests E2E des parcours critiques.
- Pages légales, confidentialité et consentements.
- Monitoring, alertes, sauvegardes et procédure d’incident.
- Bêta fermée et corrections.

## 11. Critères d’acceptation du MVP

- Une personne peut terminer le questionnaire en anglais ou en français et le reprendre après interruption.
- Deux évaluations identiques produisent le même profil pour une même version de règles.
- Chaque résultat et recommandation explique ses principaux facteurs.
- Une mise à jour de réponse crée un nouveau profil et met à jour les recommandations.
- Une personne ne peut jamais lire les réponses ou notes privées d’une autre.
- Les avis publics ne révèlent pas les réponses sensibles du questionnaire.
- Un produit aux données incomplètes n’obtient pas une compatibilité artificiellement précise.
- Les règles et scores restent reproductibles grâce à leur version.
- Les alertes médicales limitent correctement les recommandations.
- Le parcours principal est utilisable au clavier, sur lecteur d’écran et sur mobile.

## 12. Décisions à prendre avant de commencer le code

1. Nom final et positionnement : “skin assessment” recommandé au lieu de “diagnosis”.
2. Pays de lancement initial, afin de cadrer langue, devise, disponibilité produit et conformité.
3. Professionnel chargé de valider les règles et avertissements.
4. Source et droits d’utilisation des données produits et compositions INCI.
5. Méthodologie exacte du score général produit.
6. Connexion autorisée : e-mail/mot de passe, magic link, Google ou Apple.
7. Région d’hébergement et organisation Supabase à utiliser.
8. Politique de pseudonyme et degré d’anonymat des avis publics.
9. Choix Fastify ou NestJS pour l’API Railway.
10. Budget mensuel maximal pour l’infrastructure du MVP.

## 13. Premier lot de tickets

1. Nettoyer et versionner le questionnaire V1.
2. Créer la matrice de scoring et les drapeaux de sécurité.
3. Initialiser le monorepo `apps/web`, `apps/api` et `packages/shared`.
4. Configurer les environnements locaux sans secrets committés.
5. Créer le schéma Supabase initial et les tests RLS.
6. Implémenter Auth et le profil utilisateur minimal.
7. Construire le moteur de questionnaire à partir d’un fichier de configuration.
8. Implémenter le calcul de profil avec tests unitaires.
9. Construire les écrans onboarding, questionnaire et résultat.
10. Ajouter un catalogue pilote et la première version de la fiche produit.

## Références techniques

- Supabase, sécurisation par Row Level Security : https://supabase.com/docs/guides/database/postgres/row-level-security
- Vercel, déploiements GitHub : https://vercel.com/docs/git/vercel-for-github
- Railway, modèle de services : https://docs.railway.com/services

