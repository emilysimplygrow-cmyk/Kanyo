'use client'

import { useEffect, useMemo, useState } from 'react'
import { copy, Locale, Product, products } from './data'

type Answers = { oil: string; comfort: string; sensitivity: string; concerns: string[]; routine: string; pregnancy: string; sun: string }
type Tab = 'discover' | 'skin' | 'products' | 'journal'

const initialAnswers: Answers = { oil: '', comfort: '', sensitivity: '', concerns: [], routine: '', pregnancy: '', sun: '' }

const questions = [
  { key: 'oil', title: { en: 'By the end of a usual day, how does your face feel?', fr: 'En fin de journée habituelle, comment se comporte votre visage ?' }, options: [{ v: 'dry', en: 'Comfortable or a little tight', fr: 'Confortable ou un peu tiraillé' }, { v: 'balanced', en: 'Balanced', fr: 'Équilibré' }, { v: 'oily', en: 'Shiny on my T-zone', fr: 'Brillant sur la zone T' }, { v: 'very-oily', en: 'Shiny across most of my face', fr: 'Brillant sur presque tout le visage' }] },
  { key: 'comfort', title: { en: 'After cleansing, before skincare, your skin usually feels…', fr: 'Après le nettoyage, avant les soins, votre peau est généralement…' }, options: [{ v: 'comfortable', en: 'Comfortable', fr: 'Confortable' }, { v: 'tight', en: 'A little tight', fr: 'Un peu tiraillée' }, { v: 'very-tight', en: 'Very tight or rough', fr: 'Très tiraillée ou rêche' }, { v: 'stings', en: 'Stingy or burning', fr: 'Elle picote ou brûle' }] },
  { key: 'sensitivity', title: { en: 'How does your skin react to new skincare?', fr: 'Comment votre peau réagit-elle aux nouveaux produits ?' }, options: [{ v: 'low', en: 'I can try most products', fr: 'Je peux essayer la plupart des produits' }, { v: 'medium', en: 'It can react sometimes', fr: 'Elle peut parfois réagir' }, { v: 'high', en: 'It reacts quite easily', fr: 'Elle réagit assez facilement' }, { v: 'current', en: 'It is reacting right now', fr: 'Elle réagit actuellement' }] },
]

const concerns = [
  ['clarity', 'Breakouts & blackheads', 'Boutons et points noirs'], ['redness', 'Redness & sensitivity', 'Rougeurs et sensibilité'], ['hydration', 'Dehydration & tightness', 'Déshydratation et tiraillements'], ['glow', 'Uneven tone & dark marks', 'Teint irrégulier et marques'], ['ageing', 'Fine lines & firmness', 'Ridules et fermeté'],
]

function scoreProfile(a: Answers) {
  const barrier = a.comfort === 'stings' || a.sensitivity === 'current' || a.sensitivity === 'high'
  const dehydration = a.comfort === 'tight' || a.comfort === 'very-tight' || a.comfort === 'stings'
  return {
    oiliness: a.oil === 'very-oily' ? 'High' : a.oil === 'oily' ? 'Balanced to oily' : a.oil === 'dry' ? 'Low' : 'Balanced',
    hydration: dehydration ? 'Needs support' : 'Comfortable',
    sensitivity: barrier ? 'Reactive right now' : a.sensitivity === 'medium' ? 'Occasionally reactive' : 'Low reactivity',
    barrier,
    dehydration,
  }
}

function fit(product: Product, answers: Answers) {
  const p = scoreProfile(answers)
  if (!answers.oil) return { status: 'maybe', reasons: ['Complete your assessment to personalise this match.'] }
  if (p.barrier && product.skinFit === 'clarity') return { status: 'caution', reasons: ['Your answers suggest a reactive barrier today.', 'This treatment can be introduced later, slowly.'] }
  const reasons: string[] = []
  if (product.skinFit === 'barrier' && p.barrier) reasons.push('Your answers point to a need for comfort and barrier support.')
  if (product.skinFit === 'hydration' && p.dehydration) reasons.push('You mentioned tightness, which can be linked to dehydration.')
  if (product.skinFit === 'clarity' && answers.concerns.includes('clarity')) reasons.push('It targets the concern you selected: visible congestion.')
  if (product.skinFit === 'glow' && answers.concerns.includes('glow')) reasons.push('It aligns with your uneven-tone priority.')
  if (product.skinFit === 'everyday') reasons.push('Daily sun protection supports every routine, especially if dark marks concern you.')
  return { status: reasons.length ? 'compatible' : 'maybe', reasons: reasons.length ? reasons : ['This product could fit your routine; check the ingredient and preference details.'] }
}

