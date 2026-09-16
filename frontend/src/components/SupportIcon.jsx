import React, { useState } from 'react';
import { HiChatAlt2 } from 'react-icons/hi';
import Chat from './Chat'; // Import the Chat component


function SupportIcon() {
    const [isChatOpen, setIsChatOpen] = useState(false);

    const toggleChat = () => {
        setIsChatOpen(!isChatOpen);
    };

    return (
        <div>
            <button
                onClick={toggleChat}
                aria-label="Chat with us"
                title="Chat with us"
                className="fixed bottom-4 right-4 bg-secondary hover:bg-accent text-white p-4 rounded-full shadow-lg z-50 transition-transform duration-200 hover:scale-110 focus:outline-none focus:ring-4 focus:ring-accent/40"
            >
                <HiChatAlt2 className="w-6 h-6" />
            </button>
            <Chat isOpen={isChatOpen} onClose={toggleChat} />
        </div>
    );
}

export default SupportIcon;