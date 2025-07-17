import React, { useState, useEffect, useRef } from 'react';

// --- Helper Components ---

const SendIcon = ({ className }) => ( <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg> );
const BotIcon = ({ className }) => ( <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect><path d="m9 14 2 2 4-4"></path></svg> );
const UserIcon = ({ className }) => ( <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="10" r="3"></circle><path d="M7 20.662V19a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1.662"></path></svg> );
const DeveloperIcon = ({ className }) => ( <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg> );
const Spinner = () => <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>;

const LogViewer = ({ content, onClose }) => (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-2xl max-w-2xl w-full flex flex-col" style={{height: '80vh'}}>
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">API Response Log</h3>
                <button onClick={onClose} className="text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white text-2xl">&times;</button>
            </div>
            <div className="flex-1 bg-gray-100 dark:bg-gray-900 p-4 rounded-lg overflow-auto">
                <pre className="text-xs text-gray-800 dark:text-gray-200 whitespace-pre-wrap font-mono">
                    {content ? JSON.stringify(content, null, 2) : 'No API response to display yet.'}
                </pre>
            </div>
        </div>
    </div>
);

const Modal = ({ title, content, onClose }) => (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-2xl max-w-lg w-full text-center">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">{title}</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6 whitespace-pre-wrap">{content}</p>
            <button onClick={onClose} className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 font-semibold">Close</button>
        </div>
    </div>
);


// --- Main Application Components ---

