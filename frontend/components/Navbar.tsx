import Link from 'next/link';
const apiUrl = process.env.NEXT_PUBLIC_API_URL;
import { useState, useRef, useEffect } from 'react';
import { FiMoon, FiSun, FiSettings, FiDownload, FiChevronDown, FiCheck } from 'react-icons/fi';

export default function Navbar() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isTourOn, setIsTourOn] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);
  const exportRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setIsSettingsOpen(false);
      }
      if (exportRef.current && !exportRef.current.contains(event.target as Node)) {
        setIsExportOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  useEffect(() => {
    // Check for saved preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
      setIsDarkMode(true);
    } else if (savedTheme === 'light') {
      document.documentElement.classList.remove('dark');
      setIsDarkMode(false);
    }
  }, []);

  const toggleTheme = () => {
    const html = document.documentElement;
    const isDark = !html.classList.contains('dark');
    
    if (isDark) {
      html.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      html.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
    
    setIsDarkMode(isDark);
  };

  const toggleTour = () => {
    setIsTourOn(!isTourOn);
    // Tour toggle logic will go here
  };

  const handleExport = async (format: 'csv' | 'json') => {
    try {
      const res = await fetch(`${apiUrl}/tasks/`);
      const tasks = await res.json();
  
      let content: string;
      let mime: string;
      let extension: string;
  
      if (format === 'json') {
        content = JSON.stringify(tasks, null, 2);
        mime = 'application/json';
        extension = 'json';
      } else {
        // Convert to CSV
        const headers = Object.keys(tasks[0]).join(',');
        const rows = tasks.map((t: any) =>
          Object.values(t).map(v => `"${(v ?? '').toString().replace(/"/g, '""')}"`).join(',')
        );
        content = [headers, ...rows].join('\n');
        mime = 'text/csv';
        extension = 'csv';
      }
  
      // Create and trigger file download
      const blob = new Blob([content], { type: mime });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tasks.${extension}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export error:', err);
    }
  };

  return (
    <nav className="bg-gray-900 dark:bg-gray-700 text-white px-6 py-4 shadow-md flex justify-between items-center relative">
      <h1 className="text-2xl font-bold tracking-wide">Smart Todo</h1>
      
      <div className="flex items-center space-x-6">
        <div className="space-x-6 text-lg font-medium hidden md:flex">
          <Link href="/" className="text-gray-300 hover:text-white transition-colors duration-200">Dashboard</Link>
          <Link href="/task" className="text-gray-300 hover:text-white transition-colors duration-200">New Task</Link>
          <Link href="/context" className="text-gray-300 hover:text-white transition-colors duration-200">Context</Link>
          <Link href="/import" className="text-gray-300 hover:text-white transition-colors duration-200">Import Tasks</Link>
        </div>

        {/* Settings Dropdown */}
        <div className="relative" ref={settingsRef}>
          <button
            onClick={() => {
              setIsSettingsOpen(!isSettingsOpen);
              if (isSettingsOpen) setIsExportOpen(false);
            }}
            className="p-2 rounded-lg hover:bg-gray-800 transition-colors"
            aria-label="Settings"
          >
            <FiSettings className="text-xl" />
          </button>

          {isSettingsOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-gray-800 text-white border border-gray-700 rounded-lg shadow-lg py-1 z-50">
              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="w-full px-4 py-2 text-left hover:bg-gray-700 flex items-center justify-between"
              >
                <div className="flex items-center">
                  {isDarkMode ? (
                    <>
                      <FiSun className="mr-2" />
                      <span>Light Mode</span>
                    </>
                  ) : (
                    <>
                      <FiMoon className="mr-2" />
                      <span>Dark Mode</span>
                    </>
                  )}
                </div>
              </button>

              {/* Tour Toggle */}
              <button
                onClick={toggleTour}
                className="w-full px-4 py-2 text-left hover:bg-gray-700 flex items-center justify-between"
              >
                <div className="flex items-center">
                  <span>Show Tour</span>
                </div>
                {isTourOn && <FiCheck className="text-green-500" />}
              </button>

              {/* Export Dropdown */}
              <div className="relative" ref={exportRef}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsExportOpen(!isExportOpen);
                  }}
                  className="w-full px-4 py-2 text-left hover:bg-gray-700 flex items-center justify-between"
                >
                  <div className="flex items-center">
                    <FiDownload className="mr-2" />
                    <span>Export Tasks</span>
                  </div>
                  <FiChevronDown className={`transition-transform ${isExportOpen ? 'transform rotate-180' : ''}`} />
                </button>

                {isExportOpen && (
                  <div className="absolute right-0 mt-1 w-32 bg-gray-800 rounded-lg shadow-lg py-1 border border-gray-700">
                    <button
                      onClick={() => handleExport('csv')}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-700"
                    >
                      CSV Format
                    </button>
                    <button
                      onClick={() => handleExport('json')}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-700"
                    >
                      JSON Format
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
