import React, { useState, useEffect, useMemo } from 'react';
import { 
  User, 
  HardHat, 
  MapPin, 
  Plus, 
  CheckCircle, 
  Settings, 
  ClipboardList, 
  ArrowLeft,
  Briefcase,
  ChevronRight,
  Download,
  Trash2,
  Sparkles
} from 'lucide-react';
import { Assignment, LogItem, AppStep } from './types';
import { 
  getAssignments, 
  getUniqueNames, 
  getBuildersForName, 
  getCommunities, 
  saveLogs, 
  getStoredLogs, 
  clearLogs,
  saveSheetData,
  getStoredSheetData,
  exportLogsToCSV
} from './services/dataService';
import { generateDailyReport } from './services/geminiService';
import { COMMON_ACTIONS, COMMON_ITEMS } from './constants';

const App = () => {
  // Global Data State
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [logs, setLogs] = useState<LogItem[]>([]);
  
  // Selection State
  const [step, setStep] = useState<AppStep>(AppStep.SELECT_NAME);
  const [selectedName, setSelectedName] = useState<string>('');
  const [selectedBuilder, setSelectedBuilder] = useState<string>('');
  const [selectedCommunity, setSelectedCommunity] = useState<string>('');
  
  // Work Item State
  const [currentAction, setCurrentAction] = useState<string>('Install');
  const [currentItem, setCurrentItem] = useState<string>('');
  const [currentQuantity, setCurrentQuantity] = useState<number>(1);
  const [sessionQueue, setSessionQueue] = useState<LogItem[]>([]); // Items waiting to be saved in this session

  // Admin/Config State
  const [sheetDataInput, setSheetDataInput] = useState<string>('');
  const [aiReport, setAiReport] = useState<string>('');
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  // Initialize Data
  useEffect(() => {
    setAssignments(getAssignments());
    setLogs(getStoredLogs());
    setSheetDataInput(getStoredSheetData());
  }, []);

  // --- Derived Data ---
  const uniqueNames = useMemo(() => getUniqueNames(assignments), [assignments]);
  
  const availableBuilders = useMemo(() => 
    selectedName ? getBuildersForName(assignments, selectedName) : [], 
    [assignments, selectedName]
  );
  
  const availableCommunities = useMemo(() => 
    selectedName && selectedBuilder ? getCommunities(assignments, selectedName, selectedBuilder) : [], 
    [assignments, selectedName, selectedBuilder]
  );

  // --- Handlers ---

  const handleNameSelect = (name: string) => {
    setSelectedName(name);
    setStep(AppStep.SELECT_BUILDER);
  };

  const handleBuilderSelect = (builder: string) => {
    setSelectedBuilder(builder);
    setStep(AppStep.SELECT_COMMUNITY);
  };

  const handleCommunitySelect = (community: string) => {
    setSelectedCommunity(community);
    setStep(AppStep.LOG_WORK);
  };

  const handleAddToQueue = () => {
    if (!currentItem) return;

    const newItem: LogItem = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      name: selectedName,
      builder: selectedBuilder,
      community: selectedCommunity,
      action: currentAction,
      item: currentItem,
      quantity: currentQuantity
    };

    setSessionQueue(prev => [...prev, newItem]);
    // Reset form for next item
    setCurrentItem('');
    setCurrentQuantity(1);
    // Keep action same as convenience? Or reset? Let's keep it.
  };

  const handleFinishJob = () => {
    // If there's pending input in the form, add it first
    let finalQueue = [...sessionQueue];
    if (currentItem) {
      const newItem: LogItem = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        name: selectedName,
        builder: selectedBuilder,
        community: selectedCommunity,
        action: currentAction,
        item: currentItem,
        quantity: currentQuantity
      };
      finalQueue.push(newItem);
    }

    if (finalQueue.length === 0) return;

    const updatedLogs = saveLogs(finalQueue);
    setLogs(updatedLogs);
    setSessionQueue([]);
    setCurrentItem('');
    setCurrentQuantity(1);
    setStep(AppStep.SUMMARY);
  };

  const handleStartNew = () => {
    // Determine where to go back to. 
    // Usually keep the name, maybe clear builder/community?
    // Let's go back to Builder selection to allow easy switching of sites for same person.
    setSelectedCommunity('');
    setSelectedBuilder('');
    setStep(AppStep.SELECT_BUILDER);
  };

  const handleUpdateSheetData = () => {
    saveSheetData(sheetDataInput);
    setAssignments(getAssignments());
    alert('Builder assignments updated!');
  };

  const handleExportCSV = () => {
    const csv = exportLogsToCSV(logs);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sign_logs_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const handleGenerateReport = async () => {
    setIsGeneratingReport(true);
    const report = await generateDailyReport(logs);
    setAiReport(report);
    setIsGeneratingReport(false);
  };

  // --- Render Steps ---

  const renderHeader = (title: string, backStep?: AppStep) => (
    <div className="bg-brand-900 text-white p-4 shadow-md sticky top-0 z-10 flex items-center justify-between">
      <div className="flex items-center gap-3">
        {backStep !== undefined && (
          <button onClick={() => setStep(backStep)} className="p-1 hover:bg-brand-700 rounded-full transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </button>
        )}
        <h1 className="text-xl font-bold tracking-tight">{title}</h1>
      </div>
      <div className="flex gap-2">
         {step !== AppStep.ADMIN && (
             <button onClick={() => setStep(AppStep.ADMIN)} className="p-2 bg-brand-800 rounded-lg hover:bg-brand-700">
             <Settings className="w-5 h-5" />
           </button>
         )}
      </div>
    </div>
  );

  // Step 1: Select Name
  if (step === AppStep.SELECT_NAME) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        {renderHeader("SignTrack Pro")}
        <div className="flex-1 p-6 max-w-md mx-auto w-full flex flex-col justify-center">
          <h2 className="text-2xl font-bold text-slate-800 mb-6 text-center">Who are you?</h2>
          <div className="grid gap-4">
            {uniqueNames.map(name => (
              <button
                key={name}
                onClick={() => handleNameSelect(name)}
                className="flex items-center gap-4 bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:border-brand-500 hover:ring-2 hover:ring-brand-500/20 transition-all text-left group"
              >
                <div className="bg-brand-100 p-3 rounded-full text-brand-600 group-hover:bg-brand-600 group-hover:text-white transition-colors">
                  <User className="w-6 h-6" />
                </div>
                <span className="text-lg font-medium text-slate-700 group-hover:text-brand-700">{name}</span>
                <ChevronRight className="w-5 h-5 ml-auto text-slate-400" />
              </button>
            ))}
            {uniqueNames.length === 0 && (
                <div className="text-center text-slate-500 p-8">
                    No installers found. Check Admin Settings to add data.
                </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Step 2: Select Builder
  if (step === AppStep.SELECT_BUILDER) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        {renderHeader("Select Builder", AppStep.SELECT_NAME)}
        <div className="flex-1 p-6 max-w-md mx-auto w-full">
           <div className="mb-6">
            <p className="text-sm text-slate-500 uppercase tracking-wider font-semibold">Installer</p>
            <p className="text-lg font-medium text-slate-900 flex items-center gap-2">
                <User className="w-4 h-4 text-brand-500" /> {selectedName}
            </p>
           </div>
           <h2 className="text-xl font-bold text-slate-800 mb-4">Assigned Builders</h2>
           <div className="grid gap-3">
            {availableBuilders.map(builder => (
              <button
                key={builder}
                onClick={() => handleBuilderSelect(builder)}
                className="flex items-center gap-4 bg-white p-5 rounded-xl shadow-sm border border-slate-200 hover:border-brand-500 hover:shadow-md transition-all text-left"
              >
                 <div className="bg-indigo-50 p-3 rounded-lg text-indigo-600">
                  <Briefcase className="w-6 h-6" />
                </div>
                <span className="text-lg font-medium text-slate-700">{builder}</span>
              </button>
            ))}
            {availableBuilders.length === 0 && (
                <div className="text-center p-8 bg-white rounded-lg border border-dashed border-slate-300">
                    <p className="text-slate-500">No builders assigned to you today.</p>
                </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Step 3: Select Community
  if (step === AppStep.SELECT_COMMUNITY) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        {renderHeader("Select Community", AppStep.SELECT_BUILDER)}
        <div className="flex-1 p-6 max-w-md mx-auto w-full">
           <div className="mb-6 flex gap-4 text-sm">
                <div>
                    <p className="text-slate-500">Installer</p>
                    <p className="font-medium">{selectedName}</p>
                </div>
                <div>
                    <p className="text-slate-500">Builder</p>
                    <p className="font-medium">{selectedBuilder}</p>
                </div>
           </div>

           <h2 className="text-xl font-bold text-slate-800 mb-4">Select Community</h2>
           <div className="grid gap-3">
            {availableCommunities.map(comm => (
              <button
                key={comm}
                onClick={() => handleCommunitySelect(comm)}
                className="flex items-center gap-4 bg-white p-5 rounded-xl shadow-sm border border-slate-200 hover:border-brand-500 hover:shadow-md transition-all text-left"
              >
                 <div className="bg-emerald-50 p-3 rounded-lg text-emerald-600">
                  <MapPin className="w-6 h-6" />
                </div>
                <span className="text-lg font-medium text-slate-700">{comm}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Step 4: Work Log Form
  if (step === AppStep.LOG_WORK) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        {renderHeader("Log Installation", AppStep.SELECT_COMMUNITY)}
        
        <div className="bg-white border-b border-slate-200 p-4 shadow-sm">
             <div className="max-w-md mx-auto flex flex-col gap-1">
                <div className="flex items-center text-sm text-slate-500 gap-2">
                    <Briefcase className="w-4 h-4" /> {selectedBuilder}
                </div>
                <div className="flex items-center text-lg font-bold text-slate-800 gap-2">
                    <MapPin className="w-5 h-5 text-brand-600" /> {selectedCommunity}
                </div>
             </div>
        </div>

        <div className="flex-1 p-6 max-w-md mx-auto w-full space-y-6">
            
            {/* Action Selection */}
            <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Action</label>
                <div className="grid grid-cols-2 gap-2">
                    {COMMON_ACTIONS.map(action => (
                        <button
                            key={action}
                            onClick={() => setCurrentAction(action)}
                            className={`p-3 rounded-lg text-sm font-medium transition-all ${
                                currentAction === action 
                                ? 'bg-brand-600 text-white shadow-md' 
                                : 'bg-white border border-slate-300 text-slate-600 hover:bg-slate-50'
                            }`}
                        >
                            {action}
                        </button>
                    ))}
                </div>
            </div>

            {/* Item Input */}
            <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Item Installed</label>
                <input 
                    type="text" 
                    value={currentItem}
                    onChange={(e) => setCurrentItem(e.target.value)}
                    placeholder="e.g. 4x4 Post"
                    list="common-items"
                    className="w-full p-4 text-lg border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                />
                <datalist id="common-items">
                    {COMMON_ITEMS.map(item => <option key={item} value={item} />)}
                </datalist>
            </div>

            {/* Quantity */}
            <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Quantity</label>
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => setCurrentQuantity(Math.max(1, currentQuantity - 1))}
                        className="w-12 h-12 flex items-center justify-center bg-slate-100 rounded-lg text-slate-600 hover:bg-slate-200 text-xl font-bold"
                    >-</button>
                    <div className="flex-1 text-center bg-white border border-slate-300 rounded-lg h-12 flex items-center justify-center text-xl font-bold">
                        {currentQuantity}
                    </div>
                    <button 
                         onClick={() => setCurrentQuantity(currentQuantity + 1)}
                        className="w-12 h-12 flex items-center justify-center bg-brand-100 rounded-lg text-brand-700 hover:bg-brand-200 text-xl font-bold"
                    >+</button>
                </div>
            </div>

            {/* Pending List Preview */}
            {sessionQueue.length > 0 && (
                <div className="mt-6 bg-slate-100 p-4 rounded-lg">
                    <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Ready to Submit</h4>
                    <ul className="space-y-2">
                        {sessionQueue.map((q, i) => (
                            <li key={i} className="flex justify-between text-sm bg-white p-2 rounded border border-slate-200">
                                <span>{q.action} - {q.item}</span>
                                <span className="font-bold">x{q.quantity}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            <div className="pt-4 flex flex-col gap-3">
                 <button 
                    onClick={handleAddToQueue}
                    disabled={!currentItem}
                    className="w-full py-4 bg-white border-2 border-brand-500 text-brand-600 font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-brand-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Plus className="w-5 h-5" />
                    Add Another Item
                </button>
                
                <button 
                    onClick={handleFinishJob}
                    disabled={!currentItem && sessionQueue.length === 0}
                    className="w-full py-4 bg-brand-600 text-white font-bold rounded-xl shadow-lg shadow-brand-500/30 flex items-center justify-center gap-2 hover:bg-brand-700 active:scale-95 transition-all disabled:opacity-50 disabled:shadow-none"
                >
                    <CheckCircle className="w-5 h-5" />
                    Finish & Submit
                </button>
            </div>
        </div>
      </div>
    );
  }

  // Step 5: Success Summary
  if (step === AppStep.SUMMARY) {
    return (
        <div className="min-h-screen bg-green-50 flex flex-col items-center justify-center p-6 text-center">
            <div className="bg-white p-4 rounded-full shadow-lg mb-6 animate-bounce">
                <CheckCircle className="w-16 h-16 text-green-500" />
            </div>
            <h2 className="text-3xl font-bold text-slate-800 mb-2">Great Job, {selectedName.split(' ')[0]}!</h2>
            <p className="text-slate-600 mb-8 max-w-xs mx-auto">
                Work logged for <strong>{selectedCommunity}</strong>.
            </p>

            <div className="w-full max-w-sm space-y-3">
                 <button 
                    onClick={handleStartNew}
                    className="w-full py-4 bg-brand-600 text-white font-bold rounded-xl shadow-lg hover:bg-brand-700 transition-all"
                >
                    Next Job (Same User)
                </button>
                <button 
                    onClick={() => {
                        setSelectedName('');
                        setSelectedBuilder('');
                        setSelectedCommunity('');
                        setStep(AppStep.SELECT_NAME);
                    }}
                    className="w-full py-4 bg-white text-slate-600 font-bold rounded-xl border border-slate-300 hover:bg-slate-50 transition-all"
                >
                    Switch User
                </button>
            </div>
        </div>
    )
  }

  // Admin / Settings
  if (step === AppStep.ADMIN) {
    return (
        <div className="min-h-screen bg-slate-100 flex flex-col">
            {renderHeader("Admin Dashboard", AppStep.SELECT_NAME)}
            
            <div className="flex-1 p-6 max-w-4xl mx-auto w-full space-y-8">
                
                {/* Data Input Section */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <HardHat className="w-5 h-5 text-brand-600" />
                        Assignment Data Source
                    </h3>
                    <p className="text-sm text-slate-500 mb-2">
                        Paste CSV data here (Columns: Name, Builder, Community). This simulates the Google Sheet.
                    </p>
                    <textarea 
                        className="w-full h-32 p-3 text-xs font-mono border border-slate-300 rounded-lg mb-3 focus:ring-2 focus:ring-brand-500 outline-none"
                        value={sheetDataInput}
                        onChange={(e) => setSheetDataInput(e.target.value)}
                    />
                    <button 
                        onClick={handleUpdateSheetData}
                        className="px-4 py-2 bg-slate-800 text-white text-sm font-medium rounded-lg hover:bg-slate-900"
                    >
                        Update Assignments
                    </button>
                </div>

                {/* Logs Section */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <ClipboardList className="w-5 h-5 text-brand-600" />
                            Work Logs ({logs.length})
                        </h3>
                        <div className="flex gap-2">
                            <button 
                                onClick={() => {
                                    if(confirm('Are you sure you want to clear all logs?')) {
                                        clearLogs();
                                        setLogs([]);
                                    }
                                }}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                title="Clear Logs"
                            >
                                <Trash2 className="w-5 h-5" />
                            </button>
                            <button 
                                onClick={handleExportCSV}
                                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700"
                            >
                                <Download className="w-4 h-4" /> Export CSV
                            </button>
                        </div>
                    </div>
                    
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-slate-600">
                            <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                                <tr>
                                    <th className="px-4 py-3">Time</th>
                                    <th className="px-4 py-3">Who</th>
                                    <th className="px-4 py-3">Where</th>
                                    <th className="px-4 py-3">Action</th>
                                    <th className="px-4 py-3">Item</th>
                                    <th className="px-4 py-3">Qty</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.slice().reverse().slice(0, 5).map(log => (
                                    <tr key={log.id} className="border-b border-slate-100 hover:bg-slate-50">
                                        <td className="px-4 py-2">{new Date(log.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
                                        <td className="px-4 py-2 font-medium">{log.name}</td>
                                        <td className="px-4 py-2">{log.builder} / {log.community}</td>
                                        <td className="px-4 py-2">{log.action}</td>
                                        <td className="px-4 py-2">{log.item}</td>
                                        <td className="px-4 py-2">{log.quantity}</td>
                                    </tr>
                                ))}
                                {logs.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="px-4 py-4 text-center text-slate-400">No logs yet.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    {logs.length > 5 && <p className="text-xs text-center text-slate-400 mt-2">Showing last 5 of {logs.length} entries</p>}
                </div>

                {/* Gemini AI Reporting */}
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-xl shadow-sm border border-indigo-100">
                     <div className="flex items-center gap-2 mb-4">
                        <Sparkles className="w-6 h-6 text-purple-600" />
                        <h3 className="text-lg font-bold text-indigo-900">AI Supervisor Report</h3>
                     </div>
                     <p className="text-sm text-indigo-700 mb-4">
                        Use Gemini AI to analyze today's logs and generate a billing summary for the finance department.
                     </p>
                     
                     <button
                        onClick={handleGenerateReport}
                        disabled={isGeneratingReport || logs.length === 0}
                        className="mb-4 px-6 py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                     >
                        {isGeneratingReport ? (
                            <>Generating...</>
                        ) : (
                            <>Generate Daily Summary <Sparkles className="w-4 h-4" /></>
                        )}
                     </button>

                     {aiReport && (
                         <div className="bg-white p-4 rounded-lg border border-indigo-100 shadow-inner">
                            <pre className="whitespace-pre-wrap font-sans text-sm text-slate-700 leading-relaxed">
                                {aiReport}
                            </pre>
                         </div>
                     )}
                </div>

            </div>
        </div>
    );
  }

  return <div>Loading...</div>;
};

export default App;