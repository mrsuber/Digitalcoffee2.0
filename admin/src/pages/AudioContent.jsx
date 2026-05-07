import React, { useState, useEffect } from 'react';
import { adminAudioAPI } from '../services/api';
import { Trash2, Edit, Plus, X, Music } from 'lucide-react';

export default function AudioContent() {
  const [audioContent, setAudioContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAudio, setEditingAudio] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'meditation',
    audio_url: '',
    duration_seconds: '',
    brainwave_type: ''
  });

  useEffect(() => {
    loadAudioContent();
  }, []);

  const loadAudioContent = async () => {
    try {
      setLoading(true);
      const response = await adminAudioAPI.getAudioContent();
      if (response.success) {
        setAudioContent(response.data);
      }
    } catch (error) {
      console.error('Error loading audio content:', error);
      alert('Error loading audio content');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editingAudio) {
        await adminAudioAPI.updateAudioContent(editingAudio.id, formData);
      } else {
        await adminAudioAPI.createAudioContent(formData);
      }

      setShowModal(false);
      resetForm();
      loadAudioContent();
    } catch (error) {
      console.error('Error saving audio content:', error);
      alert('Error saving audio content');
    }
  };

  const handleDelete = async (audioId) => {
    if (!confirm('Are you sure you want to delete this audio content?')) return;

    try {
      await adminAudioAPI.deleteAudioContent(audioId);
      loadAudioContent();
    } catch (error) {
      console.error('Error deleting audio content:', error);
      alert('Error deleting audio content');
    }
  };

  const handleEdit = (audio) => {
    setEditingAudio(audio);
    setFormData({
      title: audio.title,
      description: audio.description,
      type: audio.type,
      audio_url: audio.audio_url,
      duration_seconds: audio.duration_seconds,
      brainwave_type: audio.brainwave_type || ''
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      type: 'meditation',
      audio_url: '',
      duration_seconds: '',
      brainwave_type: ''
    });
    setEditingAudio(null);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    resetForm();
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTypeColor = (type) => {
    const colors = {
      meditation: { bg: '#dbeafe', text: '#1e40af' },
      affirmation: { bg: '#dcfce7', text: '#166534' },
      music: { bg: '#fce7f3', text: '#9f1239' },
      course: { bg: '#fef3c7', text: '#92400e' }
    };
    return colors[type] || { bg: '#f3f4f6', text: '#374151' };
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>Audio Content</h1>
        <button
          onClick={() => setShowModal(true)}
          className="btn btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <Plus size={20} />
          Add Audio
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
                <th>Type</th>
                <th>Duration</th>
                <th>Brainwave Type</th>
                <th>Plays</th>
                <th>Created At</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {audioContent.map((audio) => {
                const typeColor = getTypeColor(audio.type);
                return (
                  <tr key={audio.id}>
                    <td>{audio.id}</td>
                    <td style={{ fontWeight: '500' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Music size={16} style={{ color: '#6b7280' }} />
                        {audio.title}
                      </div>
                    </td>
                    <td>
                      <span style={{
                        padding: '0.25rem 0.75rem',
                        borderRadius: '9999px',
                        fontSize: '0.875rem',
                        background: typeColor.bg,
                        color: typeColor.text
                      }}>
                        {audio.type}
                      </span>
                    </td>
                    <td>{formatDuration(audio.duration_seconds)}</td>
                    <td>{audio.brainwave_type || 'N/A'}</td>
                    <td>{audio.play_count || 0}</td>
                    <td>{new Date(audio.created_at).toLocaleDateString()}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          onClick={() => handleEdit(audio)}
                          className="btn btn-secondary"
                          style={{ padding: '0.5rem 1rem' }}
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(audio.id)}
                          className="btn btn-danger"
                          style={{ padding: '0.5rem 1rem' }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {audioContent.length === 0 && (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>
              No audio content found. Click "Add Audio" to create one.
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
                {editingAudio ? 'Edit Audio Content' : 'Add New Audio Content'}
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
                  placeholder="Enter audio title"
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                  placeholder="Enter audio description"
                  rows="4"
                  style={{ width: '100%', padding: '0.75rem', border: '1px solid #e5e7eb', borderRadius: '0.5rem', resize: 'vertical' }}
                />
              </div>

              <div className="form-group">
                <label>Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  required
                  style={{ width: '100%', padding: '0.75rem', border: '1px solid #e5e7eb', borderRadius: '0.5rem' }}
                >
                  <option value="meditation">Meditation</option>
                  <option value="affirmation">Affirmation</option>
                  <option value="music">Music</option>
                  <option value="course">Course</option>
                </select>
              </div>

              <div className="form-group">
                <label>Audio URL</label>
                <input
                  type="url"
                  value={formData.audio_url}
                  onChange={(e) => setFormData({ ...formData, audio_url: e.target.value })}
                  required
                  placeholder="https://example.com/audio.mp3"
                />
              </div>

              <div className="form-group">
                <label>Duration (Seconds)</label>
                <input
                  type="number"
                  value={formData.duration_seconds}
                  onChange={(e) => setFormData({ ...formData, duration_seconds: e.target.value })}
                  required
                  min="1"
                  placeholder="Enter duration in seconds"
                />
              </div>

              <div className="form-group">
                <label>Brainwave Type (Optional)</label>
                <input
                  type="text"
                  value={formData.brainwave_type}
                  onChange={(e) => setFormData({ ...formData, brainwave_type: e.target.value })}
                  placeholder="e.g., Alpha, Beta, Theta, Delta"
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  {editingAudio ? 'Update Audio' : 'Create Audio'}
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
