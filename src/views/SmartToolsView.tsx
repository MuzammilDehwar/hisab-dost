import React, { useMemo, useState } from 'react';
import { AlertTriangle, BarChart3, CheckCircle2, ClipboardCheck, Gauge, Mic, PackageSearch, Share2, Sparkles, TrendingUp, Users, WalletCards } from 'lucide-react';
import { Customer, CustomerTransaction, Expense, ExpenseCategory, Language, Product, Purchase, Sale, ShopSettings } from '../types';
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
  const [shareStatus, setShareStatus] = useState('');
  const [budgetDraft, setBudgetDraft] = useState<Record<string, string>>(() => Object.fromEntries(Object.entries(settings.budgetLimits || {}).map(([key, value]) => [key, String(value)])));
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
  const budgetCategories: ExpenseCategory[] = ['rent', 'utilities', 'transport', 'salary', 'packaging', 'chai_refreshment', 'maintenance', 'other'];
  const budgetLabels: Record<ExpenseCategory, string> = { rent: urdu ? 'کرایہ' : 'Rent', utilities: urdu ? 'بجلی/گیس' : 'Utilities', transport: urdu ? 'ٹرانسپورٹ' : 'Transport', salary: urdu ? 'تنخواہ' : 'Salary', packaging: urdu ? 'پیکنگ' : 'Packaging', chai_refreshment: urdu ? 'چائے/ریفرشمنٹ' : 'Chai', maintenance: urdu ? 'مرمت' : 'Maintenance', other: urdu ? 'دیگر' : 'Other' };
  const predictExpenseCategory = (expense: Expense): ExpenseCategory => {
    if (expense.category !== 'other') return expense.category;
    const text = (expense.notes || '').toLowerCase();
    const rules: Array<[ExpenseCategory, string[]]> = [['rent', ['rent', 'کرایہ', 'kiraya']], ['utilities', ['electric', 'bijli', 'بجلی', 'gas', 'پانی', 'water']], ['transport', ['rickshaw', 'رکشہ', 'fuel', 'petrol', 'delivery', 'transport']], ['salary', ['salary', 'تنخواہ', 'worker', 'مزدور']], ['packaging', ['bag', 'shopper', 'شاپر', 'packing', 'پیک']], ['chai_refreshment', ['chai', 'چائے', 'biscuit', 'بسکٹ', 'refresh']], ['maintenance', ['repair', 'مرمت', 'maintenance', 'مکینک']]];
    return rules.find(([, keywords]) => keywords.some((keyword) => text.includes(keyword)))?.[0] || 'other';
  };
  const currentMonth = today.slice(0, 7);
  const budgetSpend = useMemo(() => expenses.filter((expense) => expense.date.startsWith(currentMonth)).reduce<Record<string, number>>((totals, expense) => { const category = predictExpenseCategory(expense); totals[category] = (totals[category] || 0) + expense.amount; return totals; }, {}), [expenses, currentMonth]);
  const saveBudgets = () => onUpdateSettings({ ...settings, budgetLimits: Object.fromEntries(budgetCategories.map((category) => [category, Number(budgetDraft[category] || 0)]).filter((entry) => Number(entry[1]) > 0)) as Partial<Record<ExpenseCategory, number>> });
  const todayRevenue = todaySales.reduce((sum, sale) => sum + sale.amount, 0);
  const yesterdayRevenue = yesterdaySales.reduce((sum, sale) => sum + sale.amount, 0);
  const todayGrossProfit = todaySales.reduce((sum, sale) => sum + sale.amount - (sale.costAmount || 0), 0) - todayCashExpenses;
  const lowStockCount = products.filter((product) => product.stockQuantity <= product.minStockThreshold).length;
  const riskyCustomers = customers.filter((customer) => customer.balance > 0 && ((customer.creditLimit && customer.balance > customer.creditLimit) || (customer.lastTransactionDate && Date.now() - new Date(customer.lastTransactionDate).getTime() > 30 * 86400000)));
  const totalDue = customers.reduce((sum, customer) => sum + Math.max(0, customer.balance), 0);
  const healthScore = Math.max(0, Math.min(100, 45 + (todayRevenue > 0 ? 20 : 0) + (todayGrossProfit >= 0 ? 15 : -15) + (lowStockCount === 0 ? 10 : 0) + (riskyCustomers.length === 0 ? 10 : -10)));
  const topProduct = useMemo(() => {
    const counts = new Map<string, number>();
    todaySales.forEach((sale) => sale.items?.forEach((item) => counts.set(item.name, (counts.get(item.name) || 0) + item.quantity)));
    return [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
  }, [todaySales]);
  const peakHour = useMemo(() => {
    const counts = new Map<string, number>();
    todaySales.forEach((sale) => { if (sale.time) { const hour = sale.time.slice(0, 2); counts.set(hour, (counts.get(hour) || 0) + sale.amount); } });
    const entry = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
    return entry ? `${entry[0]}:00` : '—';
  }, [todaySales]);
  const shareDailySummary = async () => {
    const summary = `Hisab Dost — ${today}\nSale: Rs. ${todayRevenue}\nEstimated profit: Rs. ${todayGrossProfit}\nCustomer due: Rs. ${totalDue}\nTop item: ${topProduct?.[0] || 'No item data'}`;
    try {
      if (navigator.share) await navigator.share({ title: 'Hisab Dost daily summary', text: summary });
      else { await navigator.clipboard?.writeText(summary); setShareStatus(urdu ? 'خلاصہ clipboard میں copy ہو گیا۔' : 'Summary copied to clipboard.'); }
    } catch { setShareStatus(urdu ? 'Share cancel ہو گیا۔' : 'Share cancelled.'); }
  };

  return <div className="space-y-4 pb-20 sm:pb-8 animate-fade-in">
    <section className="rounded-2xl bg-gradient-to-br from-violet-900 via-indigo-900 to-slate-950 p-5 text-white shadow-lg"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-start gap-3"><div className="grid h-11 w-11 place-items-center rounded-2xl bg-white/15"><Sparkles className="h-6 w-6 text-amber-300" /></div><div><h2 className="text-xl font-black">{urdu ? 'Hisab Dost Smart Tools' : 'Hisab Dost Smart Tools'}</h2><p className="mt-1 text-xs leading-5 text-indigo-100">{urdu ? 'صرف حساب نہیں—روزانہ کے business فیصلوں میں مدد۔' : 'Practical insights for better daily shop decisions.'}</p></div></div><button type="button" onClick={shareDailySummary} className="flex items-center justify-center gap-2 rounded-xl bg-white/15 px-3 py-2 text-xs font-bold hover:bg-white/25"><Share2 className="h-4 w-4" />{urdu ? 'آج کا خلاصہ شیئر' : 'Share daily summary'}</button></div>{shareStatus && <p className="mt-2 text-[11px] text-indigo-100">{shareStatus}</p>}</section>

    <section className="rounded-2xl border border-fuchsia-100 bg-white p-4 shadow-xs"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h3 className="flex items-center gap-2 font-black text-slate-900"><Gauge className="h-5 w-5 text-fuchsia-700" />{urdu ? 'AI Budget Coach' : 'AI Budget Coach'}</h3><p className="mt-1 text-xs text-slate-500">{urdu ? 'آپ کے notes سے expense category locally سمجھتا ہے—data کہیں باہر نہیں جاتا۔' : 'Automatically groups expenses from their notes on-device; your data stays private.'}</p></div><button type="button" onClick={saveBudgets} className="rounded-xl bg-fuchsia-700 px-3 py-2 text-xs font-bold text-white">{urdu ? 'Budgets محفوظ کریں' : 'Save budgets'}</button></div><div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">{budgetCategories.map((category) => { const spent = budgetSpend[category] || 0; const limit = Number(budgetDraft[category] || settings.budgetLimits?.[category] || 0); const percent = limit > 0 ? Math.min(100, Math.round((spent / limit) * 100)) : 0; return <div key={category} className="rounded-xl bg-slate-50 p-3"><div className="flex items-center justify-between gap-2"><span className="text-xs font-bold text-slate-800">{budgetLabels[category]}</span><span className={`text-[10px] font-black ${percent >= 100 ? 'text-rose-700' : percent >= 80 ? 'text-amber-700' : 'text-emerald-700'}`}>{limit > 0 ? `${percent}%` : '—'}</span></div><p className="mt-1 text-[11px] text-slate-500">₨ {formatPKR(spent)} spent {limit > 0 ? `of ₨ ${formatPKR(limit)}` : ''}</p><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200"><div className={`h-full rounded-full ${percent >= 100 ? 'bg-rose-500' : percent >= 80 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${limit > 0 ? percent : 0}%` }} /></div><input type="number" min="0" value={budgetDraft[category] || ''} onChange={(event) => setBudgetDraft((draft) => ({ ...draft, [category]: event.target.value }))} placeholder={urdu ? 'ماہانہ limit' : 'Monthly limit'} className="mt-2 w-full rounded-lg border bg-white px-2 py-1.5 text-xs" />{percent >= 100 && <p className="mt-1 text-[10px] font-bold text-rose-700">{urdu ? 'Budget سے اوپر' : 'Over budget'}</p>}</div>; })}</div><p className="mt-3 text-[11px] text-slate-500">{urdu ? 'AI suggestion: جس category کی spending 80% سے اوپر ہو، اگلے ہفتے اس کی limit یا خریداری review کریں۔' : 'AI suggestion: review any category above 80% before the next week.'}</p></section>

    <section className="grid grid-cols-2 gap-3 sm:grid-cols-4"><div className="rounded-2xl border border-violet-100 bg-white p-3 shadow-xs"><div className="flex items-center justify-between"><span className="text-[10px] font-bold uppercase text-violet-700">{urdu ? 'Shop Health' : 'Shop health'}</span><Gauge className="h-4 w-4 text-violet-600" /></div><strong className="mt-1 block text-2xl font-black text-violet-950">{healthScore}<span className="text-sm">/100</span></strong><span className="text-[11px] text-slate-500">{healthScore >= 75 ? 'Strong day' : healthScore >= 50 ? 'Needs attention' : 'Action needed'}</span></div><div className="rounded-2xl border border-emerald-100 bg-white p-3 shadow-xs"><span className="text-[10px] font-bold uppercase text-emerald-700">{urdu ? 'Top item' : 'Top item'}</span><strong className="mt-1 block truncate text-sm font-black text-slate-900">{topProduct?.[0] || '—'}</strong><span className="text-[11px] text-slate-500">{topProduct ? `${topProduct[1]} sold today` : 'Add item sales'}</span></div><div className="rounded-2xl border border-rose-100 bg-white p-3 shadow-xs"><span className="text-[10px] font-bold uppercase text-rose-700">{urdu ? 'Risk radar' : 'Risk radar'}</span><strong className="mt-1 block text-2xl font-black text-rose-900">{riskyCustomers.length}</strong><span className="text-[11px] text-slate-500">customers need review</span></div><div className="rounded-2xl border border-sky-100 bg-white p-3 shadow-xs"><span className="text-[10px] font-bold uppercase text-sky-700">{urdu ? 'Busy hour' : 'Busy hour'}</span><strong className="mt-1 block text-2xl font-black text-sky-950">{peakHour}</strong><span className="text-[11px] text-slate-500">based on today’s sales</span></div></section>

    <section className="grid gap-4 lg:grid-cols-2"><div className="rounded-2xl border border-rose-100 bg-white p-4 shadow-xs"><h3 className="flex items-center gap-2 font-black text-slate-900"><AlertTriangle className="h-5 w-5 text-rose-700" />{urdu ? 'Udhaar Risk Radar' : 'Udhaar Risk Radar'}</h3><p className="mt-1 text-xs text-slate-500">{urdu ? 'Limit اور payment history کی بنیاد پر۔' : 'Customers whose balance needs a closer look.'}</p>{riskyCustomers.length ? <div className="mt-3 space-y-2">{riskyCustomers.slice(0, 5).map((customer) => <div key={customer.id} className="flex items-center justify-between rounded-xl bg-rose-50 p-3"><div className="flex items-center gap-2"><Users className="h-4 w-4 text-rose-700" /><span className="text-sm font-bold text-slate-900">{customer.name}</span></div><span className="font-numeric text-xs font-black text-rose-800">₨ {formatPKR(customer.balance)}</span></div>)}</div> : <p className="mt-3 text-sm font-semibold text-emerald-700">{urdu ? 'کوئی high-risk customer نہیں۔' : 'No high-risk customer detected.'}</p>}</div><div className="rounded-2xl border border-orange-100 bg-white p-4 shadow-xs"><h3 className="flex items-center gap-2 font-black text-slate-900"><TrendingUp className="h-5 w-5 text-orange-700" />{urdu ? 'Profit Leak Detector' : 'Profit Leak Detector'}</h3><p className="mt-1 text-xs text-slate-500">{urdu ? 'جہاں دکان کی کمائی ضائع ہو سکتی ہے۔' : 'Flags common places where margin can disappear.'}</p><div className="mt-3 space-y-2 text-xs font-semibold">{todayGrossProfit < 0 && <div className="rounded-xl bg-rose-50 p-3 text-rose-900">{urdu ? 'آج cost اور expenses sale سے زیادہ ہیں۔' : 'Today’s costs and expenses are higher than sales.'}</div>}{lowStockCount > 0 && <div className="rounded-xl bg-amber-50 p-3 text-amber-900">{lowStockCount} {urdu ? 'items low stock ہیں—missed sales کا خطرہ ہے۔' : 'items are low stock—missed sales may follow.'}</div>}{rateAlerts.length > 0 && <div className="rounded-xl bg-orange-50 p-3 text-orange-900">{rateAlerts.length} {urdu ? 'products کی purchase rate بدلی ہے۔' : 'products changed purchase rate—review margins.'}</div>}{todayGrossProfit >= 0 && lowStockCount === 0 && rateAlerts.length === 0 && <div className="rounded-xl bg-emerald-50 p-3 text-emerald-900">{urdu ? 'آج کوئی واضح profit leak نہیں ملا۔' : 'No obvious profit leak detected today.'}</div>}</div></div></section>

    <section className="rounded-2xl border border-indigo-100 bg-white p-4 shadow-xs"><div className="flex items-center justify-between gap-3"><div><h3 className="flex items-center gap-2 font-black text-slate-900"><Mic className="h-5 w-5 text-violet-700" />{urdu ? 'Voice Khata' : 'Voice Khata'}</h3><p className="mt-1 text-xs text-slate-500">{urdu ? 'بول کر customer کا ادھار لکھیں، save سے پہلے confirmation۔' : 'Speak a customer credit entry and review it before saving.'}</p></div><button type="button" onClick={startVoice} className={`rounded-xl px-3 py-2 text-xs font-bold text-white ${voiceListening ? 'bg-rose-600' : 'bg-violet-700'}`}>{voiceListening ? 'Listening…' : urdu ? 'بولیں' : 'Speak'}</button></div>{voiceText && <div className="mt-3 rounded-xl bg-violet-50 p-3 text-sm"><p className="font-semibold text-slate-800">“{voiceText}”</p><p className="mt-1 text-xs text-slate-600">{parsedVoice.customer ? `${parsedVoice.customer.name} · ₨ ${formatPKR(parsedVoice.amount)}` : urdu ? 'Customer name اور رقم دوبارہ چیک کریں۔' : 'Check customer name and amount.'}</p>{parsedVoice.customer && parsedVoice.amount > 0 && <button type="button" onClick={saveVoiceEntry} className="mt-2 rounded-lg bg-emerald-700 px-3 py-2 text-xs font-bold text-white">{urdu ? 'کھاتے میں محفوظ کریں' : 'Confirm ledger entry'}</button>}</div>}<p className="mt-2 text-[11px] text-slate-500">{voiceStatus}</p></section>

    <div className="grid gap-4 lg:grid-cols-2"><section className="rounded-2xl border border-amber-100 bg-white p-4 shadow-xs"><h3 className="flex items-center gap-2 font-black text-slate-900"><PackageSearch className="h-5 w-5 text-amber-700" />{urdu ? 'Smart Reorder Advisor' : 'Smart Reorder Advisor'}</h3><p className="mt-1 text-xs text-slate-500">{urdu ? 'حالیہ فروخت اور stock کی بنیاد پر۔' : 'Based on recent sales velocity and current stock.'}</p>{reorderItems.length ? <div className="mt-3 space-y-2">{reorderItems.slice(0, 6).map(({ product, daysLeft, suggested }) => <div key={product.id} className="flex items-center justify-between rounded-xl bg-amber-50 p-3"><div><p className="text-sm font-bold text-slate-900">{product.name}</p><p className="text-[11px] text-slate-600">{daysLeft === 0 ? 'Low / out of stock' : `Approx. ${Math.ceil(daysLeft)} days left`}</p></div><span className="text-end text-xs font-black text-amber-800">Order +{suggested} {product.unit}</span></div>)}</div> : <p className="mt-3 text-sm font-semibold text-emerald-700">{urdu ? 'فی الحال stock ٹھیک ہے۔' : 'No urgent reorder detected.'}</p>}</section><section className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-xs"><h3 className="flex items-center gap-2 font-black text-slate-900"><BarChart3 className="h-5 w-5 text-emerald-700" />{urdu ? 'Daily Business Advisor' : 'Daily Business Advisor'}</h3><div className="mt-3 space-y-2">{advisor.map((message) => <div key={message} className="flex gap-2 rounded-xl bg-emerald-50 p-3 text-xs font-semibold text-emerald-900"><CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-700" />{message}</div>)}</div>{rateAlerts.length > 0 && <div className="mt-3 space-y-2">{rateAlerts.slice(0, 3).map((alert) => <div key={alert.name} className="flex gap-2 rounded-xl bg-rose-50 p-3 text-xs font-semibold text-rose-900"><AlertTriangle className="h-4 w-4 shrink-0 text-rose-700" />{alert.name}: rate changed ₨ {formatPKR(alert.old)} → ₨ {formatPKR(alert.latest)}</div>)}</div>}</section></div>

    <section className="rounded-2xl border border-sky-100 bg-white p-4 shadow-xs"><h3 className="flex items-center gap-2 font-black text-slate-900"><WalletCards className="h-5 w-5 text-sky-700" />{urdu ? 'Dukaan Handover / Cash Closing' : 'Dukaan Handover / Cash Closing'}</h3><p className="mt-1 text-xs text-slate-500">{urdu ? 'دکان شروع کرتے وقت cash لکھیں، آخر میں فرق چیک کریں۔' : 'Record opening cash and reconcile the drawer at closing.'}</p><div className="mt-3 grid gap-2 sm:grid-cols-4"><input type="number" min="0" value={openingCash} onChange={(e) => setOpeningCash(e.target.value)} placeholder={urdu ? 'Opening cash' : 'Opening cash'} className="rounded-xl border p-2.5 text-sm" /><button type="button" onClick={saveOpening} className="rounded-xl bg-sky-700 px-3 py-2 text-xs font-bold text-white">{urdu ? 'شروع محفوظ' : 'Save opening'}</button><input type="number" min="0" value={countedCash} onChange={(e) => setCountedCash(e.target.value)} placeholder={urdu ? 'گنا ہوا cash' : 'Counted cash'} className="rounded-xl border p-2.5 text-sm" /><button type="button" onClick={closeDay} className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-bold text-white">{urdu ? 'دن بند کریں' : 'Close day'}</button></div><div className="mt-3 grid grid-cols-2 gap-2 text-xs"><div className="rounded-xl bg-slate-50 p-3"><span className="block text-slate-500">Expected cash</span><strong className="font-numeric text-slate-900">₨ {formatPKR(expectedCash)}</strong></div><div className={`rounded-xl p-3 ${cashDifference === 0 ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'}`}><span className="block">Difference</span><strong className="font-numeric">₨ {formatPKR(cashDifference)}</strong></div></div></section>

    <section className="rounded-2xl border border-orange-100 bg-orange-50 p-4"><h3 className="flex items-center gap-2 font-black text-orange-950"><ClipboardCheck className="h-5 w-5 text-orange-700" />{urdu ? 'Seasonal Shop Checklist' : 'Seasonal Shop Checklist'}</h3><div className="mt-3 grid gap-2 text-xs font-semibold text-orange-950 sm:grid-cols-2"><span>□ {urdu ? 'fast-moving items کا stock check کریں' : 'Check fast-moving stock'}</span><span>□ {urdu ? 'expired items الگ کریں' : 'Separate expired items'}</span><span>□ {urdu ? 'sale prices review کریں' : 'Review sale prices'}</span><span>□ {urdu ? 'customers کو due reminder بھیجیں' : 'Send due reminders'}</span></div></section>
  </div>;
};
