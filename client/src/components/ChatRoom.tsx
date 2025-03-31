import React, { useState, useEffect, useRef } from 'react';
import { Socket } from 'socket.io-client';

interface Message {
    sender: string;
    text: string;
    timestamp: string;
}

interface TypingEvent {
    userId: string;
    isTyping: boolean;
}

interface ChatRoomProps {
    socket: Socket;
    partnerId: string;
    onEndChat: () => void;
    onFindNewChat: () => void;
}

// Typing bubble animation component
const TypingBubble = () => {
    return (
        <div className="flex justify-start animate-fade-in">
            <div className="bg-gray-200 p-3 rounded-lg rounded-bl-none max-w-[70%] shadow-sm flex items-center">
                <div className="flex space-x-1.5">
                    <div className="w-2.5 h-2.5 bg-gray-500 rounded-full animate-bounce"
                        style={{ animationDuration: '0.6s', animationDelay: '0.1s' }}></div>
                    <div className="w-2.5 h-2.5 bg-gray-500 rounded-full animate-bounce"
                        style={{ animationDuration: '0.6s', animationDelay: '0.2s' }}></div>
                    <div className="w-2.5 h-2.5 bg-gray-500 rounded-full animate-bounce"
                        style={{ animationDuration: '0.6s', animationDelay: '0.3s' }}></div>
                </div>
            </div>
        </div>
    );
};