const TicketForm = ({ setSubmittedTicket }) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [modalContent, setModalContent] = useState(null);
    const [submissionResult, setSubmissionResult] = useState(null);
    const [userName, setUserName] = useState('');
    const [email, setEmail] = useState('');
    const [itemNumber, setItemNumber] = useState('');
    const [errorTitle, setErrorTitle] = useState('');
    const [errorDescription, setErrorDescription] = useState('');
    const [selectedProgram, setSelectedProgram] = useState(null);
    const [ezoiItemType, setEzoiItemType] = useState(null);

    const handleProgramSelect = (program) => { setSelectedProgram(program); setEzoiItemType(null); setItemNumber(''); setSubmissionResult(null); };
    const handleEzoiTypeSelect = (type) => { setEzoiItemType(type); };
    const handleItemNumberChange = (e) => {
        let value = e.target.value;
        if (selectedProgram === 'EZOI') { setItemNumber(value.replace(/\D/g, '').slice(0, 4)); } 
        else if (selectedProgram === 'Windchill') {
            const formatted = value.toUpperCase().replace(/[^A-Z0-9-]/g, '').replace(/^(HW|AL)-?(\d{0,4})?-?(\d{0,4})?.*$/, (match, p1, p2, p3) => {
                let result = p1 || '';
                if (p2) result += '-' + p2;
                if (p3) result += '-' + p3;
                return result;
            });
            setItemNumber(formatted.slice(0, 12));
        }
    };
    const validateItemNumber = () => {
        if (selectedProgram === 'EZOI') return /^\d{4}$/.test(itemNumber);
        if (selectedProgram === 'Windchill') return /^(AL|HW)-\d{4}-\d{4}$/.test(itemNumber);
        return false;
    };
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbyYdNYHsrW4QIFzbRCtSp-ENPwJeUp-BmtUT2oQOMWttQli3v3Fd-jB7VZfk56iwpGF/exec';
        if (!userName.trim() || !email.trim()) { setModalContent({ title: "Validation Error", content: "Please fill out Name and Email." }); return; }
        if (!validateItemNumber()) {
            let errorMsg = `Please enter a valid ${selectedProgram} #.`;
            if (selectedProgram === 'EZOI') errorMsg += ' (e.g., 1234)';
            if (selectedProgram === 'Windchill') errorMsg += ' (e.g., HW-0000-0000)';
            setModalContent({ title: "Validation Error", content: errorMsg });
            return;
        }
        setIsSubmitting(true);
        setSubmissionResult(null);
        const ticketPayload = { action: 'submitTicket', userName, email, program: selectedProgram, itemType: ezoiItemType, itemNumber, errorTitle, errorDescription };
        try {
            const response = await fetch(WEB_APP_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(ticketPayload) });
            const result = await response.json();
            if (result.status === 'success' && result.ticketId) {
                const finalTicket = { ...ticketPayload, id: result.ticketId };
                setSubmittedTicket(finalTicket);
                setSubmissionResult(finalTicket);
            } else { throw new Error(result.message || 'The script returned an unknown error.'); }
        } catch (error) {
            let userFriendlyMessage = `Failed to submit the ticket: ${error.message}`;
            if (error.message.includes("Cannot read properties of null (reading 'appendRow')")) { userFriendlyMessage = "Submission failed: Could not find the 'Tickets' tab in the Google Sheet."; }
            setModalContent({ title: "Submission Error", content: userFriendlyMessage });
        } finally { setIsSubmitting(false); }
    };

    return (
        <>
            {modalContent && <Modal title={modalContent.title} content={modalContent.content} onClose={() => setModalContent(null)} />}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-lg w-full h-full flex flex-col">
                <h2 className="text-lg font-bold mb-3 text-center text-gray-800 dark:text-white">Submit a Ticket</h2>
                <div className="overflow-y-auto flex-grow pr-2">
                    <form onSubmit={handleSubmit} className="space-y-2 text-sm max-w-sm mx-auto">
                        <div><label htmlFor="userName" className="block text-xs font-medium text-gray-600 dark:text-gray-300">Name</label><input type="text" id="userName" value={userName} onChange={(e) => setUserName(e.target.value)} required className="mt-1 block w-full px-2 py-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" /></div>
                        <div><label htmlFor="email" className="block text-xs font-medium text-gray-600 dark:text-gray-300">Email</label><input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="mt-1 block w-full px-2 py-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" /></div>
                        {!selectedProgram && (<div className="pt-1"><label className="block text-xs font-medium text-center text-gray-600 dark:text-gray-300 mb-2">Which program needs assistance?</label><div className="flex flex-col gap-2"><button type="button" onClick={() => handleProgramSelect('EZOI')} className="py-1.5 px-3 rounded-md text-white font-semibold bg-blue-600 hover:bg-blue-700 shadow-md text-xs">EZOI</button><button type="button" onClick={() => handleProgramSelect('Windchill')} className="py-1.5 px-3 rounded-md text-white font-semibold bg-green-600 hover:bg-green-700 shadow-md text-xs">Windchill</button></div></div>)}
                        {selectedProgram && !ezoiItemType && selectedProgram === 'EZOI' && (<div className="border-t border-gray-200 dark:border-gray-700 pt-2"><label className="block text-xs font-medium text-center text-gray-600 dark:text-gray-300 mb-2">What is the item type?</label><div className="flex flex-col gap-2"><button type="button" onClick={() => handleEzoiTypeSelect('Asset')} className="py-1.5 px-3 rounded-md text-white font-semibold bg-blue-500 hover:bg-blue-600 shadow-md text-xs">Asset</button><button type="button" onClick={() => handleEzoiTypeSelect('Inventory')} className="py-1.5 px-3 rounded-md text-white font-semibold bg-blue-500 hover:bg-blue-600 shadow-md text-xs">Inventory</button></div><button type="button" onClick={() => setSelectedProgram(null)} className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline mt-2 w-full text-center">Back</button></div>)}
                        {(selectedProgram === 'Windchill' || (selectedProgram === 'EZOI' && ezoiItemType)) && (<div className="border-t border-gray-200 dark:border-gray-700 pt-2 space-y-2"><div className="flex justify-between items-center"><p className="text-sm font-semibold text-gray-800 dark:text-white">Program: {selectedProgram} {ezoiItemType && `(${ezoiItemType})`}</p><button type="button" onClick={() => { setSelectedProgram(null); setEzoiItemType(null); }} className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline">Change</button></div><div><label htmlFor="itemNumber" className="block text-xs font-medium text-gray-600 dark:text-gray-300">{selectedProgram} {ezoiItemType && `${ezoiItemType} `}# (Mandatory)</label><input type="text" id="itemNumber" value={itemNumber} onChange={handleItemNumberChange} required placeholder={selectedProgram === 'EZOI' ? 'e.g., 1234' : 'e.g., HW-0000-0000'} className="mt-1 block w-full px-2 py-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" /></div><div><label htmlFor="errorTitle" className="block text-xs font-medium text-gray-600 dark:text-gray-300">Error Title / Summary (Optional)</label><input type="text" id="errorTitle" value={errorTitle} onChange={(e) => setErrorTitle(e.target.value)} className="mt-1 block w-full px-2 py-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" /></div><div><label htmlFor="errorDescription" className="block text-xs font-medium text-gray-600 dark:text-gray-300">Error Description (Optional)</label><textarea id="errorDescription" value={errorDescription} onChange={(e) => setErrorDescription(e.target.value)} rows="3" className="mt-1 block w-full px-2 py-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"></textarea></div><button type="submit" disabled={isSubmitting} className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400 disabled:cursor-not-allowed">{isSubmitting ? <Spinner /> : 'Submit Ticket'}</button></div>)}
                        {submissionResult && (<div className="mt-3 p-2 bg-green-100 dark:bg-green-900/50 border border-green-300 dark:border-green-700 rounded-lg text-center"><p className="font-semibold text-green-800 dark:text-green-200 text-xs">Success!</p><p className="text-xs text-green-700 dark:text-green-300">Ticket <span className="font-mono">{submissionResult.id}</span> has been submitted.</p></div>)}
                    </form>
                </div>
            </div>
        </>
    );
};

const PreChatInterface = ({ setChatState, startChatWithEzoi }) => {
    const [ezoiNumber, setEzoiNumber] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (ezoiNumber.trim()) {
            startChatWithEzoi(ezoiNumber);
        }
    }

    return (
        <div className="absolute inset-0 bg-white/30 dark:bg-black/30 backdrop-blur-sm flex items-center justify-center z-10 p-4 rounded-xl">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-2xl text-center max-w-xs w-full">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Chat with an AI Assistant</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Do you have an inventory number?</p>
                <div className="space-y-3">
                    <form onSubmit={handleSubmit} className="space-y-3">
                        <input
                            type="text"
                            value={ezoiNumber}
                            onChange={(e) => setEzoiNumber(e.target.value.replace(/\D/g, ''))}
                            placeholder="Enter EZOI Number..."
                            className="block w-full px-3 py-1.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        />
                        <button type="submit" className="w-full py-2 px-4 rounded-md text-white font-semibold bg-indigo-600 hover:bg-indigo-700 shadow-md text-sm">
                            Yes, Start Chat
                        </button>
                    </form>
                    <button onClick={() => setChatState('active')} className="w-full py-2 px-4 rounded-md text-gray-800 dark:text-white font-semibold bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 shadow-md text-sm">
                        No, Just Ask a Question
                    </button>
                </div>
            </div>
        </div>
    );
};


