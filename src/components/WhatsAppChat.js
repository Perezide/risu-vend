// WhatsAppChat.jsx
import React from 'react';
import { MessageCircle } from 'lucide-react';
import './WhatsAppChat.css';

const WhatsAppChat = () => {
  const openWhatsApp = () => {
    window.open('https://wa.me/+2347045403259', '_blank');
  };

  return (
    <button className="whatsapp-button" onClick={openWhatsApp}>
      <MessageCircle size={24} />
    </button>
  );
};

export default WhatsAppChat;