import React, { useState, useRef, useEffect } from 'react';
import { Modal } from 'flowbite-react';

function Chat({ isOpen, onClose }) {
    const [messages, setMessages] = useState([]);
    const [userInput, setUserInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const chatAreaRef = useRef(null);

    const sendMessage = async () => {
        if (!userInput.trim() || isTyping) return;

        const userMessage = { sender: 'user', message: userInput };
        setMessages(prevMessages => [...prevMessages, userMessage]);
        setUserInput('');
        setIsTyping(true);

        try {
            const response = await fetch('/api/chatbot/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ message: userInput })
            });

            const data = await response.json();
            // The backend returns a friendly `response` fallback even on timeouts/errors
            // (still a non-2xx status), so prefer that over a generic client-side message.
            const botMessage = { sender: 'bot', message: data.response || "Sorry, there was an error processing your request." };
            setMessages(prevMessages => [...prevMessages, botMessage]);
        } catch (error) {
            console.error("Error sending message:", error);
            const errorMessage = { sender: 'bot', message: "Sorry, there was an error processing your request." };
            setMessages(prevMessages => [...prevMessages, errorMessage]);
        } finally {
            setIsTyping(false);
        }
    };

    const handleKeyDown = (event) => {
        if (event.key === 'Enter') {
            sendMessage();
        }
    };

    useEffect(() => {
        if (chatAreaRef.current) {
            chatAreaRef.current.scrollTop = chatAreaRef.current.scrollHeight;
        }
    }, [messages, isTyping]);

    return (
        <Modal show={isOpen} onClose={onClose}>
            <Modal.Header>Chat</Modal.Header>
            <Modal.Body>
                <div
                    id="chat-area"
                    ref={chatAreaRef}
                    className="bg-gray-100 rounded-lg p-2 mb-4 h-64 overflow-y-auto"
                >
                    {messages.map((message, index) => (
                        <div
                            key={index}
                            className={
                                message.sender === 'user'
                                    ? 'text-right mb-2'
                                    : 'text-left mb-2'
                            }
                        >
                            <div
                                className={
                                    message.sender === 'user'
                                        ? 'inline-block bg-blue-200 rounded-lg p-2 max-w-2/3'
                                        : 'inline-block bg-gray-200 rounded-lg p-2 max-w-2/3'
                                }
                            >
                                {message.message}
                            </div>
                        </div>
                    ))}
                    {isTyping && (
                        <div className="text-left mb-2">
                            <div className="inline-block bg-gray-200 rounded-lg p-2 text-gray-500 italic">
                                Typing...
                            </div>
                        </div>
                    )}
                </div>
                <div className="flex">
                    <input
                        type="text"
                        id="user-input"
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        disabled={isTyping}
                        className="flex-grow border rounded-l-lg p-2 disabled:bg-gray-100"
                        placeholder="Type your message..."
                    />
                    <button
                        id="send-button"
                        onClick={sendMessage}
                        disabled={isTyping}
                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-r-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Send
                    </button>
                </div>
            </Modal.Body>
            <Modal.Footer>
                <button className="bg-gray-300 rounded p-2" onClick={onClose}>Close</button>
            </Modal.Footer>
        </Modal>
    );
}

export default Chat;