import { useState } from 'react';
import Navbar from '@/components/Navbar';
const apiUrl = process.env.NEXT_PUBLIC_API_URL;

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const handleImport = async () => {
    if (!file) return;
    setUploading(true);
    setMessage('Uploading and processing tasks...');

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        let tasks: any[] = [];

        if (file.name.endsWith('.json')) {
          tasks = JSON.parse(text);
        } else if (file.name.endsWith('.csv')) {
          const [headerLine, ...lines] = text.trim().split('\n');
          const headers = headerLine.split(',');
          tasks = lines.map(line => {
            const values = line.split(',');
            const task: any = {};
            headers.forEach((h, idx) => task[h.trim()] = values[idx]?.trim());
            return task;
          });
        } else {
          throw new Error('Unsupported file type');
        }

        for (let task of tasks) {
          const needsEnrichment = !task.priority_score || !task.deadline;

          let enriched = task;
          if (needsEnrichment) {
            const now = new Date();
            const currentDate = now.toISOString().split("T")[0];
            const currentDay = now.toLocaleDateString("en-US", { weekday: "long" });

            const aiRes = await fetch(`${apiUrl}/ai/suggest/`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                title: task.title,
                description: task.description,
                context: task.context || '',
                current_date: currentDate,
                current_day: currentDay,
              }),
            });
            
            const suggestion = await aiRes.json();
            enriched = {
              title: task.title,
              description: suggestion.enhanced_description || task.description,
              priority_score: suggestion.priority_score || 3,
              deadline: suggestion.suggested_deadline || null,
              category: suggestion.suggested_category || "Uncategorized",
              status: 0,
            };
          } else {
            // Fix category to extract name only if it's an object
            if (typeof task.category === 'object' && task.category.name) {
              task.category = task.category.name;
            }
          }

          await fetch(`${apiUrl}/tasks/create/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(enriched),
          });
        }

        setMessage('✅ All tasks imported successfully!');
      } catch (err) {
        console.error('Import error:', err);
        setMessage('❌ Failed to import tasks.');
      }
      setUploading(false);
    };

    reader.readAsText(file);
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen p-8 bg-gray-100 dark:bg-gray-900 flex flex-col items-center justify-center">
        <div className="max-w-xl w-full p-6 bg-white dark:bg-gray-700 shadow rounded-xl text-center space-y-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">📥 Import Tasks</h2>
          <div className="w-full mb-6">
            <label className="w-full border-2 border-dashed border-gray-400 p-6 rounded-lg cursor-pointer hover:border-blue-500 bg-gray-50 dark:bg-gray-300 text-gray-700 dark:text-gray-900 block">
              <input type="file" accept=".json,.csv" onChange={handleFileChange} className="hidden" />
              {file ? file.name : 'Click or drag a JSON/CSV file here to upload'}
            </label>
          </div>

          <button
            onClick={handleImport}
            disabled={!file || uploading}
            className={`w-full bg-blue-600 text-white px-4 py-2 rounded-lg shadow-md font-medium mt-6 ${uploading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'}`}
          >
            {uploading ? 'Importing...' : 'Import Data'}
          </button>

          {message && <p className="text-sm text-gray-800 dark:text-gray-100 font-medium">{message}</p>}
        </div>
      </div>
    </>
  );
}
