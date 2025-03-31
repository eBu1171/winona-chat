import { useState, useEffect } from 'react';
import io from 'socket.io-client';
import WaitingRoom from './WaitingRoom';
import ChatRoom from './ChatRoom';

// Connect to the server with additional configuration to handle CORS
const socket = io(import.meta.env.VITE_SERVER_URL || 'https://winona-chat-server.onrender.com', {
    withCredentials: true,
    transports: ['websocket', 'polling']
});

interface Stats {
    online: number;
    activeChats: number;
    malesWaiting: number;
    femalesWaiting: number;
}

const ChatApp = () => {
    // Application state
    const [connected, setConnected] = useState<boolean>(false);
    const [stats, setStats] = useState<Stats>({
        online: 0,
        activeChats: 0,
        malesWaiting: 0,
        femalesWaiting: 0
    });
    const [waiting, setWaiting] = useState<boolean>(false);
    const [chatting, setChatting] = useState<boolean>(false);
    const [chatId, setChatId] = useState<string>('');
    const [partnerGender, setPartnerGender] = useState<string>('');
    const [userGender, setUserGender] = useState<string>('');

    // Connect to socket
    useEffect(() => {
        // Handle connection
        socket.on('connect', () => {
            console.log('Connected to server');
            setConnected(true);
        });

        // Handle stats updates
        socket.on('stats', (newStats: Stats) => {
            setStats(newStats);
        });

        // Handle match found
        socket.on('match_found', (data: { chatId: string, partnerGender: string }) => {
            console.log('Match found!', data);
            setChatId(data.chatId);
            setPartnerGender(data.partnerGender);
            setWaiting(false);
            setChatting(true);
        });

        // Handle chat ending
        socket.on('chat_ended', () => {
            setChatting(false);
            setChatId('');
            setPartnerGender('');
        });

        // Cleanup on unmount
        return () => {
            socket.off('connect');
            socket.off('stats');
            socket.off('match_found');
            socket.off('chat_ended');
        };
    }, []);

    // Start looking for a match
    const findMatch = (gender: string) => {
        setUserGender(gender);
        setWaiting(true);
        socket.emit('find_match', { gender });
    };

    // Cancel search for a match
    const cancelSearch = () => {
        setWaiting(false);
        socket.emit('cancel_search');
    };

    // End current chat
    const endChat = () => {
        setChatting(false);
        setChatId('');
        setPartnerGender('');
        socket.emit('end_chat', { chatId });
    };

    // Render appropriate view based on state
    return (
        <div className="chat-app">
            <h1>Winona Chat</h1>

            {!connected && (
                <div className="connecting">
                    <p>Connecting to server...</p>
                </div>
            )}

            {connected && !waiting && !chatting && (
                <div className="gender-select">
                    <h2>Select your gender to start chatting</h2>
                    <div className="buttons">
                        <button onClick={() => findMatch('male')}>I am Male</button>
                        <button onClick={() => findMatch('female')}>I am Female</button>
                    </div>

                    <div className="stats">
                        <h3>Current Stats</h3>
                        <p>Online: {stats.online}</p>
                        <p>Active Chats: {stats.activeChats}</p>
                        <p>Males Waiting: {stats.malesWaiting}</p>
                        <p>Females Waiting: {stats.femalesWaiting}</p>
                    </div>
                </div>
            )}

            {waiting && (
                <WaitingRoom
                    stats={stats}
                    userGender={userGender}
                    onCancel={cancelSearch}
                />
            )}

            {chatting && (
                <ChatRoom
                    socket={socket}
                    chatId={chatId}
                    partnerGender={partnerGender}
                    onEndChat={endChat}
                />
            )}
        </div>
    );
};

export default ChatApp; 