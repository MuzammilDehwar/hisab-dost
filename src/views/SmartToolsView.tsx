import React, { useMemo, useState } from 'react';
import { AlertTriangle, BarChart3, CheckCircle2, ClipboardCheck, Mic, PackageSearch, Sparkles, WalletCards } from 'lucide-react';
import { Customer, CustomerTransaction, Expense, Language, Product, Purchase, Sale, ShopSettings } from '../types';
import { formatPKR, getTodayDateString } from '../utils/formatters';

type RecognitionResult = { results: ArrayLike<{ 0: { transcript: string } }> };
type Recognition = { lang: string; continuous: boolean; interimResults: boolean; onresult: ((event: RecognitionResult) => void) | null; onerror: (() => void) | null; onend: (() => void) | null; start: () => void; stop: () => void };
type RecognitionConstructor = new () => Recognition;

type Props = {
  sales: Sale[];
  expenses: Expense[];
  customers: Customer[];
  transactions: CustomerTransaction[];
  products: Product[];
  purchases: Purchase[];
  settings: ShopSettings;
  language: Language;
  onAddCustomerTransaction: (customerId: string, type: 'gave_credit' | 'got_payment', amount: number, date: string, notes?: string) => void;
  onUpdateSettings: (settings: ShopSettings) => void;
};

