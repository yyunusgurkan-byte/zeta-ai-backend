// frontend/src/components/Sidebar/ConversationList.jsx

import React from 'react';
import ConversationItem from './ConversationItem';
import useConversations from '../../hooks/useConversations';
import './ConversationList.css';

const ConversationList = () => {
  const {
    conversations,
    currentConversation,
    loading,
    error,
    createConversation,
    loadConversation,
    deleteConversation,
    renameConversation
  } = useConversations();

  const handleNewChat = async () => {
    const newConv = await createConversation();
    if (newConv) {
      // Otomatik olarak yeni konuşmaya geçildi
      console.log('Yeni sohbet oluşturuldu:', newConv.id);
    }
  };

  const handleConversationClick = async (conversationId) => {
    if (conversationId !== currentConversation?.id) {
      await loadConversation(conversationId);
    }
  };

  return (
    <div className="conversation-list-container">
      {/* Header - Yeni Sohbet Butonu */}
      <div className="conversation-list-header">
        <button 
          className="new-conversation-btn" 
          onClick={handleNewChat}
          disabled={loading}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd"/>
          </svg>
          Yeni Sohbet
        </button>
      </div>

      {/* Conversation List */}
      <div className="conversation-list-scroll">
        {loading && conversations.length === 0 ? (
          <div className="conversation-list-loading">
            <div className="loading-spinner"></div>
            <p>Yükleniyor...</p>
          </div>
        ) : error ? (
          <div className="conversation-list-error">
            <svg width="48" height="48" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
            </svg>
            <p>{error}</p>
          </div>
        ) : conversations.length === 0 ? (
          <div className="conversation-list-empty">
            <svg width="64" height="64" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd"/>
            </svg>
            <h3>Henüz sohbet yok</h3>
            <p>Yeni bir sohbet başlatmak için yukarıdaki butona tıklayın</p>
          </div>
        ) : (
          <div className="conversation-list-items">
            {conversations.map((conversation) => (
              <ConversationItem
                key={conversation.id}
                conversation={conversation}
                isActive={currentConversation?.id === conversation.id}
                onClick={() => handleConversationClick(conversation.id)}
                onDelete={deleteConversation}
                onRename={renameConversation}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ConversationList;
