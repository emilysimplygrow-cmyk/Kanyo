export type Locale = 'en' | 'fr'

export type Product = {
  id: string
  brand: string
  name: string
  category: string
  price: string
  label: string
  description: string
  ingredients: string[]
  benefits: string[]
  cautions: string[]
  transparency: number
  community: number
  skinFit: 'barrier' | 'clarity' | 'glow' | 'hydration' | 'everyday'
}

export const products: Product[] = [
  {
    id: 'cloud-cleanser', brand: 'Kanyo Labs', name: 'Cloud Cleanser', category: 'Cleanser', price: '€18', label: 'Fragrance-free',
    description: 'A low-foam daily cleanser designed to leave skin comfortable, not squeaky.',
    ingredients: ['Glycerin', 'Betaine', 'Panthenol', 'Coco-glucoside'], benefits: ['Comfort-focused cleanse', 'Supports a simple routine'], cautions: ['Patch test if your skin is reactive'], transparency: 94, community: 4.7, skinFit: 'barrier',
  },
  {
    id: 'daily-dew', brand: 'Luma', name: 'Daily Dew Serum', category: 'Serum', price: '€24', label: 'Hydration',
    description: 'A light, layering serum with humectants and niacinamide for everyday hydration.',
    ingredients: ['Glycerin', 'Beta-glucan', 'Niacinamide', 'Sodium hyaluronate'], benefits: ['Hydration', 'Helps support an even-looking complexion'], cautions: ['Introduce gradually if niacinamide is new to you'], transparency: 89, community: 4.5, skinFit: 'hydration',
  },
  {
    id: 'clear-days', brand: 'Form & Field', name: 'Clear Days BHA', category: 'Treatment', price: '€29', label: '2% salicylic acid',
    description: 'A leave-on exfoliant for congested-looking areas and recurring blackheads.',
    ingredients: ['Salicylic acid', 'Propanediol', 'Allantoin'], benefits: ['Targets clogged pores', 'Smooths visible texture'], cautions: ['Avoid when your barrier feels compromised', 'Do not combine with multiple strong actives at first'], transparency: 92, community: 4.4, skinFit: 'clarity',
  },
  {
    id: 'calm-cream', brand: 'Mirae', name: 'Calm Barrier Cream', category: 'Moisturiser', price: '€22', label: 'Barrier support',
    description: 'A medium-rich cream with ceramides and soothing ingredients for daily comfort.',
    ingredients: ['Ceramides', 'Squalane', 'Panthenol', 'Madecassoside'], benefits: ['Comfort', 'Helps reduce the feeling of tightness'], cautions: ['May feel rich on very oily areas'], transparency: 96, community: 4.8, skinFit: 'barrier',
  },
  {
    id: 'sun-veil', brand: 'Serein', name: 'Sun Veil SPF 50', category: 'Sunscreen', price: '€21', label: 'Broad spectrum SPF 50',
    description: 'An everyday broad-spectrum sunscreen with a comfortable fluid texture.',
    ingredients: ['UV filters', 'Glycerin', 'Vitamin E'], benefits: ['Daily UV protection', 'Helps support pigmentation concerns'], cautions: ['Reapply as directed on the label'], transparency: 88, community: 4.6, skinFit: 'everyday',
  },
  {
    id: 'bright-start', brand: 'Nori', name: 'Bright Start C', category: 'Serum', price: '€35', label: 'Vitamin C',
    description: 'An antioxidant serum for a brighter-looking, more even complexion.',
    ingredients: ['Ethyl ascorbic acid', 'Ferulic acid', 'Glycerin'], benefits: ['Visible radiance', 'Antioxidant support'], cautions: ['Start slowly if your skin stings easily'], transparency: 84, community: 4.3, skinFit: 'glow',
  },
]

export const copy = {
  en: {
    discover: 'Discover', mySkin: 'My skin', products: 'Products', journal: 'Journal',
    eyebrow: 'Skincare, made personal', headline: 'Understand your skin. Choose with confidence.',
    intro: 'A gentler way to build your skincare routine, based on what you actually see and feel.',
    start: 'Start my skin assessment', explore: 'Explore products', profile: 'Your skin snapshot',
    profileText: 'Your answers create a living profile. Update it whenever your skin or routine changes.',
    completed: 'Assessment complete', answer: 'Answer a few questions to personalise this.',
    needs: 'What your skin may need right now', routine: 'A simple routine to begin with',
    note: 'Kanyo offers cosmetic guidance, not a medical diagnosis. If you have persistent, painful or severe symptoms, seek medical advice.',
    compatible: 'A good match for you', caution: 'Use with care', maybe: 'Potential match',
    why: 'Why it fits', details: 'View details', save: 'Save private note', review: 'Share a review',
    private: 'Private', public: 'Public', transparency: 'Data transparency', community: 'Community rating',
  },
  fr: {
    discover: 'Découvrir', mySkin: 'Ma peau', products: 'Produits', journal: 'Journal',
    eyebrow: 'La skincare, personnalisée', headline: 'Comprendre sa peau. Choisir en confiance.',
    intro: 'Une approche plus douce pour construire votre routine, basée sur ce que vous voyez et ressentez réellement.',
    start: 'Commencer mon bilan peau', explore: 'Découvrir les produits', profile: 'Votre profil peau',
    profileText: 'Vos réponses créent un profil vivant. Modifiez-le dès que votre peau ou votre routine évolue.',
    completed: 'Bilan terminé', answer: 'Répondez à quelques questions pour personnaliser cet espace.',
    needs: 'Ce dont votre peau peut avoir besoin maintenant', routine: 'Une routine simple pour commencer',
    note: 'Kanyo propose des conseils cosmétiques, pas un diagnostic médical. En cas de symptômes persistants, douloureux ou sévères, demandez conseil à un professionnel de santé.',
    compatible: 'Adapté à votre profil', caution: 'À utiliser avec précaution', maybe: 'À envisager',
    why: 'Pourquoi ce produit vous correspond', details: 'Voir la fiche', save: 'Enregistrer une note privée', review: 'Publier un avis',
    private: 'Privé', public: 'Public', transparency: 'Transparence des données', community: 'Note communauté',
  },
} as const

