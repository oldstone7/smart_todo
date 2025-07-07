import { useState, useRef, useEffect } from 'react';
const apiUrl = process.env.NEXT_PUBLIC_API_URL;
import Navbar from '@/components/Navbar';
import { FaSpinner, FaInfoCircle } from 'react-icons/fa';

export default function TaskPage() {
  const [form, setForm] = useState({
    title: '',
    description: '',
    context: '',
  });
  const [suggestion, setSuggestion] = useState<any>(null);
  const [submitted, setSubmitted] = useState(false);
  const [loadingSuggestion, setLoadingSuggestion] = useState(false);
  const [loadingRescore, setLoadingRescore] = useState(false);

  const [hasSuggestions, setHasSuggestions] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const saveButtonRef = useRef<HTMLButtonElement>(null);

  // Auto-hide success message after 4 seconds
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (submitted) {
      setShowSuccess(true);
      timer = setTimeout(() => {
        setShowSuccess(false);
        setSubmitted(false);
      }, 4000);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [submitted]);

  const handleChange = (e: any) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const fetchSuggestion = async () => {
    setLoadingSuggestion(true);
    try {
      const now = new Date();
      const currentDate = now.toISOString().split("T")[0]; // e.g. 2025-07-05
      const currentDay = now.toLocaleDateString("en-US", { weekday: "long" }); // e.g. Sunday  
      const res = await fetch(`${apiUrl}/ai/suggest/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          current_date: currentDate,
          current_day: currentDay,
        }),
      });
  
      const data = await res.json();
      setSuggestion(data);
      setHasSuggestions(true);
    } catch (err) {
      console.error('AI suggestion error:', err);
    }
    setLoadingSuggestion(false);
  };
  

  const handleSubmit = async () => {
    if (!hasSuggestions) return;
    const now = new Date();
    const currentDate = now.toISOString().split("T")[0];
    const currentDay = now.toLocaleDateString("en-US", { weekday: "long" });
    const deadline = suggestion?.suggested_deadline || null;
  
    setLoadingRescore(true); // Start spinner here
  
    try {
      // 🔁 Fetch existing tasks
      const resTasks = await fetch(`${apiUrl}/tasks/`);
      const tasks = await resTasks.json();
  
      // 🔍 Check for overlap
      const overlappingTasks = tasks.filter((task: any) => {
        const existingDate = new Date(task.deadline);
        const newDate = new Date(deadline);
        const diffDays = Math.abs(existingDate.getTime() - newDate.getTime()) / (1000 * 60 * 60 * 24);
      
        return diffDays <= 2 && task.status < 90; // ✅ Only include tasks less than 90% complete
      });
      
  
      // ⚠️ AI Reprioritize
      if (overlappingTasks.length >= 2) {
        const confirm = window.confirm("⚠️ This task overlaps with others. You may get overloaded. Proceed anyway?");
        if (!confirm) {
          setLoadingRescore(false);
          return;
        }
  
        try {
          const rescoreRes = await fetch(`${apiUrl}/ai/rescore/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              new_task: {
                title: form.title,
                description: suggestion?.enhanced_description || form.description,
                context: form.context,
                deadline,
              },
              current_tasks: overlappingTasks,
              current_date: currentDate,
              current_day: currentDay,
            }),
          });
  
          if (!rescoreRes.ok) {
            const errorText = await rescoreRes.text();
            console.error("AI Re-score failed:", errorText);
            alert("❌ Failed to rescore tasks. Check server logs.");
            setLoadingRescore(false);
            return;
          }
  
          const updated = await rescoreRes.json();
          console.log("📊 Reprioritized tasks:", updated);
  
          // 🔁 Save new priority scores
          for (const updatedTask of updated) {
            const original = tasks.find(t => t.title === updatedTask.title);
            if (!original) continue;
  
            await fetch(`${apiUrl}/tasks/${original.id}/`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                ...original,
                priority_score: updatedTask.new_priority_score,
              }),
            });
          }
        } catch (err) {
          console.error("Re-score fetch failed:", err);
          alert("Something went wrong with task re-scoring.");
          setLoadingRescore(false);
          return;
        }
      }
  
      // ✅ Create the new task
      const res = await fetch(`${apiUrl}/tasks/create/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          description: suggestion?.enhanced_description || form.description,
          priority_score: suggestion?.priority_score || 3,
          deadline,
          status: 0,
          category: suggestion?.suggested_category || "Uncategorized",
        }),
      });
  
      if (res.ok) {
        setSubmitted(true);
        setForm({ title: '', description: '', context: '' });
        setSuggestion(null);
        setHasSuggestions(false);
      }
    } catch (err) {
      console.error("Task submission error:", err);
    }
  
    setLoadingRescore(false); // ✅ Stop spinner
  };
  
  

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-900 dark:to-gray-900 py-10 px-4">
        <div className="max-w-2xl mx-auto bg-white dark:bg-gray-700 rounded-2xl shadow-xl p-8 space-y-6">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 border-b pb-3">📝 Create a Smart Task</h2>

          <div className="space-y-4">
            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="Task Title"
              className="w-full p-3 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-400 focus:outline-none text-gray-900 dark:text-white"
            />
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Task Description"
              className="w-full p-3 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-400 focus:outline-none text-gray-900 dark:text-white"
            />
            <textarea
              name="context"
              value={form.context}
              onChange={handleChange}
              placeholder="Related context (emails, notes, etc)"
              className="w-full p-3 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-400 focus:outline-none text-gray-900 dark:text-white"
            />
          </div>

          <div className="flex flex-wrap gap-4 pt-2 relative">
            <button
              onClick={fetchSuggestion}
              className="bg-yellow-500 hover:bg-yellow-600 transition text-white font-semibold py-2 px-5 rounded-full shadow-md focus:ring-2 focus:ring-yellow-300"
            >
              Get AI Suggestion
            </button>

            <div 
              className="relative inline-block"
              onMouseEnter={() => !hasSuggestions && setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
            >
              <button
                ref={saveButtonRef}
                onClick={handleSubmit}
                disabled={!hasSuggestions || loadingRescore}
                className={`relative bg-green-600 ${
                  hasSuggestions
                    ? 'hover:bg-green-700 cursor-pointer'
                    : 'hover:bg-gray-500 cursor-not-allowed'
                } transition text-white font-semibold py-2 px-5 rounded-full shadow-md focus:ring-2 focus:ring-green-300`}
              >
                Save Task
              </button>
              <div 
                className="absolute left-0 top-full mt-2 z-[9999] w-56"
                style={{
                  opacity: (!hasSuggestions && showTooltip) ? 1 : 0,
                  transition: 'opacity 200ms',
                  pointerEvents: 'none',
                  visibility: (!hasSuggestions && showTooltip) ? 'visible' : 'hidden'
                }}
              >
                <div 
                  className="bg-white text-gray-800 text-sm p-3 rounded-lg shadow-lg border border-gray-200 dark:bg-gray-700 dark:text-gray-100"
                  style={{
                    position: 'relative',
                    zIndex: 10000,
                  }}
                >
                  <div className="flex items-center">
                    <FaInfoCircle className="mr-2 flex-shrink-0 text-gray-500" />
                    <span>Please get AI insights before saving</span>
                  </div>
                  <div 
                    className="absolute w-3 h-3 bg-white transform rotate-45 -top-1.5 left-4 border-t border-l border-gray-200"
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {loadingSuggestion && (
            <div className="flex items-center gap-2 text-blue-700 mt-6 animate-pulse">
              <FaSpinner className="animate-spin h-5 w-5" />
              <span className="font-medium">Thinking...</span>
            </div>
          )}

          {suggestion && (
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-2xl p-5 shadow-inner space-y-2 text-gray-900">
              <h3 className="text-lg font-semibold text-blue-700">🤖 AI Suggestions</h3>
              <div><span className="font-semibold">Description:</span> {suggestion.enhanced_description}</div>
              <div><span className="font-semibold">Priority:</span> {suggestion.priority_score}</div>
              <div><span className="font-semibold">Deadline:</span> {suggestion.suggested_deadline}</div>
              <div><span className="font-semibold">Category:</span> {suggestion.suggested_category}</div>
              <div><span className="font-semibold">Tip/Advice:</span> {suggestion.tip_or_advice}</div>
            </div>
          )}

          {loadingRescore && (
            <div className="flex items-center gap-2 text-blue-700 mt-6 animate-pulse">
              <FaSpinner className="animate-spin h-5 w-5" />
              <span className="font-medium">Rescoring tasks to re-prioritize...</span>
            </div>
          )}
          {showSuccess && (
            <div className="animate-fade-in">
              <p className="text-green-700 font-semibold pt-4 bg-green-50 p-3 rounded-xl shadow text-center">
                ✅ Task successfully submitted!
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