const ChatAssistant = ({ submittedTicket }) => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const chatEndRef = useRef(null);
    const [isDeveloperMode, setIsDeveloperMode] = useState(false);
    const [expertResponse, setExpertResponse] = useState('');
    const [currentTicket, setCurrentTicket] = useState(null);
    const [lastApiResponse, setLastApiResponse] = useState(null);
    const [showLog, setShowLog] = useState(false);
    const [chatState, setChatState] = useState('pre-chat'); // 'pre-chat', 'active'
    const [showCommands, setShowCommands] = useState(false);

    const renderTextWithLinks = (text) => {
        const regex = /(\[([^\]]+)\]\((https?:\/\/[^\s]+)\))|(https?:\/\/[^\s]+)/g;
        const parts = text.split(regex);

        return parts.filter(part => part).map((part, i) => {
            const markdownMatch = part.match(/\[([^\]]+)\]\((https?:\/\/[^\s]+)\)/);
            if (markdownMatch) {
                const linkText = markdownMatch[1];
                const url = markdownMatch[2];
                return <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="text-indigo-400 underline">{linkText}</a>;
            }

            if (part.match(/^https?:\/\//)) {
                let displayText = part;
                try {
                    const urlObj = new URL(part);
                    displayText = urlObj.hostname.replace(/^www\./, '');
                } catch (e) {
                    displayText = part.length > 30 ? part.substring(0, 27) + '...' : part;
                }
                return <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="text-indigo-400 underline">{displayText}</a>;
            }

            return part;
        });
    };

    useEffect(() => {
        if (chatState === 'active' && messages.length === 0) {
            setMessages([{ role: 'assistant', isWelcome: true }]);
        }
    }, [chatState, messages.length]);

    useEffect(() => {
        if (submittedTicket) {
            setCurrentTicket(submittedTicket);
            const itemTypeString = submittedTicket.itemType ? ` ${submittedTicket.itemType}` : '';
            addMessage({ role: 'system', text: `New ticket submitted: #${submittedTicket.id} for ${submittedTicket.program}${itemTypeString} #${submittedTicket.itemNumber}. Chat context is now linked to this ticket.` });
            if (chatState !== 'active') setChatState('active');
        }
    }, [submittedTicket, chatState]);
    
    useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

    const addMessage = (message) => {
        setMessages(prev => [...prev, message]);
    };

    const callAppsScript = async (payload) => {
        const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbyYdNYHsrW4QIFzbRCtSp-ENPwJeUp-BmtUT2oQOMWttQli3v3Fd-jB7VZfk56iwpGF/exec';
        const response = await fetch(WEB_APP_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify(payload)
        });
        const result = await response.json();
        setLastApiResponse(result);
        if (!response.ok || result.status === 'error') {
            throw new Error(result.message || `Request failed: ${response.status}`);
        }
        return result;
    };

    const handleSendMessage = async (e, overrideCommand = null) => {
        if (e) e.preventDefault();
        const command = overrideCommand || input;
        if (!command.trim()) return;

        const userInput = command;
        
        if (isDeveloperMode && expertResponse.trim()) {
            addMessage({ role: 'user', text: userInput });
            addMessage({ role: 'developer', text: expertResponse });
            setIsLoading(true);
            try {
                await callAppsScript({
                    action: 'saveTrainingData',
                    userQuestion: userInput,
                    expertAnswer: expertResponse
                });
                addMessage({ role: 'system', text: 'Training data saved successfully!' });
            } catch (error) {
                addMessage({ role: 'system', text: `Error saving training data: ${error.message}` });
            } finally {
                setInput('');
                setExpertResponse('');
                setIsLoading(false);
            }
            return;
        }

        addMessage({ role: 'user', text: userInput });
        setInput('');
        setIsLoading(true);

        try {
            if (userInput.toLowerCase().startsWith('/ezoi')) {
                const [, itemType, itemNumber] = userInput.split(' ');
                if (!itemType || !itemNumber || !['asset', 'inventory'].includes(itemType.toLowerCase())) {
                    addMessage({ role: 'assistant', text: "Invalid command. Use format: `/ezoi <asset|inventory> <number>`" });
                    setIsLoading(false);
                    return;
                }
                addMessage({ role: 'system', text: `Searching EZOI for ${itemType} #${itemNumber}...` });
                const result = await callAppsScript({ action: 'getEzoiData', itemType, itemNumber });
                const item = result.item;
                let dataToDisplay = `No matching ${itemType} found for #${itemNumber}.`;
                if (item) {
                    const poNumberField = item.custom_fields.find(f => f.id === 35860);
                    const windchillNumberField = item.custom_fields.find(f => f.id === 35884);
                    
                    dataToDisplay = `EZOI Data for ${itemType} #${itemNumber}:\n` +
                                    `Name: ${item.name || 'N/A'}\n` +
                                    `Description: ${item.description || 'N/A'}\n` +
                                    `Windchill #: ${windchillNumberField?.value || 'N/A'}\n` +
                                    `Model #: ${item.product_model_number || 'N/A'}\n` +
                                    `Vendor: ${item.vendor_name || 'N/A'}\n` +
                                    `Location: ${item.location_name || 'N/A'}\n` +
                                    `PO #: ${poNumberField?.value || 'N/A'}\n` +
                                    `Net Quantity: ${item.net_quantity || '0'}`;
                }
                addMessage({ role: 'assistant', text: dataToDisplay });
            } else if (userInput.toLowerCase() === '/help') {
                addMessage({ 
                    role: 'assistant', 
                    text: `For detailed guides and resources, you can visit the [Logistics Resource Page](https://commons.lbl.gov/spaces/ALSU/pages/205818555/EZ+Office+Inventory+Management+and+Tracking). It's a great place to find information on inventory management and tracking.`
                });
            } else {
                const conversationHistory = messages.map(msg => `${msg.role}: ${msg.text}`).join('\n');
                const ticketContext = currentTicket ? `\nCurrent Ticket Context: #${currentTicket.id}, Program: ${currentTicket.program}, Item: ${currentTicket.itemNumber}.` : 'No ticket has been submitted yet.';
                const prompt = `You are the Logistics AI Assistant. Provide concise, professional help. Keep responses to 1-3 sentences.${ticketContext}\n\nHistory:\n${conversationHistory}\nuser: ${userInput}\n\nassistant:`;
                const result = await callAppsScript({ action: 'getAiResponse', prompt });
                const assistantResponse = result.candidates?.[0]?.content?.parts?.[0]?.text || "I'm having trouble responding right now.";
                addMessage({ role: 'assistant', text: assistantResponse });
            }
        } catch (error) {
            addMessage({ role: 'assistant', text: `An error occurred: ${error.message}` });
        } finally {
            setIsLoading(false);
        }
    };

    const startChatWithEzoi = (ezoiNumber) => {
        handleSendMessage(null, `/ezoi inventory ${ezoiNumber}`);
        setChatState('active');
    };

    return (
        <div className="relative w-full h-full">
            {chatState !== 'active' && (
                <PreChatInterface 
                    setChatState={setChatState} 
                    startChatWithEzoi={startChatWithEzoi} 
                />
            )}
            {showLog && <LogViewer content={lastApiResponse} onClose={() => setShowLog(false)} />}
            <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg flex flex-col w-full h-full overflow-hidden transition-all duration-300 ${chatState !== 'active' ? 'blur-sm pointer-events-none' : ''}`}>
                <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center flex-shrink-0">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white whitespace-nowrap">AI Support Chat</h3>
                    <div className="flex items-center space-x-2 flex-shrink-0">
                        <button onClick={() => setShowLog(true)} className="text-xs text-gray-500 hover:underline">API Log</button>
                        <div className="flex items-center space-x-1"><label htmlFor="devModeToggle" className="text-xs font-medium text-gray-600 dark:text-gray-300">Dev</label><button onClick={() => setIsDeveloperMode(!isDeveloperMode)} id="devModeToggle" className={`relative inline-flex flex-shrink-0 h-5 w-9 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${isDeveloperMode ? 'bg-indigo-600' : 'bg-gray-200'}`}><span aria-hidden="true" className={`inline-block h-4 w-4 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${isDeveloperMode ? 'translate-x-4' : 'translate-x-0'}`}></span></button></div>
                    </div>
                </div>
                <div className="flex-1 p-4 pt-2 overflow-y-auto space-y-4">
                    {messages.map((msg, index) => (
                        <div key={index} className={`flex items-start gap-2.5 ${msg.role === 'user' ? 'justify-end' : ''} ${msg.role === 'developer' || msg.role === 'system' ? 'justify-center' : ''}`}>
                             {msg.role === 'assistant' && <BotIcon className="w-5 h-5 text-indigo-500 flex-shrink-0 mt-1" />}
                             {msg.role === 'developer' && <DeveloperIcon className="w-5 h-5 text-green-500 flex-shrink-0 mt-1" />}
                            <div className={`px-3 py-2 rounded-lg max-w-lg ${msg.role === 'user' ? 'bg-indigo-600 text-white' : msg.role === 'developer' ? 'bg-green-100 dark:bg-green-900 border border-green-300 dark:border-green-700 text-green-800 dark:text-green-200' : msg.role === 'system' ? 'w-full bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-300 text-xs text-center' : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'}`}>
                                    {msg.isWelcome ? (
                                        <div>
                                            <p className="text-sm">
                                                Hello! I am the Logistics AI Assistant. You can ask me general questions or use commands for specific actions.
                                                {!showCommands ? (
                                                    <button onClick={() => setShowCommands(true)} className="text-indigo-400 underline ml-1 font-semibold">
                                                        see commands
                                                    </button>
                                                ) : (
                                                    <button onClick={() => setShowCommands(false)} className="text-indigo-400 underline ml-1 font-semibold">
                                                        hide commands
                                                    </button>
                                                )}
                                            </p>
                                            {showCommands && (
                                                <p className="text-sm whitespace-pre-wrap mt-2 font-mono bg-gray-100 dark:bg-gray-800 p-2 rounded">
                                                    {`/ezoi <asset|inventory> <number>\n/help`}
                                                </p>
                                            )}
                                        </div>
                                    ) : (
                                        <p className="text-sm whitespace-pre-wrap">
                                            {renderTextWithLinks(msg.text)}
                                        </p>
                                    )}
                            </div>
                            {msg.role === 'user' && <UserIcon className="w-5 h-5 text-gray-400 dark:text-gray-500 flex-shrink-0 mt-1" />}
                        </div>
                    ))}
                    {isLoading && ( <div className="flex items-start gap-2.5"><BotIcon className="w-5 h-5 text-indigo-500 flex-shrink-0" /><div className="px-3 py-2 rounded-lg bg-gray-200 dark:bg-gray-700"><div className="flex items-center gap-2"><div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div><div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse [animation-delay:0.1s]"></div><div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse [animation-delay:0.2s]"></div></div></div></div> )}
                    <div ref={chatEndRef} />
                </div>
                <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200 dark:border-gray-700">
                    {isDeveloperMode && (<textarea value={expertResponse} onChange={(e) => setExpertResponse(e.target.value)} placeholder="Enter the correct expert response here..." className="w-full px-3 py-2 mb-3 bg-green-50 dark:bg-green-900/50 border border-green-300 dark:border-green-700 rounded-md shadow-sm text-gray-900 dark:text-white focus:outline-none focus:ring-green-500 focus:border-green-500" rows="3"></textarea>)}
                    <div className="flex items-center gap-3"><input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder={isDeveloperMode ? "Enter the user's question here..." : "Type your message or command..."} className="flex-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" disabled={isLoading}/><button type="submit" disabled={isLoading} className="p-2 rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400"><SendIcon className="w-5 h-5"/></button></div>
                </form>
            </div>
        </div>
    );
};


