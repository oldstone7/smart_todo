import { useState } from 'react';
const apiUrl = process.env.NEXT_PUBLIC_API_URL;
import { FaEdit, FaTrash, FaSave, FaTimes } from 'react-icons/fa';

type TaskProps = {
  id: number;
  title: string;
  description: string;
  priority_score: number;
  deadline: string;
  status: number;
  category?: { name: string };
};

export default function TaskCard(task: TaskProps) {
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editedTask, setEditedTask] = useState(task);

  const handleDelete = async () => {
    await fetch(`${apiUrl}/tasks/${task.id}/`, {
      method: 'DELETE',
    });
    setShowDeleteModal(false);
    window.location.reload();
  };

  const handleEdit = async () => {
    await fetch(`${apiUrl}/tasks/${task.id}/`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editedTask),
    });
    setShowModal(false);
    window.location.reload();
  };

  const getPriorityColor = (score: number) => {
    if (score >= 8) return 'text-red-600';
    if (score >= 5) return 'text-yellow-500';
    return 'text-green-600';
  };

  return (
    <div className="bg-white dark:bg-gray-300 rounded-xl shadow-md p-6 relative hover:shadow-lg transition-all">
             {/* Edit & Delete icons */}
       <div className="absolute top-3 right-3 flex space-x-3">
         <FaEdit
           className="cursor-pointer text-blue-600 hover:text-blue-800 hover:drop-shadow-lg transition-all duration-200"
           onClick={() => setShowModal(true)}
         />
         <FaTrash
           className="cursor-pointer text-red-600 hover:text-red-800 hover:drop-shadow-lg transition-all duration-200"
           onClick={() => setShowDeleteModal(true)}
         />
       </div>

      {/* Task Info */}
      <h2 className="text-xl font-bold text-gray-900 mb-1">{task.title}</h2>
      <p className="text-gray-700 mb-2">{task.description}</p>
      <p className={`font-medium ${getPriorityColor(task.priority_score)}`}>
        Priority: {task.priority_score}
      </p>
      <p className="text-sm text-gray-600">Deadline: {task.deadline || 'N/A'}</p>
      <p className="text-sm text-gray-600">Category: {task.category?.name || 'Uncategorized'}</p>
      <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
        <div
          className="bg-green-600 h-2 rounded-full"
          style={{ width: `${task.status}%` }}
        ></div>
      </div>

      {/* Edit Modal */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center"
          onClick={(e) => e.target === e.currentTarget && setShowModal(false)}
        >
          <div className="bg-white dark:bg-gray-300 rounded-2xl p-6 w-full max-w-lg shadow-xl space-y-4 relative">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <FaTimes size={18} />
            </button>
            <h2 className="text-2xl font-semibold text-gray-900">Edit Task</h2>
            <input
              value={editedTask.title}
              onChange={(e) => setEditedTask({ ...editedTask, title: e.target.value })}
              placeholder="Title"
              className="w-full p-3 border text-gray-900 border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <textarea
              value={editedTask.description}
              onChange={(e) => setEditedTask({ ...editedTask, description: e.target.value })}
              placeholder="Description"
              className="w-full p-3 border text-gray-900 border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <input
              type="number"
              value={editedTask.priority_score}
              onChange={(e) => setEditedTask({ ...editedTask, priority_score: Number(e.target.value) })}
              placeholder="Priority"
              className="w-full p-3 border text-gray-900 border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <label className="text-sm font-medium text-gray-700">Progress: {editedTask.status}%</label>
            <input
              type="range"
              min="0"
              max="100"
              step="10"
              value={editedTask.status}
              onChange={(e) =>
                setEditedTask({ ...editedTask, status: parseInt(e.target.value) })
              }
              className="w-full accent-blue-700 mt-1"
            />

            <input
              type="date"
              value={editedTask.deadline}
              onChange={(e) => setEditedTask({ ...editedTask, deadline: e.target.value })}
              className="w-full p-3 border text-gray-900 border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <button
              onClick={handleEdit}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-xl flex justify-center items-center gap-2 transition"
            >
              <FaSave /> Save
            </button>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center"
          onClick={(e) => e.target === e.currentTarget && setShowDeleteModal(false)}
        >
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl space-y-4 relative">
            <button
              onClick={() => setShowDeleteModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <FaTimes size={18} />
            </button>
            <h2 className="text-xl font-bold text-gray-900">Confirm Delete</h2>
            <p className="text-gray-700">
              Are you sure you want to delete the task:
              <span className="font-semibold"> "{task.title}"</span>?
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={handleDelete}
                className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-xl transition"
              >
                Yes, Delete
              </button>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-2 px-4 rounded-xl transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
