import React, { useState, useEffect, useRef } from 'react';
import { Socket } from 'socket.io-client';

interface Message {
    text: string;
    sender: 'me' | 'partner';
    timestamp: Date;
}

interface ChatRoomProps {
    socket: Socket;
    chatId: string;
    partnerGender: string;
    onEndChat: () => void;
}

const ChatRoom: React.FC<ChatRoomProps> = ({ socket, chatId, partnerGender, onEndChat }) => {
    const [message, setMessage] = useState<string>('');
    const [messages, setMessages] = useState<Message[]>([]);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom when new messages arrive
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Listen for incoming messages
    useEffect(() => {
        const receiveMessageHandler = (data: { message: string, sender: 'partner' }) => {
            const newMessage: Message = {
                text: data.message,
                sender: data.sender,
                timestamp: new Date()
            };

            setMessages(prevMessages => [...prevMessages, newMessage]);
        };

        socket.on('receive_message', receiveMessageHandler);

        // Add welcome message
        setMessages([
            {
                text: `You are now chatting with a ${partnerGender}. Say hello!`,
                sender: 'me',
                timestamp: new Date()
            }
        ]);

        return () => {
            socket.off('receive_message', receiveMessageHandler);
        };
    }, [socket, partnerGender]);

    // Send message handler
    const sendMessage = (e: React.FormEvent) => {
        e.preventDefault();

        if (message.trim() === '') return;

        // Create message object
        const newMessage: Message = {
            text: message,
            sender: 'me',
            timestamp: new Date()
        };

        // Add to local messages
        setMessages(prevMessages => [...prevMessages, newMessage]);

        // Send to server
        socket.emit('send_message', {
            chatId,
            message: message
        });

        // Clear input
        setMessage('');
    };

    return (
        <div className="chat-room">
            <div className="chat-header">
                <h2>Chatting with a {partnerGender}</h2>
                <button className="end-chat-button" onClick={onEndChat}>End Chat</button>
            </div>

            <div className="messages-container">
                {messages.map((msg, index) => (
                    <div
                        key={index}
                        className={`message ${msg.sender === 'me' ? 'message-sent' : 'message-received'}`}
                    >
                        <div className="message-content">
                            <p>{msg.text}</p>
                            <span className="message-time">
                                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            <form className="message-form" onSubmit={sendMessage}>
                <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type a message..."
                />
                <button type="submit">Send</button>
            </form>
        </div>
    );
};

export default ChatRoom; 