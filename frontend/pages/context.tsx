import { useEffect, useState } from 'react';
const apiUrl = process.env.NEXT_PUBLIC_API_URL;
import Navbar from '@/components/Navbar';

export default function ContextPage() {
  const [content, setContent] = useState('');
  const [sourceType, setSourceType] = useState('note');
  const [contextList, setContextList] = useState([]);

  const handleSubmit = async () => {
    await fetch(`${apiUrl}/context/create/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, source_type: sourceType }),
    });
    setContent('');
    loadContexts();
  };

  const loadContexts = async () => {
    const res = await fetch(`${apiUrl}/context/`);
    const data = await res.json();
    setContextList(data);
  };

  useEffect(() => {
    loadContexts();
  }, []);

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 px-4 py-10">
        <div className="max-w-3xl mx-auto bg-white p-8 rounded-2xl shadow-xl space-y-6 dark:bg-gray-700">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 border-b pb-3">🧠 Daily Context Entry</h2>

          {/* Input Area */}
          <textarea
            className="w-full h-28 p-4 border border-gray-300 rounded-xl shadow-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-400 focus:outline-none"
            placeholder="Type your email, meeting note or message here..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />

          <select
            className="w-full p-3 border border-gray-300 rounded-xl text-gray-900 dark:text-gray-100 dark:bg-gray-700 shadow-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
            value={sourceType}
            onChange={(e) => setSourceType(e.target.value)}
          >
            <option value="note">📝 Note</option>
            <option value="email">📧 Email</option>
            <option value="whatsapp">💬 WhatsApp</option>
          </select>

          <button
            onClick={handleSubmit}
            className="bg-blue-600 hover:bg-blue-700 transition text-white font-semibold py-2 px-5 rounded-full shadow-md focus:ring-2 focus:ring-blue-300"
          >
            Submit Context
          </button>

          {/* Recent Contexts */}
          <div>
            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mt-8 mb-4">🕓 Recent Entries</h3>
            <ul className="space-y-3">
              {contextList.map((ctx: any, idx) => (
                <li
                  key={idx}
                  className="bg-gray-50 border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition"
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-semibold px-2 py-1 bg-blue-100 text-blue-800 rounded-full uppercase tracking-wide">
                      {ctx.source_type}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(ctx.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-gray-800">{ctx.content}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}
