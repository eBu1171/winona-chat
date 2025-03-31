import React, { useState } from 'react';

interface GenderSelectionProps {
    onSelectGender: (gender: 'male' | 'female') => void;
}

const GenderSelection = ({ onSelectGender }: GenderSelectionProps) => {
    const [selectedGender, setSelectedGender] = useState<'male' | 'female' | null>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedGender) {
            onSelectGender(selectedGender);
        }
    };

    return (
        <div className="max-w-md w-full p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">Welcome to Winona Chat</h2>
            <p className="text-gray-600 mb-6 text-center">
                Connect instantly with strangers around the world.
                Select your gender to start chatting with the opposite gender.
            </p>

            <form onSubmit={handleSubmit}>
                <div className="flex flex-col gap-4 mb-6">
                    <button
                        type="button"
                        className={`p-4 rounded-lg border-2 flex items-center gap-3 transition-colors ${selectedGender === 'male'
                            ? 'bg-blue-100 border-blue-500'
                            : 'border-gray-200 hover:bg-gray-50'
                            }`}
                        onClick={() => setSelectedGender('male')}
                    >
                        <div className="bg-blue-100 p-2 rounded-full">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                        </div>
                        <span className="font-medium">I am Male</span>
                    </button>

                    <button
                        type="button"
                        className={`p-4 rounded-lg border-2 flex items-center gap-3 transition-colors ${selectedGender === 'female'
                            ? 'bg-pink-100 border-pink-500'
                            : 'border-gray-200 hover:bg-gray-50'
                            }`}
                        onClick={() => setSelectedGender('female')}
                    >
                        <div className="bg-pink-100 p-2 rounded-full">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-pink-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                        </div>
                        <span className="font-medium">I am Female</span>
                    </button>
                </div>

                <button
                    type="submit"
                    disabled={!selectedGender}
                    className={`w-full py-3 px-4 text-white font-medium rounded-lg ${selectedGender ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-gray-300 cursor-not-allowed'
                        }`}
                >
                    Start Chatting
                </button>
            </form>

            <p className="mt-6 text-sm text-gray-500 text-center">
                By continuing, you agree to our Terms of Service and Privacy Policy.
            </p>
        </div>
    );
};

export default GenderSelection; 