export default function App() {
    const [submittedTicket, setSubmittedTicket] = useState(null);

    return (
        <div className="bg-gray-100 dark:bg-gray-900 h-screen flex flex-col font-sans text-gray-800 dark:text-gray-200 p-4">
            <header className="text-center mb-4 flex-shrink-0">
                <div className="inline-block bg-white dark:bg-gray-800 p-2 rounded-xl shadow-md">
                    <div className="flex items-center justify-center gap-2">
                        <img src="https://cdn-icons-png.flaticon.com/512/4344/4344945.png" alt="AI Assistant Icon" className="w-8 h-8" />
                        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Logistics AI Assistant</h1>
                    </div>
                </div>
                <p className="mt-2 text-xs text-gray-600 dark:text-gray-400 max-w-lg mx-auto">Submit a ticket for EZOI or Windchill issues, or chat with our AI for immediate help.</p>
            </header>

            <main className="flex flex-col lg:flex-row gap-4 items-stretch w-full max-w-5xl mx-auto flex-grow min-h-0">
                <div className="w-full lg:w-1/2 h-full">
                    <ChatAssistant submittedTicket={submittedTicket} />
                </div>
                <div className="w-full lg:w-1/2 h-full">
                    <TicketForm setSubmittedTicket={setSubmittedTicket} />
                </div>
            </main>
        </div>
    );
}
