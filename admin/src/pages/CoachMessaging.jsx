import React, { useState, useEffect, useRef } from 'react';
import { coachAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Send, User, Search, MessageSquare, Clock } from 'lucide-react';

export default function CoachMessaging() {
  const { admin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadStudents();
  }, []);

  useEffect(() => {
    if (selectedStudent) {
      loadMessages(selectedStudent.user_id);
      // Poll for new messages every 5 seconds
      const interval = setInterval(() => {
        loadMessages(selectedStudent.user_id);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [selectedStudent]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadStudents = async () => {
    try {
      setLoading(true);
      const response = await coachAPI.getStudents();
      setStudents(response.students || []);
    } catch (error) {
      console.error('Error loading students:', error);
      alert('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (studentId) => {
    try {
      const response = await coachAPI.getMessages(studentId);
      setMessages(response.messages || []);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedStudent) return;

    try {
      setSending(true);
      await coachAPI.sendMessage(selectedStudent.user_id, newMessage.trim());
      setNewMessage('');
      await loadMessages(selectedStudent.user_id);
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(search.toLowerCase()) ||
    student.email.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '400px'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '48px',
            height: '48px',
            border: '4px solid #e5e7eb',
            borderTop: '4px solid #3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto'
          }}></div>
          <p style={{ marginTop: '1rem', color: '#666' }}>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      maxWidth: '1400px',
      margin: '0 auto',
      padding: '2rem'
    }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
          Messages
        </h1>
        <p style={{ color: '#666' }}>Communicate with your students</p>
      </div>

      {/* Messaging Interface */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '350px 1fr',
        gap: '1.5rem',
        height: 'calc(100vh - 250px)',
        minHeight: '600px'
      }}>
        {/* Students List */}
        <div style={{
          background: 'white',
          borderRadius: '0.75rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          {/* Search */}
          <div style={{ padding: '1rem', borderBottom: '1px solid #e5e7eb' }}>
            <div style={{ position: 'relative' }}>
              <Search size={20} style={{
                position: 'absolute',
                left: '0.75rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#9ca3af'
              }} />
              <input
                type="text"
                placeholder="Search students..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  width: '100%',
                  paddingLeft: '2.5rem',
                  paddingRight: '1rem',
                  paddingTop: '0.5rem',
                  paddingBottom: '0.5rem',
                  border: '1px solid #e5e7eb',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem'
                }}
              />
            </div>
          </div>

          {/* Students List */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {filteredStudents.length === 0 ? (
              <div style={{
                padding: '2rem',
                textAlign: 'center',
                color: '#666'
              }}>
                <MessageSquare size={48} style={{ margin: '0 auto', opacity: 0.3 }} />
                <p style={{ marginTop: '1rem' }}>No students yet</p>
              </div>
            ) : (
              filteredStudents.map(student => (
                <div
                  key={student.user_id}
                  onClick={() => setSelectedStudent(student)}
                  style={{
                    padding: '1rem',
                    borderBottom: '1px solid #e5e7eb',
                    cursor: 'pointer',
                    background: selectedStudent?.user_id === student.user_id ? '#f3f4f6' : 'white',
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
                  onMouseLeave={(e) => e.currentTarget.style.background =
                    selectedStudent?.user_id === student.user_id ? '#f3f4f6' : 'white'}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontWeight: '600',
                      flexShrink: 0
                    }}>
                      {student.name.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{
                        fontWeight: '600',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {student.name}
                      </p>
                      <p style={{
                        fontSize: '0.875rem',
                        color: '#666',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {student.email}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Messages Area */}
        <div style={{
          background: 'white',
          borderRadius: '0.75rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          {selectedStudent ? (
            <>
              {/* Chat Header */}
              <div style={{
                padding: '1rem 1.5rem',
                borderBottom: '1px solid #e5e7eb',
                background: '#f9fafb'
              }}>
                <h3 style={{ fontWeight: '600', fontSize: '1.125rem' }}>
                  {selectedStudent.name}
                </h3>
                <p style={{ fontSize: '0.875rem', color: '#666' }}>
                  {selectedStudent.email}
                </p>
              </div>

              {/* Messages */}
              <div style={{
                flex: 1,
                overflowY: 'auto',
                padding: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem'
              }}>
                {messages.length === 0 ? (
                  <div style={{
                    textAlign: 'center',
                    color: '#666',
                    padding: '3rem'
                  }}>
                    <MessageSquare size={48} style={{ margin: '0 auto', opacity: 0.3 }} />
                    <p style={{ marginTop: '1rem' }}>No messages yet</p>
                    <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
                      Start a conversation with {selectedStudent.name}
                    </p>
                  </div>
                ) : (
                  messages.map((message, index) => {
                    // Check if the message is from the coach (me) by comparing sender_id with admin.id
                    const isMe = message.sender_id === admin?.id;
                    return (
                      <div
                        key={index}
                        style={{
                          display: 'flex',
                          justifyContent: isMe ? 'flex-end' : 'flex-start',
                          marginBottom: '1rem'
                        }}
                      >
                        <div style={{
                          maxWidth: '70%',
                          padding: '0.75rem 1rem',
                          borderRadius: isMe ? '1rem 1rem 0.25rem 1rem' : '1rem 1rem 1rem 0.25rem',
                          background: isMe ? '#3b82f6' : '#f3f4f6',
                          color: isMe ? 'white' : '#1f2937',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                        }}>
                          {!isMe && (
                            <p style={{
                              fontSize: '0.75rem',
                              fontWeight: '600',
                              marginBottom: '0.5rem',
                              opacity: 0.7
                            }}>
                              {message.sender_name}
                            </p>
                          )}
                          <p style={{ marginBottom: '0.25rem', lineHeight: '1.5' }}>{message.message}</p>
                          <p style={{
                            fontSize: '0.75rem',
                            opacity: 0.7,
                            textAlign: 'right',
                            marginTop: '0.25rem'
                          }}>
                            {formatTime(message.created_at)}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <form onSubmit={handleSendMessage} style={{
                padding: '1rem 1.5rem',
                borderTop: '1px solid #e5e7eb',
                display: 'flex',
                gap: '0.75rem'
              }}>
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  disabled={sending}
                  style={{
                    flex: 1,
                    padding: '0.75rem 1rem',
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem'
                  }}
                />
                <button
                  type="submit"
                  disabled={sending || !newMessage.trim()}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: sending || !newMessage.trim() ? '#d1d5db' : '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.5rem',
                    cursor: sending || !newMessage.trim() ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontWeight: '600',
                    transition: 'background 0.2s'
                  }}
                >
                  <Send size={18} />
                  Send
                </button>
              </form>
            </>
          ) : (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              color: '#666',
              textAlign: 'center'
            }}>
              <div>
                <MessageSquare size={64} style={{ margin: '0 auto', opacity: 0.2 }} />
                <p style={{ marginTop: '1rem', fontSize: '1.125rem' }}>
                  Select a student to start messaging
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