const ChatRoom = ({ socket, partnerId, onEndChat, onFindNewChat }: ChatRoomProps) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputMessage, setInputMessage] = useState('');
    const [isPartnerTyping, setIsPartnerTyping] = useState(false);
    const [isEmittingTyping, setIsEmittingTyping] = useState(false);
    const [chatEndingState, setChatEndingState] = useState<{ isEnding: boolean, reason: string } | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const typingTimeoutRef = useRef<NodeJS.Timeout>();
    const lastTypingEmit = useRef<number>(0);

    // Scroll to bottom of messages
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        // Handle incoming messages
        const handleMessage = (message: Message) => {
            console.log('Received message:', message);
            setMessages(prevMessages => [...prevMessages, message]);
            scrollToBottom();
            // Clear typing indicator when message is received
            if (message.sender === partnerId) {
                setIsPartnerTyping(false);
            }
        };

        // Handle typing indicators
        const handleTyping = (data: TypingEvent) => {
            console.log('Typing event received:', data, 'My partner ID:', partnerId);
            // Only show typing indicator if it's from our chat partner
            if (data.userId === partnerId) {
                console.log('Setting partner typing to:', data.isTyping);
                setIsPartnerTyping(data.isTyping);
                if (data.isTyping) {
                    scrollToBottom();
                }
            } else {
                console.log('Ignoring typing event from non-partner:', data.userId);
            }
        };

        // Handle chat ended by partner
        const handleChatEnded = (data: { reason?: string }) => {
            if (data && data.reason === 'partner-ended') {
                setMessages(prevMessages => [
                    ...prevMessages,
                    {
                        sender: 'system',
                        text: 'Your partner has ended the chat.',
                        timestamp: new Date().toISOString()
                    }
                ]);
                scrollToBottom();

                // Show ending notification
                setChatEndingState({
                    isEnding: true,
                    reason: 'Your partner ended the chat. Returning to lobby'
                });

            } else if (data && data.reason === 'partner-disconnected') {
                setMessages(prevMessages => [
                    ...prevMessages,
                    {
                        sender: 'system',
                        text: 'Your partner has disconnected.',
                        timestamp: new Date().toISOString()
                    }
                ]);
                scrollToBottom();

                // Show ending notification
                setChatEndingState({
                    isEnding: true,
                    reason: 'Your partner disconnected. Returning to lobby'
                });
            }
        };

        // Setup socket event listeners
        console.log('Setting up socket listeners. My socket ID:', socket.id, 'Partner ID:', partnerId);
        socket.on('message', handleMessage);
        socket.on('typing', handleTyping);
        socket.on('chatEnded', handleChatEnded);

        // Add welcome message
        setMessages([
            {
                sender: 'system',
                text: 'You are now connected with a stranger. Say hello!',
                timestamp: new Date().toISOString()
            }
        ]);

        return () => {
            console.log('Cleaning up socket listeners');
            socket.off('message', handleMessage);
            socket.off('typing', handleTyping);
            socket.off('chatEnded', handleChatEnded);
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
        };
    }, [socket, partnerId]);

    // Auto scroll when messages change
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Also scroll when partner typing status changes
    useEffect(() => {
        if (isPartnerTyping) {
            scrollToBottom();
        }
    }, [isPartnerTyping]);

    const emitTypingStatus = (isTyping: boolean) => {
        const now = Date.now();
        // Only emit if it's been more than 500ms since the last emit
        if (now - lastTypingEmit.current > 500) {

            socket.emit('typing', isTyping);
            setIsEmittingTyping(isTyping);
            lastTypingEmit.current = now;
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (inputMessage.trim() === '') return;

        // Ensure socket.id exists before creating message
        if (!socket.id) return;

        // Send message to server - don't add to local state here
        socket.emit('sendMessage', inputMessage);

        // Clear input and typing status
        setInputMessage('');
        emitTypingStatus(false);
        setIsEmittingTyping(false);
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInputMessage(e.target.value);

        // Clear existing timeout
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        // Emit typing status
        emitTypingStatus(true);

        // Set timeout to clear typing status after 1.5 seconds of no input
        typingTimeoutRef.current = setTimeout(() => {
            emitTypingStatus(false);
            setIsEmittingTyping(false);
        }, 1500);
    };

    const formatTime = (timestamp: string) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="max-w-2xl w-full bg-white rounded-lg shadow-md flex flex-col h-[600px] mt-4">
            {/* Chat header */}
            <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-indigo-600 text-white rounded-t-lg">
                <div className="flex items-center">
                    <img
                        src="/assets/logo.png"
                        alt="Winona Chat Logo"
                        className="h-6 w-auto mr-2 rounded-md"
                    />
                    <h2 className="font-bold text-lg flex items-center gap-2">
                        <span className="inline-block w-3 h-3 bg-green-500 rounded-full"></span>
                        Chat with Stranger
                    </h2>
                    {/* Debug indicator - only visible during development */}
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={onEndChat}
                        className="px-3 py-1 bg-white text-indigo-700 rounded-md text-sm hover:bg-gray-100"
                        disabled={chatEndingState?.isEnding}
                    >
                        End Chat
                    </button>
                </div>
            </div>

            {/* Messages area */}
            <div className="flex-1 p-4 overflow-y-auto bg-gray-50 relative">
                {chatEndingState && (
                    <div className="absolute inset-0 bg-gray-900 bg-opacity-70 flex items-center justify-center z-10">
                        <div className="bg-white p-6 rounded-lg shadow-lg text-center">
                            <p className="text-lg mb-4">{chatEndingState.reason}</p>
                            <div className="flex justify-center">
                                <div className="inline-flex space-x-2">
                                    <div className="w-3 h-3 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                    <div className="w-3 h-3 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                    <div className="w-3 h-3 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="space-y-3">
                    {messages.map((message, index) => (
                        <div
                            key={index}
                            className={`flex ${message.sender === socket.id ? 'justify-end' : 'justify-start'} ${message.sender === 'system' ? 'justify-center' : ''}`}
                        >
                            <div
                                className={`max-w-[70%] p-3 rounded-lg ${message.sender === socket.id
                                    ? 'bg-indigo-600 text-white rounded-br-none'
                                    : message.sender === 'system'
                                        ? 'bg-gray-200 text-gray-600 text-sm text-center'
                                        : 'bg-gray-200 text-gray-800 rounded-bl-none'
                                    }`}
                            >
                                <p>{message.text}</p>
                                {message.sender !== 'system' && (
                                    <p className={`text-xs mt-1 ${message.sender === socket.id ? 'text-indigo-100' : 'text-gray-500'}`}>
                                        {formatTime(message.timestamp)}
                                    </p>
                                )}
                            </div>
                        </div>
                    ))}

                    {/* Messenger-style typing indicator */}
                    {isPartnerTyping && <TypingBubble />}

                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* Message input */}
            <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={inputMessage}
                        onChange={handleInputChange}
                        placeholder="Type a message..."
                        className="flex-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                        type="submit"
                        disabled={inputMessage.trim() === ''}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Send
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ChatRoom;        