# Winona Chat

A real-time chat application that randomly matches users of opposite genders without requiring login.

## Features

- Gender selection at the start
- Random matching with the opposite gender
- Real-time chat with typing indicators
- Option to end chat and find new partners
- Shows online user stats and active chat count

## Project Structure

- `/client` - React frontend with TypeScript and Tailwind CSS
- `/server` - Node.js backend with Express and Socket.io

## Installation

### Server

```bash
cd server
npm install
```

### Client

```bash
cd client
npm install
```

## Running the Application

### Server

```bash
cd server
npm run dev
```

The server will start on port 3001.

### Client

```bash
cd client
npm run dev
```

The client will start on port 5173.

## How it Works

1. Users select their gender (male or female)
2. The server places them in a waiting queue
3. When a user of the opposite gender is available, they are matched and placed in a private chat room
4. Users can chat in real-time
5. Either user can end the chat or find a new partner at any time

## Technologies Used

- **Frontend**: React, TypeScript, Tailwind CSS, Socket.io Client
- **Backend**: Node.js, Express, Socket.io

## License

MIT # winona-chat
