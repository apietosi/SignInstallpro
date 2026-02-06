import React, { useState, useEffect } from 'react';

// PASTE YOUR WEB APP URL HERE
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbx9JfZ1q7jJuSnBM_qqdQxANAqV94KCdt3hMXaYosfPKFVMUMgMo1G805Kgipip2T-k/exec";

interface LogEntry {
  name: string;
  builder: string;
  community: string;
  action: string;
  item: string;
  quantity: number;
}

function App() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{
    installers: string[];
    builders: string[];
    communities: { builder: string; community: string }[];
    actions: string[];
    items: string[];
  } | null>(null);

  // App State
  const [step, setStep] = useState(1);
  const [selectedName, setSelectedName] = useState('');
  const [selectedBuilder, setSelectedBuilder] = useState('');
  const [selectedCommunity, setSelectedCommunity] = useState('');
  const [selectedAction, setSelectedAction] = useState('');
  const [selectedItem, setSelectedItem] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [queue, setQueue] = useState<any[]>([]);

  // 1. Fetch Master Data on Load
  useEffect(() => {
    fetch(WEB_APP_URL)
      .then(res => res.json())
      .then(json => {
        setData(json);
        setLoading(false);
      })
      .catch(err => console.error("Error loading sheet data:", err));
  }, []);

  // 2. Submit Logs to Google Sheets
  const submitToSheet = async () => {
    setLoading(true);
    try {
      const response = await fetch(WEB_APP_URL, {
        method: 'POST',
        mode: 'no-cors', // Required for Google Apps Script redirects
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(queue)
      });
      
      alert("Work successfully logged to spreadsheet!");
      setQueue([]);
      setStep(1);
    } catch (err) {
      alert("Error saving data. Check connection.");
    }
    setLoading(false);
  };

  const addToQueue = () => {
    const newEntry = {
      name: selectedName,
      builder: selectedBuilder,
      community: selectedCommunity,
      action: selectedAction,
      item: selectedItem,
      quantity: quantity
    };
    setQueue([...queue, newEntry]);
    // Reset action/item for next entry at same site
    setSelectedAction('');
    setSelectedItem('');
    setQuantity(1);
  };

  if (loading) return <div className="p-10 text-center">Loading SignInstallPro Data...</div>;

  return (
    <div className="max-w-md mx-auto p-4 font-sans bg-gray-50 min-h-screen">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-blue-900">SignInstallPro</h1>
        <p className="text-sm text-gray-500">Superior Sign Service Field App</p>
      </header>

      {/* STEP 1: WHO */}
      {step === 1 && (
        <div>
          <h2 className="text-xl mb-4">Who is this?</h2>
          <div className="grid grid-cols-2 gap-2">
            {data?.installers.map(name => (
              <button 
                key={name}
                onClick={() => { setSelectedName(name); setStep(2); }}
                className="p-4 bg-white border rounded shadow active:bg-blue-100"
              >
                {name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* STEP 2: BUILDER */}
      {step === 2 && (
        <div>
          <h2 className="text-xl mb-4">Select Builder</h2>
          <div className="flex flex-col gap-2">
            {data?.builders.map(builder => (
              <button 
                key={builder}
                onClick={() => { setSelectedBuilder(builder); setStep(3); }}
                className="p-4 bg-white border rounded shadow text-left"
              >
                {builder}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* STEP 3: COMMUNITY */}
      {step === 3 && (
        <div>
          <h2 className="text-xl mb-4">Select Community</h2>
          <div className="flex flex-col gap-2">
            {data?.communities
              .filter(c => c.builder === selectedBuilder)
              .map(c => (
                <button 
                  key={c.community}
                  onClick={() => { setSelectedCommunity(c.community); setStep(4); }}
                  className="p-4 bg-white border rounded shadow text-left"
                >
                  {c.community}
                </button>
              ))}
          </div>
        </div>
      )}

      {/* STEP 4: WORK DETAILS */}
      {step === 4 && (
        <div className="space-y-4">
          <h2 className="text-xl mb-2">Log Work</h2>
          
          <select 
            className="w-full p-3 border rounded"
            value={selectedAction}
            onChange={(e) => setSelectedAction(e.target.value)}
          >
            <option value="">-- Select Action --</option>
            {data?.actions.map(a => <option key={a} value={a}>{a}</option>)}
          </select>

          <select 
            className="w-full p-3 border rounded"
            value={selectedItem}
            onChange={(e) => setSelectedItem(e.target.value)}
          >
            <option value="">-- Select Item --</option>
            {data?.items.map(i => <option key={i} value={i}>{i}</option>)}
          </select>

          <div className="flex items-center gap-4">
            <span className="font-bold">Qty:</span>
            <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="px-4 py-2 bg-gray-200 rounded">-</button>
            <span className="text-lg">{quantity}</span>
            <button onClick={() => setQuantity(quantity + 1)} className="px-4 py-2 bg-gray-200 rounded">+</button>
          </div>

          <button 
            disabled={!selectedAction || !selectedItem}
            onClick={addToQueue}
            className="w-full p-4 bg-green-600 text-white rounded font-bold disabled:opacity-50"
          >
            Add To List
          </button>

          {queue.length > 0 && (
            <div className="mt-6 border-t pt-4">
              <h3 className="font-bold mb-2">Current Batch ({queue.length})</h3>
              <ul className="text-sm space-y-1 mb-4">
                {queue.map((q, idx) => (
                  <li key={idx} className="bg-blue-50 p-2 rounded">
                    {q.action} {q.item} (x{q.quantity})
                  </li>
                ))}
              </ul>
              <button 
                onClick={submitToSheet}
                className="w-full p-4 bg-blue-900 text-white rounded font-bold"
              >
                SUBMIT ALL TO SHEET
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
