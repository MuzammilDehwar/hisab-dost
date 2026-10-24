/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { AppState, Customer, CustomerTransaction, Expense, Language, Product, Sale, ShopSettings } from './types';
import { getEmptyAppState, getInitialDemoState } from './services/storage';
import { auth } from './services/firebase';
import { getFirebaseErrorMessage, loadUserAppState, saveUserAppState } from './services/rtdbStorage';
import { getTodayDateString } from './utils/formatters';
import { Header } from './components/Header';
import { Navigation, TabType } from './components/Navigation';
import { OfflineIndicator } from './components/OfflineIndicator';
import { DashboardView } from './views/DashboardView';
import { KhataView } from './views/KhataView';
import { SalesView } from './views/SalesView';
import { ExpensesView } from './views/ExpensesView';
import { InventoryView } from './views/InventoryView';
import { ReportsView } from './views/ReportsView';
import { SettingsView } from './views/SettingsView';
import { AuthView } from './views/AuthView';

const DEV_PREVIEW_BYPASS = import.meta.env.DEV && import.meta.env.VITE_DEV_AUTH_BYPASS === 'true';

export default function App() {
  const [appState, setAppState] = useState<AppState>(() => getEmptyAppState());
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [isCloudStateReady, setIsCloudStateReady] = useState(false);
  const [cloudError, setCloudError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving'>('saved');
  const [hydrationAttempt, setHydrationAttempt] = useState(0);
  const saveQueueRef = useRef<Promise<void>>(Promise.resolve());
  const [currentTab, setCurrentTab] = useState<TabType>('dashboard');

  // Modal triggers from dashboard quick actions
  const [triggerAddSale, setTriggerAddSale] = useState(false);
  const [triggerAddExpense, setTriggerAddExpense] = useState(false);
  const [triggerAddCustomer, setTriggerAddCustomer] = useState(false);
  const [selectedCustomerForLedger, setSelectedCustomerForLedger] = useState<Customer | null>(null);

  useEffect(() => onAuthStateChanged(auth, (user) => {
    if (DEV_PREVIEW_BYPASS) {
      setCurrentUser({ uid: 'dev-preview-user', email: 'preview@local.test' } as User);
      setAuthReady(true);
      return;
    }
    setCurrentUser(user);
    setAuthReady(true);
    setIsCloudStateReady(false);
    setCloudError(null);
    setSaveError(null);
    setSaveStatus('saved');
    if (!user) setAppState(getEmptyAppState());
  }), []);

  useEffect(() => {
    if (!currentUser) return;
    let cancelled = false;
    const hydrate = async () => {
      let succeeded = false;
      try {
        if (DEV_PREVIEW_BYPASS) {
          setAppState(getInitialDemoState());
          succeeded = true;
          return;
        }
        const cloudState = await Promise.race([
          loadUserAppState(currentUser.uid),
          new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Firebase request timeout')), 15000)),
        ]);
        if (cancelled) return;
        if (cloudState) {
          setAppState(cloudState);
        } else {
          // Never copy browser-local/demo data into a new account. A new
          // Firebase UID must always start with a private, empty ledger.
          const emptyState = getEmptyAppState();
          setAppState(emptyState);
          await saveUserAppState(currentUser.uid, emptyState);
        }
        succeeded = true;
        setCloudError(null);
      } catch (error) {
        console.error('Could not load Realtime Database state:', error);
        if (!cancelled) setCloudError(getFirebaseErrorMessage(error, 'load'));
      } finally {
        if (!cancelled) setIsCloudStateReady(succeeded);
      }
    };
    void hydrate();
    return () => { cancelled = true; };
  }, [currentUser, hydrationAttempt]);

  // Sync each authenticated user's state to their private Realtime Database path.
  useEffect(() => {
    if (DEV_PREVIEW_BYPASS || !currentUser || !isCloudStateReady) return;
    setSaveStatus('saving');
    const timeoutId = window.setTimeout(() => {
      const uid = currentUser.uid;
      const snapshot = appState;
      saveQueueRef.current = saveQueueRef.current
        .catch(() => undefined)
        .then(() => saveUserAppState(uid, snapshot))
        .then(() => { setSaveError(null); setSaveStatus('saved'); })
        .catch((error) => {
          console.error('Could not save Realtime Database state:', error);
          setSaveError(getFirebaseErrorMessage(error, 'save'));
          setSaveStatus('saved');
        });
    }, 350);
    return () => window.clearTimeout(timeoutId);
  }, [appState, currentUser, isCloudStateReady]);

  // Update HTML document direction and language when language switches
  useEffect(() => {
    const isUrdu = appState.settings.language === 'ur';
    document.documentElement.dir = isUrdu ? 'rtl' : 'ltr';
    document.documentElement.lang = isUrdu ? 'ur' : 'en';
  }, [appState.settings.language]);

  if (!authReady) {
    return <div className="auth-shell"><p className="auth-footer">Connecting securely…</p></div>;
  }
  if (!currentUser) {
    return <AuthView onAuthenticated={() => undefined} />;
  }
  if (cloudError) {
    return (
      <div className="auth-shell">
        <section className="auth-card" role="alert">
          <h2>Ledger load nahi ho saka</h2>
          <p className="auth-subtitle">{cloudError}</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button className="auth-primary" type="button" onClick={() => { setCloudError(null); setIsCloudStateReady(false); setHydrationAttempt((value) => value + 1); }}>Retry</button>
            <button className="rounded-xl border border-white/50 bg-white/80 px-3 py-2 text-xs font-bold text-slate-700" type="button" onClick={() => { setCloudError(null); setIsCloudStateReady(false); setHydrationAttempt((value) => value + 1); }}>Try again</button>
          </div>
        </section>
      </div>
    );
  }
  if (!isCloudStateReady) {
    return <div className="auth-shell"><p className="auth-footer">Loading your private ledger…</p></div>;
  }

  // Handler: Add Sale
  const handleAddSale = (saleData: Omit<Sale, 'id' | 'createdAt'>) => {
    const id = `sale-${Date.now()}`;
    const newSale: Sale = {
      ...saleData,
      id,
      createdAt: new Date().toISOString(),
    };

    let updatedProducts = [...appState.products];
    // If sale had items, deduct stock quantity
    if (newSale.items && newSale.items.length > 0) {
      newSale.items.forEach((item) => {
        if (item.productId) {
          const pIdx = updatedProducts.findIndex((p) => p.id === item.productId);
          if (pIdx !== -1) {
            updatedProducts[pIdx] = {
              ...updatedProducts[pIdx],
              stockQuantity: Math.max(0, updatedProducts[pIdx].stockQuantity - item.quantity),
            };
          }
        }
      });
    }

    let updatedCustomers = [...appState.customers];
    let updatedTransactions = [...appState.customerTransactions];

    // If sale was on credit (Khata), update customer balance and ledger
    if (newSale.paymentType === 'credit' && newSale.customerId) {
      const cIdx = updatedCustomers.findIndex((c) => c.id === newSale.customerId);
      if (cIdx !== -1) {
        const currentCust = updatedCustomers[cIdx];
        const newBalance = currentCust.balance + newSale.amount;
        updatedCustomers[cIdx] = {
          ...currentCust,
          balance: newBalance,
          lastTransactionDate: newSale.date,
          updatedAt: newSale.date,
        };

        const newTx: CustomerTransaction = {
          id: `ctx-${Date.now()}`,
          customerId: currentCust.id,
          type: 'gave_credit',
          amount: newSale.amount,
          date: newSale.date,
          notes: newSale.notes || 'ادھار مال (فروخت)',
          saleId: id,
          balanceAfter: newBalance,
          createdAt: new Date().toISOString(),
        };
        updatedTransactions = [newTx, ...updatedTransactions];
      }
    }

    setAppState((prev) => ({
      ...prev,
      sales: [newSale, ...prev.sales],
      products: updatedProducts,
      customers: updatedCustomers,
      customerTransactions: updatedTransactions,
    }));
  };

  // Handler: Edit Sale
  const handleEditSale = (updatedSale: Sale) => {
    const oldSale = appState.sales.find((s) => s.id === updatedSale.id);
    if (!oldSale) return;

    let updatedProducts = [...appState.products];
    // Revert old inventory deduction
    if (oldSale.items && oldSale.items.length > 0) {
      oldSale.items.forEach((item) => {
        if (item.productId) {
          const pIdx = updatedProducts.findIndex((p) => p.id === item.productId);
          if (pIdx !== -1) {
            updatedProducts[pIdx] = {
              ...updatedProducts[pIdx],
              stockQuantity: updatedProducts[pIdx].stockQuantity + item.quantity,
            };
          }
        }
      });
    }
    // Apply new inventory deduction
    if (updatedSale.items && updatedSale.items.length > 0) {
      updatedSale.items.forEach((item) => {
        if (item.productId) {
          const pIdx = updatedProducts.findIndex((p) => p.id === item.productId);
          if (pIdx !== -1) {
            updatedProducts[pIdx] = {
              ...updatedProducts[pIdx],
              stockQuantity: Math.max(0, updatedProducts[pIdx].stockQuantity - item.quantity),
              updatedAt: getTodayDateString(),
            };
          }
        }
      });
    }

    let updatedCustomers = [...appState.customers];
    let updatedTransactions = [...appState.customerTransactions];

    // Revert old customer credit if was credit
    if (oldSale.paymentType === 'credit' && oldSale.customerId) {
      const cIdx = updatedCustomers.findIndex((c) => c.id === oldSale.customerId);
      if (cIdx !== -1) {
        updatedCustomers[cIdx] = {
          ...updatedCustomers[cIdx],
          balance: updatedCustomers[cIdx].balance - oldSale.amount,
          updatedAt: getTodayDateString(),
        };
      }
      updatedTransactions = updatedTransactions.filter((tx) => tx.saleId !== oldSale.id);
    }

    // Apply new customer credit if is credit
    if (updatedSale.paymentType === 'credit' && updatedSale.customerId) {
      const cIdx = updatedCustomers.findIndex((c) => c.id === updatedSale.customerId);
      if (cIdx !== -1) {
        const currentCust = updatedCustomers[cIdx];
        const newBalance = currentCust.balance + updatedSale.amount;
        updatedCustomers[cIdx] = {
          ...currentCust,
          balance: newBalance,
          lastTransactionDate: updatedSale.date,
          updatedAt: updatedSale.date,
        };

        const newTx: CustomerTransaction = {
          id: `ctx-${Date.now()}`,
          customerId: currentCust.id,
          type: 'gave_credit',
          amount: updatedSale.amount,
          date: updatedSale.date,
          notes: updatedSale.notes || 'ادھار مال (فروخت - ترمیم)',
          saleId: updatedSale.id,
          balanceAfter: newBalance,
          createdAt: new Date().toISOString(),
        };
        updatedTransactions = [newTx, ...updatedTransactions];
      }
    }

    setAppState((prev) => ({
      ...prev,
      sales: prev.sales.map((s) => (s.id === updatedSale.id ? updatedSale : s)),
      products: updatedProducts,
      customers: updatedCustomers,
      customerTransactions: updatedTransactions,
    }));
  };

  // Handler: Delete Sale
  const handleDeleteSale = (saleId: string) => {
    const saleToDelete = appState.sales.find((s) => s.id === saleId);
    if (!saleToDelete) return;

    let updatedProducts = [...appState.products];
    // Restore inventory if sale had items
    if (saleToDelete.items && saleToDelete.items.length > 0) {
      saleToDelete.items.forEach((item) => {
        if (item.productId) {
          const pIdx = updatedProducts.findIndex((p) => p.id === item.productId);
          if (pIdx !== -1) {
            updatedProducts[pIdx] = {
              ...updatedProducts[pIdx],
              stockQuantity: updatedProducts[pIdx].stockQuantity + item.quantity,
              updatedAt: getTodayDateString(),
            };
          }
        }
      });
    }

    let updatedCustomers = [...appState.customers];
    let updatedTransactions = [...appState.customerTransactions];

    // If sale was on credit (Khata), revert customer balance and delete the credit transaction
    if (saleToDelete.paymentType === 'credit' && saleToDelete.customerId) {
      const cIdx = updatedCustomers.findIndex((c) => c.id === saleToDelete.customerId);
      if (cIdx !== -1) {
        const currentCust = updatedCustomers[cIdx];
        const newBalance = currentCust.balance - saleToDelete.amount;
        updatedCustomers[cIdx] = {
          ...currentCust,
          balance: newBalance,
          updatedAt: getTodayDateString(),
        };
      }
      updatedTransactions = updatedTransactions.filter((tx) => tx.saleId !== saleId);
    }

    setAppState((prev) => ({
      ...prev,
      sales: prev.sales.filter((s) => s.id !== saleId),
      products: updatedProducts,
      customers: updatedCustomers,
      customerTransactions: updatedTransactions,
    }));
  };

  // Handler: Add Expense
  const handleAddExpense = (expData: Omit<Expense, 'id' | 'createdAt'>) => {
    const newExp: Expense = {
      ...expData,
      id: `exp-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };

    setAppState((prev) => ({
      ...prev,
      expenses: [newExp, ...prev.expenses],
    }));
  };

  // Handler: Edit Expense
  const handleEditExpense = (updatedExp: Expense) => {
    setAppState((prev) => ({
      ...prev,
      expenses: prev.expenses.map((e) => (e.id === updatedExp.id ? updatedExp : e)),
    }));
  };

  // Handler: Delete Expense
  const handleDeleteExpense = (expId: string) => {
    setAppState((prev) => ({
      ...prev,
      expenses: prev.expenses.filter((e) => e.id !== expId),
    }));
  };

  // Handler: Add Customer
  const handleAddCustomer = (
    custData: Omit<Customer, 'id' | 'balance' | 'createdAt' | 'updatedAt'>
  ) => {
    const newCust: Customer = {
      ...custData,
      id: `cust-${Date.now()}`,
      balance: 0,
      createdAt: getTodayDateString(),
      updatedAt: getTodayDateString(),
    };

    setAppState((prev) => ({
      ...prev,
      customers: [newCust, ...prev.customers],
    }));
  };

  // Handler: Delete Customer
  const handleDeleteCustomer = (customerId: string) => {
    setAppState((prev) => ({
      ...prev,
      customers: prev.customers.filter((c) => c.id !== customerId),
      customerTransactions: prev.customerTransactions.filter((tx) => tx.customerId !== customerId),
    }));
  };

  // Handler: Add Customer Transaction (Gave Credit or Got Payment)
  const handleAddCustomerTransaction = (
    customerId: string,
    type: 'gave_credit' | 'got_payment',
    amount: number,
    date: string,
    notes?: string
  ) => {
    const custIndex = appState.customers.findIndex((c) => c.id === customerId);
    if (custIndex === -1) return;

    const customer = appState.customers[custIndex];
    const newBalance =
      type === 'gave_credit' ? customer.balance + amount : customer.balance - amount;

    const newTx: CustomerTransaction = {
      id: `ctx-${Date.now()}`,
      customerId,
      type,
      amount,
      date,
      notes,
      balanceAfter: newBalance,
      createdAt: new Date().toISOString(),
    };

    const updatedCustomers = [...appState.customers];
    updatedCustomers[custIndex] = {
      ...customer,
      balance: newBalance,
      lastTransactionDate: date,
      updatedAt: date,
    };

    setAppState((prev) => ({
      ...prev,
      customers: updatedCustomers,
      customerTransactions: [newTx, ...prev.customerTransactions],
    }));
  };

  // Handler: Delete Customer Transaction
  const handleDeleteCustomerTransaction = (txId: string) => {
    const tx = appState.customerTransactions.find((t) => t.id === txId);
    if (!tx) return;

    const custIndex = appState.customers.findIndex((c) => c.id === tx.customerId);
    if (custIndex === -1) return;

    const customer = appState.customers[custIndex];
    // If it was gave_credit, it added to balance. Deleting it reduces balance.
    // If it was got_payment, it reduced balance. Deleting it adds to balance.
    const newBalance =
      tx.type === 'gave_credit' ? customer.balance - tx.amount : customer.balance + tx.amount;

    const updatedCustomers = [...appState.customers];
    updatedCustomers[custIndex] = {
      ...customer,
      balance: newBalance,
      updatedAt: getTodayDateString(),
    };

    setAppState((prev) => ({
      ...prev,
      customers: updatedCustomers,
      customerTransactions: prev.customerTransactions.filter((t) => t.id !== txId),
    }));
  };

  // Handler: Add Product
  const handleAddProduct = (prodData: Omit<Product, 'id' | 'updatedAt'>) => {
    const newProd: Product = {
      ...prodData,
      id: `prod-${Date.now()}`,
      updatedAt: getTodayDateString(),
    };

    setAppState((prev) => ({
      ...prev,
      products: [newProd, ...prev.products],
    }));
  };

  // Handler: Edit Product
  const handleEditProduct = (updatedProd: Product) => {
    setAppState((prev) => ({
      ...prev,
      products: prev.products.map((p) => (p.id === updatedProd.id ? updatedProd : p)),
    }));
  };

  // Handler: Delete Product
  const handleDeleteProduct = (productId: string) => {
    setAppState((prev) => ({
      ...prev,
      products: prev.products.filter((p) => p.id !== productId),
    }));
  };

  // Handler: Adjust Product Stock
  const handleAdjustStock = (productId: string, delta: number) => {
    setAppState((prev) => ({
      ...prev,
      products: prev.products.map((p) =>
        p.id === productId
          ? { ...p, stockQuantity: Math.max(0, p.stockQuantity + delta), updatedAt: getTodayDateString() }
          : p
      ),
    }));
  };

  // Handler: Update Settings
  const handleUpdateSettings = (newSettings: ShopSettings) => {
    setAppState((prev) => ({
      ...prev,
      settings: newSettings,
    }));
  };

  // Handler: Clear All Data
  const handleClearAllData = () => {
    const clean: AppState = {
      sales: [],
      expenses: [],
      customers: [],
      customerTransactions: [],
      products: [],
      settings: {
        shopName: 'میری دکان',
        ownerName: '',
        phone: '',
        city: '',
        currencySymbol: '₨',
        language: appState.settings.language,
      },
    };
    setAppState(clean);
  };

  // Low stock badge
  const lowStockCount = appState.products.filter(
    (p) => p.stockQuantity <= (p.minStockThreshold || 5)
  ).length;

  // Customers owing badge
  const customersWithDueCount = appState.customers.filter((c) => c.balance > 0).length;

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 text-slate-900 selection:bg-emerald-200">
      {saveError && <div className="mx-auto mt-2 w-[calc(100%-1.5rem)] max-w-5xl rounded-xl bg-rose-100 px-3 py-2 text-xs font-semibold text-rose-800" role="alert">{saveError}</div>}
      {!saveError && <div className="mx-auto mt-2 flex w-[calc(100%-1.5rem)] max-w-5xl justify-end text-[10px] font-semibold text-slate-500" aria-live="polite">
        {saveStatus === 'saving'
          ? (appState.settings.language === 'ur' ? 'محفوظ ہو رہا ہے…' : 'Saving securely…')
          : (appState.settings.language === 'ur' ? 'کلاؤڈ میں محفوظ ہے' : 'Saved to cloud')}
      </div>}
      {/* App Header */}
          <Header
        settings={appState.settings}
        onLanguageChange={(lang) => handleUpdateSettings({ ...appState.settings, language: lang })}
        onOpenSettings={() => setCurrentTab('settings')}
        onLogout={() => { if (DEV_PREVIEW_BYPASS) window.location.reload(); else void signOut(auth); }}
      />

      {/* Main Tab Bar Navigation */}
      <Navigation
        currentTab={currentTab}
        onTabChange={(tab) => {
          setCurrentTab(tab);
          setTriggerAddSale(false);
          setTriggerAddExpense(false);
        }}
        language={appState.settings.language}
        lowStockCount={lowStockCount}
        customersWithDueCount={customersWithDueCount}
      />

      {/* Main View Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-3 sm:p-5">
        {currentTab === 'dashboard' && (
          <DashboardView
            sales={appState.sales}
            expenses={appState.expenses}
            customers={appState.customers}
            products={appState.products}
            transactions={appState.customerTransactions}
            language={appState.settings.language}
            onOpenAddSale={() => {
              setCurrentTab('sales');
              setTriggerAddSale(true);
            }}
            onOpenAddExpense={() => {
              setCurrentTab('expenses');
              setTriggerAddExpense(true);
            }}
            onOpenAddKhata={() => {
              setCurrentTab('khata');
            }}
            onOpenNewCustomer={() => {
              setCurrentTab('khata');
              setTriggerAddCustomer(true);
            }}
            onNavigateTab={(tab) => setCurrentTab(tab)}
            onSelectCustomer={(cust) => {
              setSelectedCustomerForLedger(cust);
              setCurrentTab('khata');
            }}
          />
        )}

        {currentTab === 'khata' && (
          <KhataView
            customers={appState.customers}
            transactions={appState.customerTransactions}
            settings={appState.settings}
            language={appState.settings.language}
            onAddCustomer={handleAddCustomer}
            onAddTransaction={handleAddCustomerTransaction}
            onDeleteTransaction={handleDeleteCustomerTransaction}
            onDeleteCustomer={handleDeleteCustomer}
            selectedCustomerFromParent={selectedCustomerForLedger}
            onClearSelectedCustomer={() => setSelectedCustomerForLedger(null)}
            triggerAddCustomerModal={triggerAddCustomer}
            onCloseAddCustomerModal={() => setTriggerAddCustomer(false)}
          />
        )}

        {currentTab === 'sales' && (
          <SalesView
            sales={appState.sales}
            customers={appState.customers}
            products={appState.products}
            settings={appState.settings}
            language={appState.settings.language}
            onAddSale={handleAddSale}
            onEditSale={handleEditSale}
            onDeleteSale={handleDeleteSale}
            showAddModalDirectly={triggerAddSale}
            onCloseAddModalDirectly={() => setTriggerAddSale(false)}
          />
        )}

        {currentTab === 'expenses' && (
          <ExpensesView
            expenses={appState.expenses}
            settings={appState.settings}
            language={appState.settings.language}
            onAddExpense={handleAddExpense}
            onEditExpense={handleEditExpense}
            onDeleteExpense={handleDeleteExpense}
            showAddModalDirectly={triggerAddExpense}
            onCloseAddModalDirectly={() => setTriggerAddExpense(false)}
          />
        )}

        {currentTab === 'inventory' && (
          <InventoryView
            products={appState.products}
            settings={appState.settings}
            language={appState.settings.language}
            onAddProduct={handleAddProduct}
            onEditProduct={handleEditProduct}
            onDeleteProduct={handleDeleteProduct}
            onAdjustStock={handleAdjustStock}
          />
        )}

        {currentTab === 'reports' && (
          <ReportsView
            sales={appState.sales}
            expenses={appState.expenses}
            customers={appState.customers}
            transactions={appState.customerTransactions}
            settings={appState.settings}
            language={appState.settings.language}
          />
        )}

        {currentTab === 'settings' && (
          <SettingsView
            state={appState}
            onUpdateSettings={handleUpdateSettings}
            onClearAllData={handleClearAllData}
          />
        )}
      </main>

      {/* Offline Status Toast Indicator */}
      <OfflineIndicator language={appState.settings.language} />
    </div>
  );
}
