import React from 'react';

interface WaitingRoomProps {
    stats: {
        online: number;
        activeChats: number;
        malesWaiting: number;
        femalesWaiting: number;
    };
    userGender: string;
    onCancel: () => void;
}

const WaitingRoom: React.FC<WaitingRoomProps> = ({ stats, userGender, onCancel }) => {
    return (
        <div className="waiting-room">
            <div className="loading-icon">
                <div className="circle-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="40" />
                        <circle cx="50" cy="50" r="30" strokeWidth="4" fill="none" />
                        <circle cx="50" cy="35" r="5" />
                        <circle cx="50" cy="50" r="5" />
                        <circle cx="50" cy="65" r="5" />
                    </svg>
                </div>
            </div>

            <h2>Finding Your Chat Partner</h2>
            <p>We're searching for the perfect match for you...</p>

            <div className="stats-container">
                <h3>Current Chat Activity</h3>
                <div className="stats-grid">
                    <div className="stat-card">
                        <h4>Online Users</h4>
                        <p className="stat-value">{stats.online}</p>
                    </div>
                    <div className="stat-card">
                        <h4>Active Chats</h4>
                        <p className="stat-value">{stats.activeChats}</p>
                    </div>
                    <div className="stat-card">
                        <h4>Males Waiting</h4>
                        <p className="stat-value">{stats.malesWaiting}</p>
                    </div>
                    <div className="stat-card">
                        <h4>Females Waiting</h4>
                        <p className="stat-value">{stats.femalesWaiting}</p>
                    </div>
                </div>
            </div>

            <button className="cancel-button" onClick={onCancel}>
                Cancel Search
            </button>
        </div>
    );
};

export default WaitingRoom; 