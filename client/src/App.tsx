import React, { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import GenderSelection from './components/GenderSelection';
import WaitingRoom from './components/WaitingRoom';
import ChatRoom from './components/ChatRoom';

// For debugging
console.log('App component is loading...');

const SOCKET_URL = import.meta.env.VITE_SERVER_URL || 'https://winona-chat-server.onrender.com';
console.log('Using socket server at:', SOCKET_URL);

type ChatState = 'gender-selection' | 'waiting' | 'chatting';

function App() {
    console.log('App component rendering');

    const [socket, setSocket] = useState<Socket | null>(null);
    const [chatState, setChatState] = useState<ChatState>('gender-selection');
    const [partnerId, setPartnerId] = useState<string | null>(null);
    const [stats, setStats] = useState<{
        online: number;
        waiting: { male: number; female: number };
        activeChats: number;
    } | null>(null);

    // Initialize socket connection
    useEffect(() => {
        try {
            console.log('Connecting to socket server...');
            const newSocket = io(SOCKET_URL);

            newSocket.on('connect', () => {
                console.log('Connected to server');
                setSocket(newSocket);
            });

            newSocket.on('connect_error', (err) => {
                console.error('Socket connection error:', err);
            });

            newSocket.on('waiting', () => {
                console.log('Received waiting event');
                setChatState('waiting');
            });

            newSocket.on('chatMatched', (data) => {
                console.log('Received chat matched event:', data);
                setPartnerId(data.partnerId);
                setChatState('chatting');
            });

            newSocket.on('chatEnded', (data) => {
                console.log('Received chat ended event:', data);

                // If I ended the chat, immediately go back to gender selection
                if (!data || !data.reason) {
                    setPartnerId(null);
                    setChatState('gender-selection');
                } else if (data.reason === 'partner-ended' || data.reason === 'partner-disconnected') {
                    // If partner ended chat or disconnected, wait a moment before redirecting
                    // to allow the user to see the notification
                    setTimeout(() => {
                        setPartnerId(null);
                        setChatState('gender-selection');
                    }, 1000); // 2 seconds delay
                }
            });

            // Fetch stats periodically
            const statsInterval = setInterval(() => {
                fetch(`${SOCKET_URL}/stats`)
                    .then(res => res.json())
                    .then(data => {
                        console.log('Received stats:', data);
                        setStats(data);
                    })
                    .catch(err => console.error('Failed to fetch stats:', err));
            }, 5000);

            return () => {
                newSocket.disconnect();
                clearInterval(statsInterval);
            };
        } catch (error) {
            console.error('Error in socket setup:', error);
        }
    }, []);

    const handleSelectGender = (gender: 'male' | 'female') => {
        console.log('Selected gender:', gender);
        if (socket) {
            socket.emit('setGender', gender);
        }
    };

    const handleEndChat = () => {
        console.log('Ending chat');
        if (socket) {
            socket.emit('endChat');
            setChatState('gender-selection');
            setPartnerId(null);
        }
    };

    const handleFindNewChat = () => {
        console.log('Finding new chat');
        if (socket) {
            socket.emit('findNewChat');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <header className="bg-indigo-600 text-white py-3 px-4 shadow-md sticky top-0 z-10 h-16">
                <div className="container mx-auto flex justify-between items-center">
                    <div className="flex items-center">
                        <img
                            src="/assets/logo.png"
                            alt="Winona Chat Logo"
                            className="h-8 w-auto mr-2 rounded-md"
                        />
                        <h1 className="text-xl md:text-2xl font-bold">Winona Chat</h1>
                    </div>
                    {stats && (
                        <div className="text-xs md:text-sm hidden sm:block">
                            <p>{stats.online} online • {stats.activeChats} active chats</p>
                        </div>
                    )}
                </div>
            </header>

            <main className="flex-1 container mx-auto p-4 pt-6 md:pt-8 mt-4 flex flex-col items-center justify-center">
                {chatState === 'gender-selection' && (
                    <GenderSelection onSelectGender={handleSelectGender} />
                )}

                {chatState === 'waiting' && (
                    <WaitingRoom
                        stats={stats}
                        onCancel={() => setChatState('gender-selection')}
                    />
                )}

                {chatState === 'chatting' && socket && partnerId && (
                    <ChatRoom
                        socket={socket}
                        partnerId={partnerId}
                        onEndChat={handleEndChat}
                        onFindNewChat={handleFindNewChat}
                    />
                )}
            </main>

            <footer className="bg-gray-100 p-4 text-center text-gray-600 text-sm">
                <p>Winona Chat - Talk to strangers anonymously</p>
            </footer>
        </div>
    );
}

export default App; 