export function SkinApp() {
  const [locale, setLocale] = useState<Locale>('en')
  const [tab, setTab] = useState<Tab>('discover')
  const [answers, setAnswers] = useState<Answers>(() => {
    if (typeof window === 'undefined') return initialAnswers
    const saved = window.localStorage.getItem('kanyo-assessment')
    return saved ? JSON.parse(saved) as Answers : initialAnswers
  })
  const [step, setStep] = useState(0)
  const [assessing, setAssessing] = useState(false)
  const [selected, setSelected] = useState<Product | null>(null)
  const [query, setQuery] = useState('')
  const [privateNote, setPrivateNote] = useState('')
  const [savedNote, setSavedNote] = useState('')
  const [review, setReview] = useState('')
  const [reviews, setReviews] = useState<string[]>(['My skin felt comfortable after a week. I kept the rest of my routine simple.'])
  const t = copy[locale]
  const profile = useMemo(() => scoreProfile(answers), [answers])
  const isComplete = Boolean(answers.oil && answers.comfort && answers.sensitivity && answers.concerns.length)

  useEffect(() => { window.localStorage.setItem('kanyo-assessment', JSON.stringify(answers)) }, [answers])

  const finishAssessment = () => { setAssessing(false); setTab('skin') }
  const toggleConcern = (value: string) => setAnswers(a => ({ ...a, concerns: a.concerns.includes(value) ? a.concerns.filter(x => x !== value) : [...a.concerns, value] }))
  const filtered = products.filter(p => `${p.brand} ${p.name} ${p.category}`.toLowerCase().includes(query.toLowerCase()))

  return <main>
    <header className="topbar">
      <button className="wordmark" onClick={() => setTab('discover')} aria-label="Kanyo home"><span>k</span>anyo</button>
      <nav aria-label="Main navigation">{(['discover', 'skin', 'products', 'journal'] as Tab[]).map(item => <button key={item} className={tab === item ? 'active' : ''} onClick={() => setTab(item)}>{t[item === 'skin' ? 'mySkin' : item]}</button>)}</nav>
      <button className="language" onClick={() => setLocale(locale === 'en' ? 'fr' : 'en')}>{locale === 'en' ? 'FR' : 'EN'}</button>
    </header>

    {tab === 'discover' && <>
      <section className="hero">
        <div className="hero-copy"><p className="eyebrow">{t.eyebrow}</p><h1>{t.headline}</h1><p className="lede">{t.intro}</p><div className="actions"><button className="button primary" onClick={() => { setAssessing(true); setStep(0) }}>{t.start}</button><button className="button ghost" onClick={() => setTab('products')}>{t.explore} <span>→</span></button></div><p className="disclaimer">{t.note}</p></div>
        <div className="hero-art" aria-hidden="true"><div className="orb one"/><div className="orb two"/><div className="routine-card"><span>your routine</span><b>clear, calm, yours</b><div className="mini-progress"><i/><i/><i/></div></div></div>
      </section>
      <section className="principles"><div><b>01</b><h3>Observed, not assumed</h3><p>We begin with what you see and feel—not a label you need to know.</p></div><div><b>02</b><h3>Clear reasons</h3><p>Every product match comes with its why and its cautions.</p></div><div><b>03</b><h3>Always evolving</h3><p>Your recommendations change when your skin, routine or priorities do.</p></div></section>
    </>}

    {tab === 'skin' && <section className="page"><div className="page-heading"><p className="eyebrow">{t.profile}</p><h2>{isComplete ? t.completed : t.answer}</h2><p>{t.profileText}</p>{!isComplete && <button className="button primary" onClick={() => setAssessing(true)}>{t.start}</button>}</div>
      {isComplete && <><div className="profile-grid"><article className="profile-card featured"><span>Skin balance</span><strong>{profile.oiliness}</strong><small>Based on your end-of-day skin feel</small></article><article className="profile-card"><span>Hydration</span><strong>{profile.hydration}</strong><small>Comfort after cleansing</small></article><article className="profile-card"><span>Sensitivity</span><strong>{profile.sensitivity}</strong><small>New-product reaction history</small></article></div>
      <div className="two-col"><section className="panel"><div className="section-title"><div><p className="eyebrow">{t.needs}</p><h3>Start gently, then build</h3></div><button className="text-button" onClick={() => setAssessing(true)}>Update profile</button></div><ul className="needs">{profile.barrier && <li><b>Comfort first</b><span>Keep the routine simple and avoid stacking strong treatments while skin feels reactive.</span></li>}{profile.dehydration && <li><b>Hydration support</b><span>Layer a humectant serum under a moisturiser that feels comfortable for your skin.</span></li>}{answers.concerns.includes('clarity') && <li><b>Clarity, slowly</b><span>Introduce one targeted active at a time and monitor your skin.</span></li>}{!profile.barrier && <li><b>Consistent protection</b><span>Make daily broad-spectrum sun protection your routine anchor.</span></li>}</ul></section>
      <section className="panel routine"><p className="eyebrow">{t.routine}</p><div><span>AM</span><p>Cleanse if needed · Hydrate · Moisturise · SPF</p></div><div><span>PM</span><p>Cleanse · One targeted product when appropriate · Moisturise</p></div><button className="button ghost" onClick={() => setTab('products')}>See your matches →</button></section></div></>}</section>}

    {tab === 'products' && <section className="page"><div className="page-heading compact"><p className="eyebrow">Product library</p><h2>Know what you’re choosing.</h2><p>Product information, ingredient context and your personal fit—kept clearly separate.</p></div><div className="toolbar"><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search products, brands or categories" aria-label="Search products"/><span>{filtered.length} products</span></div><div className="product-grid">{filtered.map(product => { const match = fit(product, answers); return <article className="product-card" key={product.id}><div className="product-visual"><span>{product.category}</span><b>{product.name.split(' ').map(w => w[0]).join('')}</b></div><div className="product-content"><small>{product.brand}</small><h3>{product.name}</h3><p>{product.label}</p><div className={`match ${match.status}`}>{match.status === 'compatible' ? t.compatible : match.status === 'caution' ? t.caution : t.maybe}</div><button className="text-button" onClick={() => setSelected(product)}>{t.details} →</button></div></article>})}</div></section>}

    {tab === 'journal' && <section className="page"><div className="page-heading compact"><p className="eyebrow">Your product journal</p><h2>Remember what worked for you.</h2><p>Keep your personal notes private, or share a helpful review with the community.</p></div><div className="two-col"><section className="panel journal"><p className="eyebrow">{t.private} note</p><h3>What did you notice?</h3><textarea value={privateNote} onChange={e => setPrivateNote(e.target.value)} placeholder="How did your skin feel? What would you change next time?"/><button className="button primary" onClick={() => { setSavedNote(privateNote); setPrivateNote('') }}>{t.save}</button>{savedNote && <p className="saved">Saved privately: “{savedNote}”</p>}</section><section className="panel journal"><p className="eyebrow">{t.public} review</p><h3>Share your experience</h3><textarea value={review} onChange={e => setReview(e.target.value)} placeholder="Keep it kind, specific and based on your own experience."/><button className="button ghost" onClick={() => { if (review.trim()) { setReviews([review, ...reviews]); setReview('') } }}>{t.review}</button><div className="reviews">{reviews.map((item, index) => <blockquote key={`${item}-${index}`}>“{item}”<small>Community member · verified draft experience</small></blockquote>)}</div></section></div></section>}

    {assessing && <div className="modal-backdrop" role="presentation"><section className="assessment" role="dialog" aria-modal="true" aria-label="Skin assessment"><button className="close" onClick={() => setAssessing(false)} aria-label="Close">×</button><p className="eyebrow">{locale === 'en' ? 'Your skin assessment' : 'Votre bilan peau'}</p><div className="progress"><i style={{ width: `${((step + 1) / 5) * 100}%` }}/></div>
      {step < 3 && <div className="question"><span>{locale === 'en' ? `Question ${step + 1} of 5` : `Question ${step + 1} sur 5`}</span><h2>{questions[step].title[locale]}</h2><div className="answers">{questions[step].options.map(option => <button key={option.v} className={answers[questions[step].key as keyof Answers] === option.v ? 'selected' : ''} onClick={() => { setAnswers(a => ({ ...a, [questions[step].key]: option.v })); setStep(step + 1) }}>{option[locale]}</button>)}</div></div>}
      {step === 3 && <div className="question"><span>{locale === 'en' ? 'Question 4 of 5' : 'Question 4 sur 5'}</span><h2>{locale === 'en' ? 'What would you like to improve first?' : 'Qu’aimeriez-vous améliorer en premier ?'}</h2><p>{locale === 'en' ? 'Choose one or more priorities.' : 'Choisissez une ou plusieurs priorités.'}</p><div className="answers multi">{concerns.map(([value, en, fr]) => <button key={value} className={answers.concerns.includes(value) ? 'selected' : ''} onClick={() => toggleConcern(value)}>{locale === 'en' ? en : fr}</button>)}</div><button className="button primary" disabled={!answers.concerns.length} onClick={() => setStep(4)}>{locale === 'en' ? 'Continue' : 'Continuer'}</button></div>}
      {step === 4 && <div className="question"><span>{locale === 'en' ? 'Question 5 of 5' : 'Question 5 sur 5'}</span><h2>{locale === 'en' ? 'How simple should your routine feel?' : 'Quelle simplicité souhaitez-vous pour votre routine ?'}</h2><div className="answers">{[{v:'simple',en:'2–3 products, ultra simple',fr:'2–3 produits, très simple'},{v:'balanced',en:'3–4 products, simple',fr:'3–4 produits, simple'},{v:'full',en:'A complete routine is fine',fr:'Une routine complète me convient'}].map(option => <button key={option.v} className={answers.routine === option.v ? 'selected' : ''} onClick={() => setAnswers(a => ({...a, routine: option.v}))}>{option[locale]}</button>)}</div><button className="button primary" disabled={!answers.routine} onClick={finishAssessment}>{locale === 'en' ? 'See my profile' : 'Voir mon profil'}</button></div>}
    </section></div>}

    {selected && <div className="modal-backdrop" role="presentation"><section className="product-modal" role="dialog" aria-modal="true" aria-label={selected.name}><button className="close" onClick={() => setSelected(null)} aria-label="Close">×</button><div className="modal-product-visual"><span>{selected.category}</span><b>{selected.name.split(' ').map(w => w[0]).join('')}</b></div><div className="modal-body"><p className="eyebrow">{selected.brand}</p><h2>{selected.name}</h2><p>{selected.description}</p>{(() => { const match = fit(selected, answers); return <div className={`match large ${match.status}`}><b>{match.status === 'compatible' ? t.compatible : match.status === 'caution' ? t.caution : t.maybe}</b><ul>{match.reasons.map(r => <li key={r}>{r}</li>)}</ul></div>})()}<div className="ingredient-list"><div><h3>Ingredient overview</h3><p>{selected.ingredients.join(' · ')}</p></div><div><h3>{t.transparency}</h3><strong>{selected.transparency}/100</strong><small>Completeness of available product data</small></div><div><h3>{t.community}</h3><strong>{selected.community}/5</strong><small>From community experiences</small></div></div><p className="disclaimer">{t.note}</p></div></section></div>}
  </main>
}
