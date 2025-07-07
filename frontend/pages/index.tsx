import { useEffect, useState, useMemo } from 'react';
import Navbar from '@/components/Navbar';
import TaskCard from '@/components/TaskCard';
import { FaTrash, FaTimes } from 'react-icons/fa';
const apiUrl = process.env.NEXT_PUBLIC_API_URL;

type PriorityFilter = 'all' | 'most-important' | 'important' | 'casual';

interface Task {
  id: number;
  title: string;
  description: string;
  priority_score: number;
  status: number;
  category?: { name: string };
  deadline: string;
}

export default function Dashboard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [statusFilter, setStatusFilter] = useState<number>(0);
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedTasks, setSelectedTasks] = useState<number[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectAll, setSelectAll] = useState(false);
  const [batchDeleteMode, setBatchDeleteMode] = useState(false);

  const fetchTasks = () => {
    fetch(`${apiUrl}/tasks/`)
      .then(res => res.json())
      .then(data => setTasks(data));
  };

  // Get unique categories
  const categories = useMemo(() => {
    const categorySet = new Set<string>();
    tasks.forEach(task => {
      if (task.category?.name) {
        categorySet.add(task.category.name);
      }
    });
    return Array.from(categorySet).sort();
  }, [tasks]);

  // Filter tasks based on selected filters
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      // Status filter
      if (statusFilter > 0 && task.status < statusFilter) {
        return false;
      }

      // Priority filter
      if (priorityFilter !== 'all') {
        if (priorityFilter === 'most-important' && task.priority_score < 8) return false;
        if (priorityFilter === 'important' && (task.priority_score < 5 || task.priority_score > 7)) return false;
        if (priorityFilter === 'casual' && task.priority_score > 4) return false;
      }

      // Category filter
      if (categoryFilter !== 'all' && task.category?.name !== categoryFilter) {
        return false;
      }

      return true;
    });
  }, [tasks, statusFilter, priorityFilter, categoryFilter]);

  useEffect(() => {
    fetchTasks();
  }, []);

  useEffect(() => {
    // Update selectAll state based on selected tasks
    if (filteredTasks.length > 0 && selectedTasks.length === filteredTasks.length) {
      setSelectAll(true);
    } else {
      setSelectAll(false);
    }
  }, [selectedTasks, filteredTasks]);

  const handleTaskSelect = (taskId: number) => {
    setSelectedTasks(prev => 
      prev.includes(taskId) 
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    );
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedTasks([]);
    } else {
      setSelectedTasks(filteredTasks.map(task => task.id));
    }
    setSelectAll(!selectAll);
  };

  const deleteSelectedTasks = async () => {
    try {
      // Delete tasks in parallel
      await Promise.all(
        selectedTasks.map(id => 
          fetch(`${apiUrl}/tasks/${id}/`, {
            method: 'DELETE',
          })
        )
      );
      
      // Refresh tasks and clear selection
      fetchTasks();
      setSelectedTasks([]);
      setBatchDeleteMode(false);
      setShowDeleteModal(false);
    } catch (error) {
      console.error('Error deleting tasks:', error);
    }
  };

  const toggleBatchDeleteMode = () => {
    setBatchDeleteMode(!batchDeleteMode);
    if (!batchDeleteMode) {
      setSelectedTasks([]);
    }
  };

  return (
    <>
      <Navbar />
      <div className="p-6 bg-gray-100 dark:bg-gray-900 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Your Tasks</h1>
            <div className="flex items-center gap-2">
              <button 
                onClick={toggleBatchDeleteMode}
                className={`px-4 py-2 rounded-lg shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  batchDeleteMode 
                    ? 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500' 
                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-blue-500'
                }`}
              >
                {batchDeleteMode ? 'Cancel' : 'Batch Delete'}
              </button>
              <button 
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                {isFilterOpen ? 'Hide Filters' : 'Show Filters'}
              </button>
            </div>
          </div>
          
          {/* Filters */}
          {isFilterOpen && (
            <div className="bg-white dark:bg-gray-700 p-4 rounded-lg shadow-md mb-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">Status (Min: {statusFilter}%)</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="10"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(Number(e.target.value))}
                  className="w-full accent-blue-600"
                />
                <div className="flex justify-between text-xs text-gray-500 dark:text-white mt-1">
                  <span>0%</span>
                  <span>100%</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">Priority</label>
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value as PriorityFilter)}
                  className="w-full p-2 border dark:bg-gray-700 text-gray-900 dark:text-gray-200 border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="all">All Priorities</option>
                  <option value="most-important">Most Important (8-10)</option>
                  <option value="important">Important (5-7)</option>
                  <option value="casual">Casual (1-4)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-white mb-1">Category</label>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full p-2 border dark:bg-gray-700 text-gray-900 dark:text-gray-200 border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="all">All Categories</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={() => {
                  setStatusFilter(0);
                  setPriorityFilter('all');
                  setCategoryFilter('all');
                }}
                className="text-sm text-blue-600 hover:text-blue-800 dark:text-gray-200 dark:hover:text-white"
              >
                Clear all filters
              </button>
            </div>
          )}

          {/* Batch Delete Controls */}
          {batchDeleteMode && (
            <div className="mb-4 space-y-3">
              <div className="flex items-center dark:text-white">
                <input
                  type="checkbox"
                  checked={selectAll}
                  onChange={handleSelectAll}
                  className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-white">
                  {selectAll ? 'Deselect All' : 'Select All'}
                </span>
                {selectedTasks.length > 0 && (
                  <span className="ml-2 text-sm text-gray-500 dark:text-white">
                    {selectedTasks.length} selected
                  </span>
                )}
              </div>
              {selectedTasks.length > 0 && (
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <FaTrash size={14} />
                  <span>Delete Selected ({selectedTasks.length})</span>
                </button>
              )}
            </div>
          )}

          {filteredTasks.length === 0 ? (
            <div className="text-center text-gray-500 bg-white dark:bg-gray-700 p-8 rounded-xl shadow-md dark:text-white">
              <p className="text-lg font-medium">
                {tasks.length === 0 
                  ? '📝 You have no tasks yet.' 
                  : '🔍 No tasks match your filters.'}
              </p>
              <p className="mt-1 text-sm">
                {tasks.length === 0 
                  ? 'Click "New Task" in the top nav to add one!' 
                  : 'Try adjusting your filters.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTasks.map((task) => (
                <div key={task.id} className="relative">
                  {batchDeleteMode && (
                    <div className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10">
                      <input
                        type="checkbox"
                        checked={selectedTasks.includes(task.id)}
                        onChange={() => handleTaskSelect(task.id)}
                        className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </div>
                  )}
                  <div className={batchDeleteMode ? 'pl-10' : ''}>
                    <TaskCard {...task} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center"
          onClick={(e) => e.target === e.currentTarget && setShowDeleteModal(false)}
        >
          <div className="bg-white dark:bg-gray-700 rounded-2xl p-6 w-full max-w-md shadow-xl space-y-4 relative">
            <button
              onClick={() => setShowDeleteModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:text-white"
            >
              <FaTimes size={18} />
            </button>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Confirm Delete</h2>
            <p className="text-gray-700 dark:text-white">
              Are you sure you want to delete {selectedTasks.length > 1 ? 'these tasks' : 'this task'}? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={deleteSelectedTasks}
                className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-xl transition dark:bg-red-700 dark:hover:bg-red-800"
              >
                Delete
              </button>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-2 px-4 rounded-xl transition dark:bg-gray-700 dark:hover:bg-gray-800"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