export const SmartToolsView: React.FC<Props> = ({ sales, expenses, customers, transactions, products, purchases, settings, language, onAddCustomerTransaction, onUpdateSettings }) => {
  const urdu = language === 'ur';
  const today = getTodayDateString();
  const [voiceText, setVoiceText] = useState('');
  const [voiceStatus, setVoiceStatus] = useState('');
  const [voiceListening, setVoiceListening] = useState(false);
  const [openingCash, setOpeningCash] = useState(String(settings.cashHandover?.date === today ? settings.cashHandover.openingCash : ''));
  const [countedCash, setCountedCash] = useState('');

  const todaySales = sales.filter((sale) => sale.date === today);
  const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = yesterday.toISOString().slice(0, 10);
  const yesterdaySales = sales.filter((sale) => sale.date === yesterdayKey);
  const todayCashSales = todaySales.filter((sale) => sale.paymentType === 'cash').reduce((sum, sale) => sum + sale.amount, 0);
  const todayPayments = transactions.filter((tx) => tx.type === 'got_payment' && tx.date === today).reduce((sum, tx) => sum + tx.amount, 0);
  const todayCashExpenses = expenses.filter((expense) => expense.date === today && expense.paymentMethod === 'cash').reduce((sum, expense) => sum + expense.amount, 0);
  const expectedCash = Number(openingCash || 0) + todayCashSales + todayPayments - todayCashExpenses;

  const reorderItems = useMemo(() => products.map((product) => {
    const sold = sales.filter((sale) => sale.items?.some((item) => item.productId === product.id && sale.date >= yesterdayKey)).reduce((sum, sale) => sum + (sale.items?.filter((item) => item.productId === product.id).reduce((qty, item) => qty + item.quantity, 0) || 0), 0);
    const dailyAverage = sold / 2;
    const daysLeft = dailyAverage > 0 ? product.stockQuantity / dailyAverage : (product.stockQuantity <= product.minStockThreshold ? 0 : 99);
    return { product, daysLeft, suggested: Math.max(0, Math.ceil((dailyAverage * 7) - product.stockQuantity)) };
  }).filter(({ product, daysLeft }) => product.stockQuantity <= product.minStockThreshold || daysLeft <= 7).sort((a, b) => a.daysLeft - b.daysLeft), [products, sales, yesterdayKey]);

  const advisor = useMemo(() => {
    const messages: string[] = [];
    if (todaySales.length === 0) messages.push(urdu ? 'آج ابھی کوئی فروخت درج نہیں ہوئی۔' : 'No sale has been recorded today yet.');
    else if (todaySales.reduce((sum, sale) => sum + sale.amount, 0) >= yesterdaySales.reduce((sum, sale) => sum + sale.amount, 0)) messages.push(urdu ? 'آج کی فروخت کل کے مقابلے میں بہتر ہے۔' : 'Today’s sales are matching or beating yesterday.');
    else messages.push(urdu ? 'آج کی فروخت کل سے کم ہے؛ top products کی display چیک کریں۔' : 'Sales are below yesterday; check your best-selling product display.');
    const due = customers.filter((customer) => customer.balance > 0);
    if (due.length) messages.push(urdu ? `${due.length} گاہکوں سے رقم لینی ہے۔` : `${due.length} customers have outstanding balances.`);
    if (reorderItems.length) messages.push(urdu ? `${reorderItems.length} آئٹمز دوبارہ منگوانے کے قریب ہیں۔` : `${reorderItems.length} items need a reorder check.`);
    return messages;
  }, [customers, reorderItems.length, todaySales, yesterdaySales, urdu]);

  const rateAlerts = useMemo(() => purchases.reduce<{ name: string; old: number; latest: number }[]>((alerts, purchase) => {
    const same = purchases.filter((item) => item.productId === purchase.productId && item.productName === purchase.productName).sort((a, b) => b.date.localeCompare(a.date));
    if (same.length > 1 && same[0].id === purchase.id && same[0].unitCost !== same[1].unitCost && !alerts.some((alert) => alert.name === purchase.productName)) alerts.push({ name: purchase.productName, old: same[1].unitCost, latest: same[0].unitCost });
    return alerts;
  }, []), [purchases]);

  const startVoice = () => {
    const RecognitionClass = (window as Window & { SpeechRecognition?: RecognitionConstructor; webkitSpeechRecognition?: RecognitionConstructor }).SpeechRecognition || (window as Window & { webkitSpeechRecognition?: RecognitionConstructor }).webkitSpeechRecognition;
    if (!RecognitionClass) { setVoiceStatus(urdu ? 'اس browser میں voice typing available نہیں۔' : 'Voice typing is not supported in this browser.'); return; }
    const recognition = new RecognitionClass(); recognition.lang = urdu ? 'ur-PK' : 'en-US'; recognition.continuous = false; recognition.interimResults = false;
    setVoiceListening(true); setVoiceStatus(urdu ? 'بولیں: احمد کے کھاتے میں 1200 لکھ دو' : 'Speak: add 1200 to Ahmed ledger');
    recognition.onresult = (event) => { const text = event.results[0]?.[0]?.transcript || ''; setVoiceText(text); setVoiceListening(false); setVoiceStatus(urdu ? 'آواز سمجھ لی گئی، save سے پہلے تصدیق کریں۔' : 'Voice understood. Review before saving.'); };
    recognition.onerror = () => { setVoiceListening(false); setVoiceStatus(urdu ? 'آواز دوبارہ ریکارڈ کریں۔' : 'Please try the voice command again.'); };
    recognition.onend = () => setVoiceListening(false); recognition.start();
  };
  const parsedVoice = useMemo(() => {
    const amountMatch = voiceText.replace(/,/g, '').match(/\d+(?:\.\d+)?/);
    const amount = amountMatch ? Number(amountMatch[0]) : 0;
    const customer = customers.find((item) => voiceText.toLowerCase().includes(item.name.toLowerCase()));
    return { amount, customer };
  }, [customers, voiceText]);
  const saveVoiceEntry = () => { if (parsedVoice.customer && parsedVoice.amount > 0) { onAddCustomerTransaction(parsedVoice.customer.id, 'gave_credit', parsedVoice.amount, today, `Voice Khata: ${voiceText}`); setVoiceText(''); setVoiceStatus(urdu ? 'کھاتے میں محفوظ ہو گیا۔' : 'Added to customer ledger.'); } };

  const saveOpening = () => { const amount = Number(openingCash); if (Number.isFinite(amount) && amount >= 0) onUpdateSettings({ ...settings, cashHandover: { date: today, openingCash: amount } }); };
  const closeDay = () => { const amount = Number(countedCash); if (Number.isFinite(amount) && amount >= 0) onUpdateSettings({ ...settings, cashHandover: { date: today, openingCash: Number(openingCash || 0), closingCash: amount, closedAt: new Date().toISOString() } }); };
  const cashDifference = Number(countedCash || 0) - expectedCash;

  return <div className="space-y-4 pb-20 sm:pb-8 animate-fade-in">
    <section className="rounded-2xl bg-gradient-to-br from-violet-900 via-indigo-900 to-slate-950 p-5 text-white shadow-lg"><div className="flex items-start gap-3"><div className="grid h-11 w-11 place-items-center rounded-2xl bg-white/15"><Sparkles className="h-6 w-6 text-amber-300" /></div><div><h2 className="text-xl font-black">{urdu ? 'Hisab Dost Smart Tools' : 'Hisab Dost Smart Tools'}</h2><p className="mt-1 text-xs leading-5 text-indigo-100">{urdu ? 'صرف حساب نہیں—روزانہ کے business فیصلوں میں مدد۔' : 'Practical insights for better daily shop decisions.'}</p></div></div></section>

    <section className="rounded-2xl border border-indigo-100 bg-white p-4 shadow-xs"><div className="flex items-center justify-between gap-3"><div><h3 className="flex items-center gap-2 font-black text-slate-900"><Mic className="h-5 w-5 text-violet-700" />{urdu ? 'Voice Khata' : 'Voice Khata'}</h3><p className="mt-1 text-xs text-slate-500">{urdu ? 'بول کر customer کا ادھار لکھیں، save سے پہلے confirmation۔' : 'Speak a customer credit entry and review it before saving.'}</p></div><button type="button" onClick={startVoice} className={`rounded-xl px-3 py-2 text-xs font-bold text-white ${voiceListening ? 'bg-rose-600' : 'bg-violet-700'}`}>{voiceListening ? 'Listening…' : urdu ? 'بولیں' : 'Speak'}</button></div>{voiceText && <div className="mt-3 rounded-xl bg-violet-50 p-3 text-sm"><p className="font-semibold text-slate-800">“{voiceText}”</p><p className="mt-1 text-xs text-slate-600">{parsedVoice.customer ? `${parsedVoice.customer.name} · ₨ ${formatPKR(parsedVoice.amount)}` : urdu ? 'Customer name اور رقم دوبارہ چیک کریں۔' : 'Check customer name and amount.'}</p>{parsedVoice.customer && parsedVoice.amount > 0 && <button type="button" onClick={saveVoiceEntry} className="mt-2 rounded-lg bg-emerald-700 px-3 py-2 text-xs font-bold text-white">{urdu ? 'کھاتے میں محفوظ کریں' : 'Confirm ledger entry'}</button>}</div>}<p className="mt-2 text-[11px] text-slate-500">{voiceStatus}</p></section>

    <div className="grid gap-4 lg:grid-cols-2"><section className="rounded-2xl border border-amber-100 bg-white p-4 shadow-xs"><h3 className="flex items-center gap-2 font-black text-slate-900"><PackageSearch className="h-5 w-5 text-amber-700" />{urdu ? 'Smart Reorder Advisor' : 'Smart Reorder Advisor'}</h3><p className="mt-1 text-xs text-slate-500">{urdu ? 'حالیہ فروخت اور stock کی بنیاد پر۔' : 'Based on recent sales velocity and current stock.'}</p>{reorderItems.length ? <div className="mt-3 space-y-2">{reorderItems.slice(0, 6).map(({ product, daysLeft, suggested }) => <div key={product.id} className="flex items-center justify-between rounded-xl bg-amber-50 p-3"><div><p className="text-sm font-bold text-slate-900">{product.name}</p><p className="text-[11px] text-slate-600">{daysLeft === 0 ? 'Low / out of stock' : `Approx. ${Math.ceil(daysLeft)} days left`}</p></div><span className="text-end text-xs font-black text-amber-800">Order +{suggested} {product.unit}</span></div>)}</div> : <p className="mt-3 text-sm font-semibold text-emerald-700">{urdu ? 'فی الحال stock ٹھیک ہے۔' : 'No urgent reorder detected.'}</p>}</section><section className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-xs"><h3 className="flex items-center gap-2 font-black text-slate-900"><BarChart3 className="h-5 w-5 text-emerald-700" />{urdu ? 'Daily Business Advisor' : 'Daily Business Advisor'}</h3><div className="mt-3 space-y-2">{advisor.map((message) => <div key={message} className="flex gap-2 rounded-xl bg-emerald-50 p-3 text-xs font-semibold text-emerald-900"><CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-700" />{message}</div>)}</div>{rateAlerts.length > 0 && <div className="mt-3 space-y-2">{rateAlerts.slice(0, 3).map((alert) => <div key={alert.name} className="flex gap-2 rounded-xl bg-rose-50 p-3 text-xs font-semibold text-rose-900"><AlertTriangle className="h-4 w-4 shrink-0 text-rose-700" />{alert.name}: rate changed ₨ {formatPKR(alert.old)} → ₨ {formatPKR(alert.latest)}</div>)}</div>}</section></div>

    <section className="rounded-2xl border border-sky-100 bg-white p-4 shadow-xs"><h3 className="flex items-center gap-2 font-black text-slate-900"><WalletCards className="h-5 w-5 text-sky-700" />{urdu ? 'Dukaan Handover / Cash Closing' : 'Dukaan Handover / Cash Closing'}</h3><p className="mt-1 text-xs text-slate-500">{urdu ? 'دکان شروع کرتے وقت cash لکھیں، آخر میں فرق چیک کریں۔' : 'Record opening cash and reconcile the drawer at closing.'}</p><div className="mt-3 grid gap-2 sm:grid-cols-4"><input type="number" min="0" value={openingCash} onChange={(e) => setOpeningCash(e.target.value)} placeholder={urdu ? 'Opening cash' : 'Opening cash'} className="rounded-xl border p-2.5 text-sm" /><button type="button" onClick={saveOpening} className="rounded-xl bg-sky-700 px-3 py-2 text-xs font-bold text-white">{urdu ? 'شروع محفوظ' : 'Save opening'}</button><input type="number" min="0" value={countedCash} onChange={(e) => setCountedCash(e.target.value)} placeholder={urdu ? 'گنا ہوا cash' : 'Counted cash'} className="rounded-xl border p-2.5 text-sm" /><button type="button" onClick={closeDay} className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-bold text-white">{urdu ? 'دن بند کریں' : 'Close day'}</button></div><div className="mt-3 grid grid-cols-2 gap-2 text-xs"><div className="rounded-xl bg-slate-50 p-3"><span className="block text-slate-500">Expected cash</span><strong className="font-numeric text-slate-900">₨ {formatPKR(expectedCash)}</strong></div><div className={`rounded-xl p-3 ${cashDifference === 0 ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'}`}><span className="block">Difference</span><strong className="font-numeric">₨ {formatPKR(cashDifference)}</strong></div></div></section>

    <section className="rounded-2xl border border-orange-100 bg-orange-50 p-4"><h3 className="flex items-center gap-2 font-black text-orange-950"><ClipboardCheck className="h-5 w-5 text-orange-700" />{urdu ? 'Seasonal Shop Checklist' : 'Seasonal Shop Checklist'}</h3><div className="mt-3 grid gap-2 text-xs font-semibold text-orange-950 sm:grid-cols-2"><span>□ {urdu ? 'fast-moving items کا stock check کریں' : 'Check fast-moving stock'}</span><span>□ {urdu ? 'expired items الگ کریں' : 'Separate expired items'}</span><span>□ {urdu ? 'sale prices review کریں' : 'Review sale prices'}</span><span>□ {urdu ? 'customers کو due reminder بھیجیں' : 'Send due reminders'}</span></div></section>
  </div>;
};
