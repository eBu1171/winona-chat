import React from 'react';

interface WaitingRoomProps {
    stats: {
        online: number;
        waiting: { male: number; female: number };
        activeChats: number;
    } | null;
    onCancel: () => void;
}

const WaitingRoom = ({ stats, onCancel }: WaitingRoomProps) => {
    return (
        <div className="max-w-md w-full p-6 bg-white rounded-lg shadow-md text-center">
            <div className="mb-6">
                <div className="w-20 h-20 mx-auto bg-indigo-100 rounded-full flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-indigo-600 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
            </div>

            <h2 className="text-2xl font-bold text-gray-800 mb-2">Looking for a chat partner</h2>
            <p className="text-gray-600 mb-6">
                We're connecting you with someone. This might take a few moments...
            </p>

            {/* Animated dots */}
            <div className="flex justify-center space-x-2 mb-6">
                <div className="w-3 h-3 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-3 h-3 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                <div className="w-3 h-3 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '600ms' }}></div>
            </div>

            {stats && (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-medium text-gray-700 mb-2">Current Stats</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="bg-white p-2 rounded border border-gray-100">
                            <p className="text-gray-500">Online</p>
                            <p className="font-bold text-gray-800">{stats.online}</p>
                        </div>
                        <div className="bg-white p-2 rounded border border-gray-100">
                            <p className="text-gray-500">Active Chats</p>
                            <p className="font-bold text-gray-800">{stats.activeChats}</p>
                        </div>
                        <div className="bg-white p-2 rounded border border-gray-100">
                            <p className="text-gray-500">Males Waiting</p>
                            <p className="font-bold text-gray-800">{stats.waiting.male}</p>
                        </div>
                        <div className="bg-white p-2 rounded border border-gray-100">
                            <p className="text-gray-500">Females Waiting</p>
                            <p className="font-bold text-gray-800">{stats.waiting.female}</p>
                        </div>
                    </div>
                </div>
            )}

            <button
                onClick={onCancel}
                className="w-full py-3 px-4 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300"
            >
                Cancel
            </button>
        </div>
    );
};

export default WaitingRoom; 