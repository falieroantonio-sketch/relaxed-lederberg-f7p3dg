import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Plus,
  ArrowLeft,
  Trash2,
  Calendar,
  Euro,
  User,
  Save,
  X,
  Scale,
  Share2,
} from "lucide-react";

export default function App() {
  // --- STATO DELL'APPLICAZIONE ---
  const [view, setView] = useState("list"); // 'list' (clienti) o 'detail' (singolo cliente)
  const [customers, setCustomers] = useState(() => {
    // Carica i dati dal localStorage all'avvio
    const saved = localStorage.getItem("app_sospesi_db");
    return saved ? JSON.parse(saved) : [];
  });
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);

  // Stati per i form (Modali)
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState("");

  const [showAddDebtModal, setShowAddDebtModal] = useState(false);
  const [newDebtAmount, setNewDebtAmount] = useState("");
  const [newDebtDate, setNewDebtDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  // --- EFFETTI ---
  // Salva i dati ogni volta che cambiano
  useEffect(() => {
    localStorage.setItem("app_sospesi_db", JSON.stringify(customers));
  }, [customers]);

  // --- LOGICA DI CALCOLO E FUNZIONALITÀ ---

  // Funzione che calcola il totale dei sospesi per un array di debiti
  const calculateTotal = (debts) => {
    return debts.reduce((acc, curr) => acc + curr.amount, 0);
  };

  // Calcolo del totale complessivo di TUTTI i clienti
  const grandTotal = useMemo(() => {
    let total = 0;
    customers.forEach((customer) => {
      total += calculateTotal(customer.debts);
    });
    return total.toFixed(2);
  }, [customers]);

  const getSelectedCustomer = () =>
    customers.find((c) => c.id === selectedCustomerId);

  // FUNZIONE PER LA CONDIVISIONE TESTUALE
  const shareDebtSummary = async () => {
    const customer = getSelectedCustomer();
    if (!customer) return;

    const total = calculateTotal(customer.debts).toFixed(2);

    // Costruisce il corpo del messaggio con tutti i dettagli
    const debtList = customer.debts
      .map((debt) => {
        const dateStr = new Date(debt.date).toLocaleDateString("it-IT");
        const amountStr = debt.amount.toFixed(2);
        return `\n- Data: ${dateStr}, Importo: € ${amountStr}`;
      })
      .join("");

    const textSummary =
      `Riepilogo Sospesi Cliente: ${customer.name}\n\n` +
      `Dettagli degli importi:${debtList}\n\n` +
      `TOTALE DA SALDARE: € ${total}`;

    // Usa l'API nativa di condivisione (funziona su dispositivi mobili)
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Sospesi di ${customer.name}`,
          text: textSummary,
        });
        console.log("Riepilogo condiviso con successo.");
      } catch (error) {
        console.log("Condivisione annullata o fallita:", error);
      }
    } else {
      // Fallback per browser/dispositivi che non supportano navigator.share (es. desktop)
      prompt("Copia e incolla il riepilogo:", textSummary);
    }
  };

  // Funzioni CRUD (Create, Read, Update, Delete)
  const addCustomer = () => {
    if (!newCustomerName.trim()) return;
    const newCustomer = {
      id: Date.now(),
      name: newCustomerName.trim(),
      debts: [],
    };
    setCustomers([...customers, newCustomer]);
    setNewCustomerName("");
    setShowAddCustomerModal(false);
  };

  const deleteCustomer = (e, id) => {
    e.stopPropagation();
    if (
      window.confirm(
        "Sei sicuro di voler eliminare questo cliente e tutti i suoi sospesi?"
      )
    ) {
      setCustomers(customers.filter((c) => c.id !== id));
    }
  };

  const selectCustomer = (id) => {
    setSelectedCustomerId(id);
    setView("detail");
  };

  const addDebt = () => {
    const amount = parseFloat(newDebtAmount);
    if (isNaN(amount) || amount <= 0) return;

    const updatedCustomers = customers.map((c) => {
      if (c.id === selectedCustomerId) {
        return {
          ...c,
          debts: [
            ...c.debts,
            {
              id: Date.now(),
              date: newDebtDate,
              amount: amount,
            },
          ],
        };
      }
      return c;
    });

    setCustomers(updatedCustomers);
    setNewDebtAmount("");
    setNewDebtDate(new Date().toISOString().split("T")[0]);
    setShowAddDebtModal(false);
  };

  const deleteDebt = (debtId) => {
    const updatedCustomers = customers.map((c) => {
      if (c.id === selectedCustomerId) {
        return {
          ...c,
          debts: c.debts.filter((d) => d.id !== debtId),
        };
      }
      return c;
    });
    setCustomers(updatedCustomers);
  };

  // --- INTERFACCIA UTENTE ---

  return (
    <div className="flex flex-col h-screen bg-gray-100 font-sans text-gray-800">
      {/* HEADER */}
      <div className="bg-blue-600 text-white p-4 shadow-lg sticky top-0 z-20">
        <div className="flex items-center justify-between max-w-md mx-auto">
          {view === "detail" ? (
            <div className="flex justify-between items-center w-full">
              <button
                onClick={() => setView("list")}
                className="flex items-center hover:opacity-80 transition-opacity"
              >
                <ArrowLeft className="w-6 h-6 mr-2" />
                <span className="text-lg font-semibold truncate max-w-[150px]">
                  {getSelectedCustomer()?.name}
                </span>
              </button>
              {/* Nuovo Pulsante Condividi */}
              <button
                onClick={shareDebtSummary}
                className="flex items-center bg-blue-700 hover:bg-blue-800 py-1 px-3 rounded-lg text-sm font-medium transition-colors shadow-md"
              >
                <Share2 className="w-4 h-4 mr-1" /> Condividi
              </button>
            </div>
          ) : (
            <h1 className="text-xl font-bold flex items-center">
              <User className="w-6 h-6 mr-2" /> Lista Clienti
            </h1>
          )}
        </div>
      </div>

      {/* CONTENUTO PRINCIPALE */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-md mx-auto space-y-4">
          {/* RIEPILOGO TOTALE COMPLESSIVO (Solo nella vista lista) */}
          {view === "list" && (
            <div className="bg-green-600 text-white p-4 rounded-xl shadow-md border border-green-700 flex justify-between items-center sticky top-0 z-10">
              <span className="font-semibold text-lg flex items-center">
                <Scale className="w-6 h-6 mr-2" /> TOTALE COMPLESSIVO
              </span>
              <span className="text-3xl font-extrabold">€ {grandTotal}</span>
            </div>
          )}

          {/* VISTA: LISTA CLIENTI */}
          {view === "list" && (
            <>
              {customers.length === 0 ? (
                <div className="text-center text-gray-500 mt-10 p-4 bg-white rounded-xl shadow-sm">
                  <p className="mb-2">Nessun cliente presente.</p>
                  <p className="text-sm">
                    Premi il tasto blu (+) per aggiungere il primo cliente.
                  </p>
                </div>
              ) : (
                customers.map((customer) => (
                  <div
                    key={customer.id}
                    onClick={() => selectCustomer(customer.id)}
                    className="bg-white p-4 rounded-xl shadow-sm hover:shadow-lg active:bg-gray-50 transition-all flex justify-between items-center cursor-pointer border border-gray-100"
                  >
                    <div>
                      <h3 className="font-semibold text-lg">{customer.name}</h3>
                      <p className="text-sm text-gray-500">
                        {customer.debts.length} sospesi
                      </p>
                    </div>
                    <div className="flex items-center">
                      <span className="font-bold text-red-600 text-xl mr-4">
                        € {calculateTotal(customer.debts).toFixed(2)}
                      </span>
                      <button
                        onClick={(e) => deleteCustomer(e, customer.id)}
                        className="text-gray-400 hover:text-red-500 p-2 rounded-full transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </>
          )}

          {/* VISTA: DETTAGLIO CLIENTE */}
          {view === "detail" && getSelectedCustomer() && (
            <div className="space-y-4">
              {/* Riepilogo Totale in alto */}
              <div className="bg-red-50 p-4 rounded-xl border border-red-200 shadow-sm flex justify-between items-center">
                <span className="text-red-800 font-medium">
                  Totale Da Saldare Cliente
                </span>
                <span className="text-2xl font-bold text-red-600">
                  € {calculateTotal(getSelectedCustomer().debts).toFixed(2)}
                </span>
              </div>

              {/* Tabella Sospesi */}
              <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
                {/* Intestazione delle due sezioni richieste */}
                <div className="grid grid-cols-3 bg-gray-100 p-3 border-b text-sm font-semibold text-gray-700">
                  <div className="col-span-1 flex items-center">
                    <Calendar className="w-4 h-4 mr-1" /> Data
                  </div>
                  <div className="col-span-1 text-right flex items-center justify-end">
                    <Euro className="w-4 h-4 mr-1" /> Sospeso
                  </div>
                  <div className="col-span-1 text-center">Azioni</div>
                </div>

                {/* Lista Sospesi */}
                {getSelectedCustomer().debts.length === 0 ? (
                  <div className="p-8 text-center text-gray-400">
                    Nessun sospeso registrato.
                  </div>
                ) : (
                  // Mostra gli ultimi sospesi per primi (reverse)
                  getSelectedCustomer()
                    .debts.slice()
                    .reverse()
                    .map((debt) => (
                      <div
                        key={debt.id}
                        className="grid grid-cols-3 p-4 border-b last:border-0 items-center hover:bg-gray-50 transition-colors"
                      >
                        <div className="col-span-1 text-gray-800 text-sm">
                          {new Date(debt.date).toLocaleDateString("it-IT")}
                        </div>
                        <div className="col-span-1 text-right font-mono font-bold text-red-600">
                          {debt.amount.toFixed(2)}
                        </div>
                        <div className="col-span-1 text-right">
                          <button
                            onClick={() => deleteDebt(debt.id)}
                            className="text-gray-400 hover:text-red-500 p-1 rounded-full transition-colors"
                            title="Elimina sospeso"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* FAB (Floating Action Button) */}
      <div className="fixed bottom-6 right-6 max-w-md mx-auto w-full flex justify-end pointer-events-none pr-4">
        <button
          onClick={() =>
            view === "list"
              ? setShowAddCustomerModal(true)
              : setShowAddDebtModal(true)
          }
          className="bg-blue-600 hover:bg-blue-700 text-white p-5 rounded-full shadow-xl pointer-events-auto transition-transform active:scale-95 flex items-center justify-center transform hover:rotate-90 duration-300"
          title={view === "list" ? "Aggiungi Cliente" : "Aggiungi Sospeso"}
        >
          <Plus className="w-7 h-7" />
        </button>
      </div>

      {/* MODALE: AGGIUNGI CLIENTE */}
      {showAddCustomerModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl animate-in fade-in zoom-in duration-300">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Nuovo Cliente</h3>
              <button
                onClick={() => {
                  setShowAddCustomerModal(false);
                  setNewCustomerName("");
                }}
              >
                <X className="w-6 h-6 text-gray-400 hover:text-red-500" />
              </button>
            </div>
            <input
              autoFocus
              type="text"
              placeholder="Nome del cliente (es. Mario Rossi)"
              className="w-full p-3 border border-gray-300 rounded-xl mb-4 text-lg focus:ring-2 focus:ring-blue-500 outline-none"
              value={newCustomerName}
              onChange={(e) => setNewCustomerName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") addCustomer();
              }}
            />
            <button
              onClick={addCustomer}
              className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold text-lg shadow-md hover:bg-blue-700 active:scale-95 transition-transform duration-150"
              disabled={!newCustomerName.trim()}
            >
              Salva Cliente
            </button>
          </div>
        </div>
      )}

      {/* MODALE: AGGIUNGI SOSPESO */}
      {showAddDebtModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl animate-in fade-in zoom-in duration-300">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">
                Aggiungi Sospeso per {getSelectedCustomer()?.name}
              </h3>
              <button
                onClick={() => {
                  setShowAddDebtModal(false);
                  setNewDebtAmount("");
                }}
              >
                <X className="w-6 h-6 text-gray-400 hover:text-red-500" />
              </button>
            </div>

            <label className="block text-sm font-medium text-gray-600 mb-1">
              Importo (€)
            </label>
            <input
              autoFocus
              type="number"
              step="0.01"
              placeholder="0.00"
              className="w-full p-3 border border-gray-300 rounded-xl mb-4 text-2xl font-mono text-center focus:ring-2 focus:ring-blue-500 outline-none"
              value={newDebtAmount}
              onChange={(e) => setNewDebtAmount(e.target.value)}
            />

            <label className="block text-sm font-medium text-gray-600 mb-1">
              Data
            </label>
            <input
              type="date"
              className="w-full p-3 border border-gray-300 rounded-xl mb-6 text-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
              value={newDebtDate}
              onChange={(e) => setNewDebtDate(e.target.value)}
            />

            <button
              onClick={addDebt}
              className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold text-lg shadow-md hover:bg-blue-700 active:scale-95 transition-transform duration-150 flex items-center justify-center"
              disabled={!newDebtAmount || parseFloat(newDebtAmount) <= 0}
            >
              <Save className="w-5 h-5 mr-2" /> Salva Sospeso
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
