import React, { useState } from 'react';
import {
  Users,
  Search,
  UserPlus,
  ArrowDownLeft,
  ArrowUpRight,
  Phone,
  MessageSquare,
  FileSpreadsheet,
  X,
  Plus,
  Trash2,
  Calendar,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { Customer, CustomerTransaction, Language, ShopSettings } from '../types';
import { downloadCSV, formatDate, formatPKR, getTodayDateString } from '../utils/formatters';
import { getTranslation } from '../utils/translations';
import { WhatsAppReminderModal } from '../components/WhatsAppReminderModal';

interface Props {
  customers: Customer[];
  transactions: CustomerTransaction[];
  settings: ShopSettings;
  language: Language;
  onAddCustomer: (customer: Omit<Customer, 'id' | 'balance' | 'createdAt' | 'updatedAt'>) => void;
  onAddTransaction: (
    customerId: string,
    type: 'gave_credit' | 'got_payment',
    amount: number,
    date: string,
    notes?: string
  ) => void;
  onDeleteTransaction: (txId: string) => void;
  onDeleteCustomer: (customerId: string) => void;
  selectedCustomerFromParent?: Customer | null;
  onClearSelectedCustomer?: () => void;
  triggerAddCustomerModal?: boolean;
  onCloseAddCustomerModal?: () => void;
}

export const KhataView: React.FC<Props> = ({
  customers,
  transactions,
  settings,
  language,
  onAddCustomer,
  onAddTransaction,
  onDeleteTransaction,
  onDeleteCustomer,
  selectedCustomerFromParent,
  onClearSelectedCustomer,
  triggerAddCustomerModal = false,
  onCloseAddCustomerModal,
}) => {
  const t = getTranslation(language);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'owing' | 'settled'>('owing');
  const [activeCustomer, setActiveCustomer] = useState<Customer | null>(
    selectedCustomerFromParent || null
  );

  // Modals
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(triggerAddCustomerModal);
  const [showTransactionModal, setShowTransactionModal] = useState<'gave_credit' | 'got_payment' | null>(null);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState<Customer | null>(null);

  React.useEffect(() => {
    if (triggerAddCustomerModal) {
      setShowAddCustomerModal(true);
    }
  }, [triggerAddCustomerModal]);

  // New Customer Form State
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustAddress, setNewCustAddress] = useState('');

  // Transaction Form State
  const [txAmount, setTxAmount] = useState('');
  const [txDate, setTxDate] = useState(getTodayDateString());
  const [txNotes, setTxNotes] = useState('');

  // Sync if selected from parent (e.g. Dashboard)
  React.useEffect(() => {
    if (selectedCustomerFromParent) {
      setActiveCustomer(selectedCustomerFromParent);
    }
  }, [selectedCustomerFromParent]);

  // Keep active customer data updated if customers list changes
  const currentActiveCustomer = activeCustomer
    ? customers.find((c) => c.id === activeCustomer.id) || activeCustomer
    : null;

  // Filtered customer list
  const filteredCustomers = customers.filter((cust) => {
    const matchesSearch =
      cust.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cust.phone.includes(searchTerm);
    if (!matchesSearch) return false;

    if (filterType === 'owing') return cust.balance > 0;
    if (filterType === 'settled') return cust.balance <= 0;
    return true;
  });

  const totalOwed = customers.reduce((sum, c) => sum + Math.max(0, c.balance), 0);
  const customersOwingCount = customers.filter((c) => c.balance > 0).length;

  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName.trim()) return;

    onAddCustomer({
      name: newCustName.trim(),
      phone: newCustPhone.trim(),
      address: newCustAddress.trim() || undefined,
    });

    setNewCustName('');
    setNewCustPhone('');
    setNewCustAddress('');
    setShowAddCustomerModal(false);
  };

  const handleRecordTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentActiveCustomer || !showTransactionModal) return;
    const amt = parseFloat(txAmount);
    if (isNaN(amt) || amt <= 0) return;

    onAddTransaction(
      currentActiveCustomer.id,
      showTransactionModal,
      amt,
      txDate || getTodayDateString(),
      txNotes.trim() || undefined
    );

    setTxAmount('');
    setTxNotes('');
    setShowTransactionModal(null);
  };

  const handleExportCustomerCSV = (customer: Customer) => {
    const custTx = transactions.filter((t) => t.customerId === customer.id);
    const headers = [
      'Date (تاریخ)',
      'Type (قسم)',
      'Description (تفصیل)',
      'Amount (رقم)',
      'Balance After (بقایا)',
    ];
    const rows = custTx.map((tx) => [
      tx.date,
      tx.type === 'gave_credit' ? 'ادھار مال دیا (Credit)' : 'رقم وصول ہوئی (Payment)',
      tx.notes || '',
      tx.amount.toString(),
      tx.balanceAfter.toString(),
    ]);

    downloadCSV(`Khata-${customer.name.replace(/\s+/g, '_')}-${customer.phone || 'ledger'}.csv`, [
      headers,
      ...rows,
    ]);
  };

  return (
    <div className="space-y-4 pb-20 sm:pb-8 animate-fade-in">
      {/* Top Banner & Overview */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-purple-700" />
            <span>{t.customerLedger}</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {language === 'ur'
              ? 'گاہکوں کا ادھار کھاتہ، وصولیاں اور واٹس ایپ پر تقاضہ'
              : 'Track customer balances, payments, and instant WhatsApp reminders'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Total Udhaar Pill */}
          <div className="bg-purple-50 border border-purple-200 px-3.5 py-2 rounded-xl text-end">
            <span className="text-[10px] uppercase font-bold text-purple-700 block">
              {t.totalUdhaar}
            </span>
            <span className="text-base font-black text-purple-950 font-numeric">
              ₨ {formatPKR(totalOwed)}
            </span>
          </div>

          <button
            onClick={() => setShowAddCustomerModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold transition shadow-xs active:scale-95 shrink-0"
          >
            <UserPlus className="w-4 h-4" />
            <span>{t.quickNewCustomer}</span>
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute top-1/2 -translate-y-1/2 start-3 text-slate-400" />
          <input
            type="text"
            placeholder={language === 'ur' ? 'گاہک کا نام یا فون تلاش کریں...' : 'Search customer name or phone...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full ps-9 pe-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:border-purple-600 focus:outline-hidden focus:ring-2 focus:ring-purple-100 shadow-xs"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setFilterType('owing')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
              filterType === 'owing'
                ? 'bg-purple-700 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            {t.customersOwing} ({customersOwingCount})
          </button>
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
              filterType === 'all'
                ? 'bg-purple-700 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            {t.allCustomers} ({customers.length})
          </button>
          <button
            onClick={() => setFilterType('settled')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
              filterType === 'settled'
                ? 'bg-purple-700 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            {t.customersClear}
          </button>
        </div>
      </div>

      {/* Customer List */}
      {filteredCustomers.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-8 text-center text-slate-500">
          <Users className="w-10 h-10 mx-auto text-slate-300 mb-2" />
          <p className="font-bold text-sm text-slate-700">{t.noDataFound}</p>
          <p className="text-xs text-slate-400 mt-1">
            {language === 'ur'
              ? 'اوپر دیئے گئے بٹن سے نیا گاہک شامل کریں۔'
              : 'Add a new customer using the button above.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredCustomers.map((cust) => {
            const hasDue = cust.balance > 0;
            const isAdvance = cust.balance < 0;

            return (
              <div
                key={cust.id}
                className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs hover:border-purple-300 transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-base text-slate-900 leading-tight">
                        {cust.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                        {cust.phone ? (
                          <span className="flex items-center gap-1 font-numeric">
                            <Phone className="w-3 h-3 text-slate-400" />
                            {cust.phone}
                          </span>
                        ) : (
                          <span className="text-slate-400">بغیر فون نمبر</span>
                        )}
                      </div>
                      {cust.address && (
                        <p className="text-[11px] text-slate-400 mt-0.5 truncate max-w-[200px]">
                          {cust.address}
                        </p>
                      )}
                    </div>

                    {/* Balance pill */}
                    <div className="text-end">
                      <div
                        className={`text-lg font-black font-numeric ${
                          hasDue
                            ? 'text-purple-900'
                            : isAdvance
                            ? 'text-emerald-700'
                            : 'text-slate-600'
                        }`}
                      >
                        ₨ {formatPKR(Math.abs(cust.balance))}
                      </div>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                          hasDue
                            ? 'bg-purple-100 text-purple-800'
                            : isAdvance
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {hasDue ? t.youWillReceive : isAdvance ? t.advancePaid : t.settled}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions at bottom of card */}
                <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  {hasDue ? (
                    <button
                      onClick={() => setShowWhatsAppModal(cust)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold transition"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{language === 'ur' ? 'واٹس ایپ' : 'WhatsApp'}</span>
                    </button>
                  ) : (
                    <div className="text-[11px] text-slate-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      <span>{t.settled}</span>
                    </div>
                  )}

                  <button
                    onClick={() => setActiveCustomer(cust)}
                    className="px-3.5 py-1.5 rounded-lg bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold transition shadow-xs"
                  >
                    {language === 'ur' ? 'کھاتہ کھولیں' : 'Open Ledger'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Customer Detail Ledger Modal */}
      {currentActiveCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-2 sm:p-4 animate-fade-in">
          <div className="w-full max-w-2xl max-h-[92vh] rounded-2xl bg-white shadow-2xl flex flex-col overflow-hidden border border-slate-200">
            {/* Header */}
            <div className="bg-purple-900 text-white p-4 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-lg">{currentActiveCustomer.name}</h3>
                  <span className="text-xs bg-purple-800 text-purple-200 px-2 py-0.5 rounded-full font-numeric">
                    {currentActiveCustomer.phone || 'بغیر فون'}
                  </span>
                </div>
                {currentActiveCustomer.address && (
                  <p className="text-xs text-purple-200 mt-0.5">
                    {currentActiveCustomer.address}
                  </p>
                )}
              </div>

              <button
                onClick={() => {
                  setActiveCustomer(null);
                  if (onClearSelectedCustomer) onClearSelectedCustomer();
                }}
                className="p-1 rounded-full text-purple-200 hover:text-white hover:bg-purple-800"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Sub-bar: Balance & Quick Tools */}
            <div className="p-4 bg-purple-50/70 border-b border-purple-100 flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-xs font-bold text-purple-700">{t.currentBalance}</div>
                <div className="text-2xl font-black text-purple-950 font-numeric">
                  ₨ {formatPKR(Math.abs(currentActiveCustomer.balance))}
                  <span className="text-xs font-bold ms-2 text-purple-800">
                    {currentActiveCustomer.balance > 0
                      ? `(${t.youWillReceive})`
                      : currentActiveCustomer.balance < 0
                      ? `(${t.advancePaid})`
                      : `(${t.settled})`}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {currentActiveCustomer.balance > 0 && (
                  <button
                    onClick={() => setShowWhatsAppModal(currentActiveCustomer)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>{t.sendWhatsAppReminder}</span>
                  </button>
                )}

                <button
                  onClick={() => handleExportCustomerCSV(currentActiveCustomer)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold transition shadow-xs"
                  title="Export Statement to CSV"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
                  <span className="hidden sm:inline">CSV</span>
                </button>
              </div>
            </div>

            {/* Quick 2 Big Action Buttons inside Ledger */}
            <div className="p-4 bg-white border-b border-slate-200 grid grid-cols-2 gap-3">
              <button
                onClick={() => setShowTransactionModal('got_payment')}
                className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-sm shadow-md transition"
              >
                <ArrowDownLeft className="w-5 h-5 shrink-0" />
                <span>{t.gotPayment}</span>
              </button>

              <button
                onClick={() => setShowTransactionModal('gave_credit')}
                className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-bold text-sm shadow-md transition"
              >
                <ArrowUpRight className="w-5 h-5 shrink-0" />
                <span>{t.gaveCredit}</span>
              </button>
            </div>

            {/* Ledger Timeline List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                {t.ledgerStatement}
              </h4>

              {transactions.filter((tx) => tx.customerId === currentActiveCustomer.id).length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  {t.noTransactionsYet}
                </div>
              ) : (
                transactions
                  .filter((tx) => tx.customerId === currentActiveCustomer.id)
                  .map((tx) => {
                    const isCredit = tx.type === 'gave_credit';
                    return (
                      <div
                        key={tx.id}
                        className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-xs ${
                          isCredit
                            ? 'bg-rose-50/50 border-rose-100 text-rose-950'
                            : 'bg-emerald-50/50 border-emerald-100 text-emerald-950'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                              isCredit
                                ? 'bg-rose-100 text-rose-700'
                                : 'bg-emerald-100 text-emerald-700'
                            }`}
                          >
                            {isCredit ? (
                              <ArrowUpRight className="w-4 h-4" />
                            ) : (
                              <ArrowDownLeft className="w-4 h-4" />
                            )}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900">
                              {isCredit ? t.gaveCredit : t.gotPayment}
                            </div>
                            {tx.notes && <p className="text-slate-600 mt-0.5">{tx.notes}</p>}
                            <div className="text-[10px] text-slate-400 font-numeric mt-0.5">
                              {formatDate(tx.date)}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <div className="text-end">
                            <div
                              className={`text-sm font-black font-numeric ${
                                isCredit ? 'text-rose-700' : 'text-emerald-700'
                              }`}
                            >
                              {isCredit ? '+' : '-'} ₨ {formatPKR(tx.amount)}
                            </div>
                            <div className="text-[10px] text-slate-500 font-numeric">
                              {language === 'ur' ? 'بقایا: ' : 'Bal: '}₨ {formatPKR(tx.balanceAfter)}
                            </div>
                          </div>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (
                                window.confirm(
                                  language === 'ur'
                                    ? 'کیا آپ واقعی یہ لین دین ریکارڈ حذف کرنا چاہتے ہیں؟ اس سے کھاتے کا بیلنس خودبخود درست ہو جائے گا۔'
                                    : 'Delete this transaction record? Customer balance will be restored automatically.'
                                )
                              ) {
                                onDeleteTransaction(tx.id);
                              }
                            }}
                            className="p-1.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title={t.delete}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })
              )}
            </div>

            {/* Bottom Footer with Delete option */}
            <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <button
                onClick={() => {
                  if (
                    window.confirm(
                      language === 'ur'
                        ? 'کیا آپ واقعی اس گاہک اور ان کا کھاتہ حذف کرنا چاہتے ہیں؟'
                        : 'Are you sure you want to delete this customer?'
                    )
                  ) {
                    onDeleteCustomer(currentActiveCustomer.id);
                    setActiveCustomer(null);
                  }
                }}
                className="text-xs text-rose-600 hover:text-rose-800 flex items-center gap-1 font-semibold p-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{language === 'ur' ? 'گاہک حذف کریں' : 'Delete Customer'}</span>
              </button>

              <button
                onClick={() => setActiveCustomer(null)}
                className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold"
              >
                {t.back}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Record Transaction Modal (Gave Credit or Got Payment) */}
      {showTransactionModal && currentActiveCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl p-5 border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900">
                {showTransactionModal === 'gave_credit' ? t.recordCredit : t.recordPayment}
              </h3>
              <button
                onClick={() => setShowTransactionModal(null)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordTransaction} className="space-y-4 pt-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t.amount} *
                </label>
                <div className="relative">
                  <span className="absolute start-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">
                    ₨
                  </span>
                  <input
                    type="number"
                    step="any"
                    required
                    autoFocus
                    placeholder="0"
                    value={txAmount}
                    onChange={(e) => setTxAmount(e.target.value)}
                    className="w-full ps-8 pe-4 py-3 rounded-xl border border-slate-300 text-lg font-black font-numeric text-slate-900 focus:border-purple-600 focus:outline-hidden focus:ring-2 focus:ring-purple-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t.date}
                </label>
                <input
                  type="date"
                  value={txDate}
                  onChange={(e) => setTxDate(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-numeric text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t.notes}
                </label>
                <input
                  type="text"
                  placeholder={
                    showTransactionModal === 'gave_credit'
                      ? 'مثلاً چینی 5 کلو، آئل 2 پیکٹ'
                      : 'مثلاً کیش وصولی یا ایزی پیسہ'
                  }
                  value={txNotes}
                  onChange={(e) => setTxNotes(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowTransactionModal(null)}
                  className="py-3 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className={`py-3 rounded-xl text-white text-xs font-bold shadow-md transition active:scale-98 ${
                    showTransactionModal === 'gave_credit'
                      ? 'bg-rose-600 hover:bg-rose-700'
                      : 'bg-emerald-600 hover:bg-emerald-700'
                  }`}
                >
                  {t.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add New Customer Modal */}
      {showAddCustomerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl p-5 border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900">{t.quickNewCustomer}</h3>
              <button
                onClick={() => setShowAddCustomerModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="space-y-3.5 pt-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t.customerName} *
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder={language === 'ur' ? 'مثلاً حاجی رفیق' : 'e.g. Haji Rafiq'}
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:border-purple-600 focus:outline-hidden focus:ring-2 focus:ring-purple-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t.customerPhone} (واٹس ایپ کے لیے)
                </label>
                <input
                  type="tel"
                  placeholder="0300-1234567"
                  value={newCustPhone}
                  onChange={(e) => setNewCustPhone(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-sm font-numeric text-slate-900 focus:border-purple-600 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t.customerAddress}
                </label>
                <input
                  type="text"
                  placeholder={language === 'ur' ? 'گلی، محلہ، دکان نمبر' : 'Street / area / notes'}
                  value={newCustAddress}
                  onChange={(e) => setNewCustAddress(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-sm text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddCustomerModal(false)}
                  className="py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold shadow-md active:scale-98 transition"
                >
                  {t.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* WhatsApp Modal Trigger */}
      {showWhatsAppModal && (
        <WhatsAppReminderModal
          customer={showWhatsAppModal}
          settings={settings}
          language={language}
          onClose={() => setShowWhatsAppModal(null)}
        />
      )}
    </div>
  );
};
