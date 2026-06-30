import React, { useState, useEffect } from 'react';
import { adminCoursesAPI } from '../services/api';
import { Trash2, Edit, Plus, X } from 'lucide-react';

export default function Courses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    duration_days: '',
    category: '',
    difficulty_level: 'beginner'
  });

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      setLoading(true);
      const response = await adminCoursesAPI.getCourses();
      if (response.success) {
        setCourses(response.data.courses || []);
      }
    } catch (error) {
      console.error('Error loading courses:', error);
      alert('Error loading courses');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editingCourse) {
        await adminCoursesAPI.updateCourse(editingCourse.id, formData);
      } else {
        await adminCoursesAPI.createCourse(formData);
      }

      setShowModal(false);
      resetForm();
      loadCourses();
    } catch (error) {
      console.error('Error saving course:', error);
      alert('Error saving course');
    }
  };

  const handleDelete = async (courseId) => {
    if (!confirm('Are you sure you want to delete this course?')) return;

    try {
      await adminCoursesAPI.deleteCourse(courseId);
      loadCourses();
    } catch (error) {
      console.error('Error deleting course:', error);
      alert('Error deleting course');
    }
  };

  const handleEdit = (course) => {
    setEditingCourse(course);
    setFormData({
      title: course.title,
      description: course.description,
      duration_days: course.duration_days,
      category: course.category,
      difficulty_level: course.difficulty_level
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      duration_days: '',
      category: '',
      difficulty_level: 'beginner'
    });
    setEditingCourse(null);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    resetForm();
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>Courses</h1>
        <button
          onClick={() => setShowModal(true)}
          className="btn btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <Plus size={20} />
          Add Course
        </button>
      </div>

      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Title</th>
                <th>Category</th>
                <th>Duration (Days)</th>
                <th>Difficulty</th>
                <th>Enrolled</th>
                <th>Created At</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {courses.map((course) => (
                <tr key={course.id}>
                  <td>{course.id}</td>
                  <td style={{ fontWeight: '500' }}>{course.title}</td>
                  <td>{course.category}</td>
                  <td>{course.duration_days}</td>
                  <td>
                    <span style={{
                      padding: '0.25rem 0.75rem',
                      borderRadius: '9999px',
                      fontSize: '0.875rem',
                      background: course.difficulty_level === 'beginner' ? '#dbeafe' :
                                 course.difficulty_level === 'intermediate' ? '#fef3c7' : '#fee2e2',
                      color: course.difficulty_level === 'beginner' ? '#1e40af' :
                             course.difficulty_level === 'intermediate' ? '#92400e' : '#991b1b'
                    }}>
                      {course.difficulty_level}
                    </span>
                  </td>
                  <td>{course.enrolled_count || 0}</td>
                  <td>{new Date(course.created_at).toLocaleDateString()}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={() => handleEdit(course)}
                        className="btn btn-secondary"
                        style={{ padding: '0.5rem 1rem' }}
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(course.id)}
                        className="btn btn-danger"
                        style={{ padding: '0.5rem 1rem' }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {courses.length === 0 && (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>
              No courses found. Click "Add Course" to create one.
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div className="card" style={{ maxWidth: '600px', width: '100%', margin: '1rem', maxHeight: '90vh', overflow: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                {editingCourse ? 'Edit Course' : 'Add New Course'}
              </h2>
              <button
                onClick={handleCloseModal}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem' }}
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  placeholder="Enter course title"
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                  placeholder="Enter course description"
                  rows="4"
                  style={{ width: '100%', padding: '0.75rem', border: '1px solid #e5e7eb', borderRadius: '0.5rem', resize: 'vertical' }}
                />
              </div>

              <div className="form-group">
                <label>Category</label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  required
                  placeholder="e.g., Meditation, Mindfulness, Sleep"
                />
              </div>

              <div className="form-group">
                <label>Duration (Days)</label>
                <input
                  type="number"
                  value={formData.duration_days}
                  onChange={(e) => setFormData({ ...formData, duration_days: e.target.value })}
                  required
                  min="1"
                  placeholder="Enter duration in days"
                />
              </div>

              <div className="form-group">
                <label>Difficulty Level</label>
                <select
                  value={formData.difficulty_level}
                  onChange={(e) => setFormData({ ...formData, difficulty_level: e.target.value })}
                  required
                  style={{ width: '100%', padding: '0.75rem', border: '1px solid #e5e7eb', borderRadius: '0.5rem' }}
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  {editingCourse ? 'Update Course' : 'Create Course'}
                </button>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
