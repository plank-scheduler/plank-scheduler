import { useEffect, useRef, useState } from 'react';
import Head from 'next/head';
import BookingIcon from './BookingIcon';
import { CATEGORIES, PHONE, TIME_OPTIONS, photoError, selectedServices, todayISO } from '../lib/booking-options';
import s from './ServiceBooking.module.css';

type InstallPrompt = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };
const initialCustomer = { name: '', phone: '', email: '', address: '', city: '', state: 'MO', zip: '' };

export default function ServiceBooking() {
  const [active, setActive] = useState<string[]>([]);
  const [selections, setSelections] = useState<Record<string, string[]>>({});
  const [customer, setCustomer] = useState(initialCustomer);
  const [date, setDate] = useState('');
  const [time, setTime] = useState(TIME_OPTIONS[0]);
  const [plan, setPlan] = useState('Please recommend');
  const [notes, setNotes] = useState('');
  const [problem, setProblem] = useState('');
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoMessage, setPhotoMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [stage, setStage] = useState('');
  const [receipt, setReceipt] = useState('');
  const [install, setInstall] = useState<InstallPrompt | null>(null);
  const [installHelp, setInstallHelp] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [device, setDevice] = useState<'ios' | 'android' | 'desktop'>('desktop');
  const submitLock = useRef(false);
  const uploaded = useRef(new Map<File, string>());
  const errorRef = useRef<HTMLDivElement>(null);
  const receiptRef = useRef<HTMLDivElement>(null);
  const selected = selectedServices(selections);
  if (problem.trim()) selected.service = [selected.service, 'Help with an unidentified pest or other problem'].filter(Boolean).join('; ');
  const count = Object.values(selections).reduce((sum, list) => sum + list.length, 0) + (problem.trim() ? 1 : 0);

  useEffect(() => {
    const onPrompt = (e: Event) => { e.preventDefault(); setInstall(e as InstallPrompt); };
    const onInstalled = () => { setInstalled(true); setInstall(null); };
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    setInstalled(window.matchMedia('(display-mode: standalone)').matches);
    setDevice(/iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1) ? 'ios' : /Android/.test(navigator.userAgent) ? 'android' : 'desktop');
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {});
    return () => { window.removeEventListener('beforeinstallprompt', onPrompt); window.removeEventListener('appinstalled', onInstalled); };
  }, []);
  useEffect(() => { if (error) errorRef.current?.focus(); }, [error]);
  useEffect(() => { if (receipt) receiptRef.current?.focus(); }, [receipt]);

  function toggleCategory(id: string) {
    if (active.includes(id)) {
      setActive(active.filter(x => x !== id));
      setSelections({ ...selections, [id]: [] });
    } else setActive([...active, id]);
  }
  function toggleOption(category: string, value: string) {
    const list = selections[category] || [];
    setSelections({ ...selections, [category]: list.includes(value) ? list.filter(x => x !== value) : [...list, value] });
  }
  function startInspection() {
    if (!active.includes('inspection')) setActive([...active, 'inspection']);
    document.getElementById('services')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  async function addToDevice() {
    if (install) {
      try { await install.prompt(); await install.userChoice; setInstall(null); }
      catch { setInstallHelp(true); }
    } else setInstallHelp(!installHelp);
  }
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitLock.current) return;
    setError('');
    if (!count) { setError('Choose a service or tell us what’s happening in the problem description.'); return; }
    if (selections.pest?.includes('other') && !notes.trim() && !problem.trim()) { setError('Please describe what you need in the problem description or notes.'); return; }
    if (date && date < todayISO()) { setError('Please choose today or a future date, or leave the date open.'); return; }
    if (photoMessage) { setError(photoMessage); return; }
    submitLock.current = true;
    setBusy(true);
    try {
      const photoUrls: string[] = [];
      for (const file of photos) {
        setStage('Uploading photos…');
        let url = uploaded.current.get(file);
        if (!url) {
          const base64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result));
            reader.onerror = () => reject(new Error('This photo could not be read. Remove it and try again.'));
            reader.readAsDataURL(file);
          });
          const response = await fetch('/api/upload-photo', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fileName: file.name, base64 }) });
          const result = await response.json();
          if (!response.ok || !result.ok || !result.url) throw new Error('Your photo could not be uploaded. Please retry, or remove the photos to send your request without them.');
          url = String(result.url);
          uploaded.current.set(file, url);
        }
        photoUrls.push(url);
      }
      setStage('Sending your request…');
      const response = await fetch('/api/appointments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ customer: { ...customer, address: [customer.address, customer.city, customer.state, customer.zip].filter(Boolean).join(', ') }, ...selected, date, time, plan, notes: [problem.trim() ? `Customer’s concern: ${problem.trim()}` : '', notes.trim()].filter(Boolean).join('\n\n'), photoUrls }) });
      const result = await response.json();
      if (!response.ok || !result.ok || !result.id) throw new Error(result.error || `We couldn’t confirm your request. Please call or text ${PHONE} before trying again.`);
      setReceipt(String(result.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : `We couldn’t confirm your request. Please call or text ${PHONE} before trying again.`);
    } finally { submitLock.current = false; setBusy(false); setStage(''); }
  }

  return <div className={s.page}>
    <Head><title>Request Service & Free Inspections | Plank Termite & Pest Control</title><meta name="description" content="Request pest control, Sentricon, WDI reports, wildlife service, insulation, vapor barriers and lighting in Central Missouri. Free termite, moisture and insulation inspections available."/><meta name="viewport" content="width=device-width, initial-scale=1"/></Head>
    <a className={s.skip} href="#request">Skip to service request</a>
    <header className={s.header}>
      <a href="https://plankpest.com/" aria-label="Plank Termite and Pest Control home" className={s.brand}><img src="/plank-logo.jpg" width="281" height="217" alt="Plank Termite & Pest Control LLC"/></a>
      <div className={s.headerRight}><span>LOCAL PEOPLE. PERSONAL SERVICE.</span><a href="tel:5733683333">{PHONE} <span aria-hidden="true">↗</span></a></div>
    </header>
    <main id="request">
      <section className={s.hero}>
        <div className={s.heroCopy}><p className={s.eyebrow}>YOUR CENTRAL MISSOURI SERVICE TEAM</p><h1>A better place<br/>starts at home.</h1><p className={s.intro}>From pests to protection to a brighter holiday season. Tell us what you need—we’ll help with the next step.</p>
          <div className={s.heroActions}><button type="button" className={s.primary} onClick={startInspection}>Request a free inspection <span aria-hidden="true">↗</span></button><div className={s.contactLinks}><span>Prefer to talk or text?</span><a href="tel:5733683333">Call us →</a><a href="sms:5733683333">Text us →</a></div></div>
          <div className={s.trust}><span>Locally owned</span><span>Homes & businesses</span><span>Central Missouri</span></div>
        </div>
        <aside className={s.heroPanel}><BookingIcon name="home"/><p className={s.eyebrow}>ONE LOCAL TEAM</p><h2>Protection. <br/>Comfort.<br/><em>A little more peace of mind.</em></h2><p>Pest & termite control · Insulation <br/>Vapor barriers · Outdoor lighting</p></aside>
      </section>
      {receipt ? <section className={s.receipt} ref={receiptRef} tabIndex={-1} aria-labelledby="receipt-title"><span className={s.receiptIcon}>✓</span><p className={s.eyebrow}>REQUEST RECEIVED · #{receipt}</p><h2 id="receipt-title">Thank you, {customer.name.split(' ')[0]}.</h2><p>Our office will contact you to confirm your service and appointment. Your preferred date and time are a request, not a confirmed booking.</p><div className={s.summary}>{Object.values(selected).filter(Boolean).map(value => <p key={value}>{value}</p>)}</div><p>Questions? <a href="tel:5733683333">Call</a> or <a href="sms:5733683333">text</a> {PHONE}.</p></section> :
      <form onSubmit={submit} className={s.form}>
        <fieldset disabled={busy} className={s.formBody}>
          <section id="services" className={s.section} aria-labelledby="service-title"><div className={s.sectionHeading}><span className={s.step}>01</span><div><p className={s.eyebrow}>LET’S START HERE</p><h2 id="service-title">How can we help?</h2><p>Choose one or more categories, then select the services you need.</p></div></div>
            <div className={s.categoryGrid}>{CATEGORIES.map(category => <button type="button" key={category.id} className={`${s.category} ${active.includes(category.id) ? s.chosen : ''}`} aria-expanded={active.includes(category.id)} aria-controls={`options-${category.id}`} onClick={() => toggleCategory(category.id)}><span className={s.categoryTop}><BookingIcon name={category.icon}/><span aria-hidden="true" className={s.selectMark}>{active.includes(category.id) ? '−' : '+'}</span></span><strong>{category.title}</strong><span>{category.description}</span></button>)}</div>
            <div className={s.problemBox}><label htmlFor="problem">Not sure what you need? Tell us what’s happening.</label><p id="problem-help">You don’t need to know the bug’s name or choose a service. Describe the problem below and we’ll help you figure out the next step.</p><p>Need a pest identified? <a href="sms:5733683333">Text us photos at {PHONE}</a>. Attach your images in your messaging app.</p><textarea id="problem" name="problem" aria-describedby="problem-help" rows={3} maxLength={1000} value={problem} onChange={e=>setProblem(e.target.value)} placeholder="For example: I’m seeing small bugs around my kitchen window, or I’d like someone to check my crawl space."/></div>
            {CATEGORIES.filter(c => active.includes(c.id)).map(category => <fieldset id={`options-${category.id}`} key={category.id} className={s.options}><legend>{category.title}</legend>{category.id === 'inspection' && <p>Choose a free termite, moisture or insulation inspection. WDI inspection reports are a separate service under Termites & Wood Destroying Insects.</p>}<div className={s.optionGroups}>{category.groups.map(group => <div key={group.group}><h3>{group.group}</h3>{group.options.map(option => <label className={s.option} key={option.value}><input type="checkbox" checked={!!selections[category.id]?.includes(option.value)} onChange={() => toggleOption(category.id, option.value)}/><span>{option.label}</span></label>)}</div>)}</div></fieldset>)}
            <p className={s.selectionCount} aria-live="polite">{count ? `${count} request item${count === 1 ? '' : 's'} selected` : 'Choose a service or describe your problem above.'}</p>
          </section>
          <div className={s.lowerGrid}><div>
            <section className={s.section} aria-labelledby="contact-title"><div className={s.sectionHeading}><span className={s.step}>02</span><div><p className={s.eyebrow}>A FEW DETAILS</p><h2 id="contact-title">Where can we help?</h2><p>Required fields are marked with an asterisk.</p></div></div><div className={s.fields}>
              <label className={s.full}>Full name *<input name="name" autoComplete="name" required maxLength={150} value={customer.name} onChange={e => setCustomer({...customer,name:e.target.value})}/></label>
              <label>Phone *<input name="phone" type="tel" autoComplete="tel" required minLength={7} maxLength={30} value={customer.phone} onChange={e => setCustomer({...customer,phone:e.target.value})}/></label>
              <label>Email *<input name="email" type="email" autoComplete="email" required maxLength={254} value={customer.email} onChange={e => setCustomer({...customer,email:e.target.value})}/></label>
              <label className={s.full}>Service address *<input name="address" autoComplete="street-address" required maxLength={250} value={customer.address} onChange={e => setCustomer({...customer,address:e.target.value})}/></label>
              <label>City *<input name="city" autoComplete="address-level2" required maxLength={100} value={customer.city} onChange={e => setCustomer({...customer,city:e.target.value})}/></label>
              <div className={s.stateZip}><label>State *<input name="state" autoComplete="address-level1" required maxLength={2} value={customer.state} onChange={e => setCustomer({...customer,state:e.target.value.toUpperCase()})}/></label><label>ZIP code *<input name="zip" autoComplete="postal-code" inputMode="numeric" required pattern="[0-9]{5}(-[0-9]{4})?" maxLength={10} value={customer.zip} onChange={e => setCustomer({...customer,zip:e.target.value})}/></label></div>
            </div></section>
            <section className={s.section} aria-labelledby="visit-title"><div className={s.sectionHeading}><span className={s.step}>03</span><div><p className={s.eyebrow}>ON YOUR SCHEDULE</p><h2 id="visit-title">Plan your visit.</h2><p>Share your preference. We’ll contact you to confirm availability.</p></div></div><div className={s.fields}><label>Preferred date <span>(optional)</span><input name="date" type="date" min={todayISO()} value={date} onChange={e=>setDate(e.target.value)}/></label><label>Preferred time<select name="time" value={time} onChange={e=>setTime(e.target.value)}>{TIME_OPTIONS.map(t=><option key={t}>{t}</option>)}</select></label><label className={s.full}>Service frequency<select name="plan" value={plan} onChange={e=>setPlan(e.target.value)}>{['Please recommend','First visit','One-time','Monthly','Quarterly','Three times a year','Twice a year','Annual'].map(p=><option key={p}>{p}</option>)}</select></label><label className={s.full}>Anything else we should know? <span>(optional)</span><textarea name="notes" rows={4} maxLength={2800} value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Tell us what you’ve noticed, where it’s happening, or how we can help."/></label></div>
              <div className={s.upload}><label htmlFor="photos">Add photos <span>(optional)</span></label><p id="photo-help">Up to 3 photos · JPG, PNG or WebP · 3 MB each</p><input id="photos" type="file" accept="image/jpeg,image/png,image/webp" multiple aria-describedby="photo-help photo-error" onChange={e=>{const files=Array.from(e.target.files || []);const message=photoError(files);setPhotoMessage(message);setPhotos(message?[]:files);}}/>{photoMessage && <p id="photo-error" role="alert" className={s.photoError}>{photoMessage}</p>}{photos.length>0 && <ul>{photos.map(file=><li key={file.name+file.size}>{file.name}</li>)}</ul>}{(photos.length>0 || photoMessage) && <button type="button" onClick={()=>{setPhotos([]);setPhotoMessage('');const input=document.getElementById('photos') as HTMLInputElement;if(input)input.value='';}}>Remove photos</button>}</div>
            </section>
          </div><aside className={s.sidebar}><div className={s.nextCard}><p className={s.eyebrow}>WHAT HAPPENS NEXT</p><h2>A real person.<br/>A clear next step.</h2><ol><li><strong>Send your request</strong><span>Tell us about your property and the help you need.</span></li><li><strong>We get in touch</strong><span>Our office reviews your request and confirms the details.</span></li><li><strong>We plan your visit</strong><span>We agree on the service and appointment before work begins.</span></li></ol><div className={s.contactLinks}><span>Questions? {PHONE}</span><a href="tel:5733683333">Call us ↗</a><a href="sms:5733683333">Text us ↗</a></div></div><div className={s.area}><h3>Local service. Close to home.</h3><p>Rolla · Sullivan · Lebanon<br/>Waynesville · St. Robert<br/>Camdenton · Osage Beach<br/>and surrounding Central Missouri communities.</p></div></aside></div>
          <div className={s.submitArea}>{error && <div ref={errorRef} tabIndex={-1} role="alert" className={s.error}>{error}</div>}<p>By sending this request, you’re asking Plank to contact you about service. Your appointment is confirmed when our office contacts you.</p><button className={s.primary} type="submit" disabled={busy}>{busy?stage:'Send service request'} <span aria-hidden="true">→</span></button><span className={s.status} role="status">{busy ? stage : 'No payment is collected here.'}</span></div>
        </fieldset>
      </form>}
      <section className={s.saveCard}><div><p className={s.eyebrow}>KEEP PLANK HANDY</p><h2>Your local team. One tap away.</h2><p>Add this service page to your phone or computer for next time.</p></div><button className={s.secondary} type="button" onClick={addToDevice} disabled={installed}>{installed?'Added to your device':'Add to my device'} <span aria-hidden="true">↗</span></button>{installHelp && <div className={s.installHelp}><h3>Add Plank to your device</h3>{device === 'ios' && <p><strong>iPhone or iPad:</strong> Open this link in Safari. Tap Share, then Add to Home Screen and Add.</p>}{device === 'android' && <p><strong>Android:</strong> Open this link in Chrome. Open the menu and choose Add to Home screen or Install app.</p>}{device === 'desktop' && <p><strong>Computer:</strong> In Chrome or Edge, use the install option in the address bar or browser menu. If it isn’t available, bookmark this page.</p>}<p>An internet connection is needed to send a request.</p></div>}</section>
    </main>
    <footer className={s.footer}><span>PLANK TERMITE & PEST CONTROL LLC</span><nav aria-label="Footer"><a href="https://plankpest.com/">Our website ↗</a><a href="tel:5733683333">{PHONE}</a><a href="https://plankpest.com/privacy-policy/privacy-terms/?back=privacy_policy">Privacy</a></nav><p>Serving homes and businesses across Central Missouri.</p></footer>
  </div>;
}

