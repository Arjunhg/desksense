# DeskSense

DeskSense is an ambient intelligence platform that combines Screenpipe's screen capture capabilities with Nebius AI's processing power to provide proactive insights, smart automation, and adaptive learning for your desktop workflow.

## Features

- **Ambient Intelligence**: Continuously monitors your screen, audio, and interactions.
- **Proactive Insights**: Analyzes your work habits and generates helpful suggestions.
- **Smart Automation**: Detects patterns in your workflow to automate routine tasks.
- **Adaptive Learning**: Learns your preferences over time for better suggestions.

## Tech Stack

- **Frontend**: Next.js, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Node.js
- **AI**: Nebius AI Studio (GPT wrapper API)
- **Screen Capture**: Screenpipe
- **Database**: MongoDB

## Prerequisites

Before you start, make sure you have the following installed:

- Node.js (v18 or higher)
- npm or yarn
- MongoDB Atlas account or local MongoDB instance
- Screenpipe CLI (for desktop integration)
- Nebius AI Studio API key

## Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/desksense.git
cd desksense
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

Create a `.env.local` file in the root directory with the following variables:

```
# Nebius AI Studio API
NEBIUS_API_KEY=your-nebius-api-key
NEBIUS_API_ENDPOINT=https://api.studio.nebius.ai

# MongoDB Configuration
MONGODB_URI=your-mongodb-connection-string

# API Configuration
API_SECRET_KEY=your-secret-key-for-api-authentication
```

4. Install Screenpipe CLI:

```bash
curl -fsSL get.screenpi.pe/cli | sh
```

5. Run the development server:

```bash
npm run dev
```

6. Open your browser and navigate to [http://localhost:3000](http://localhost:3000)

## Usage

1. **Dashboard**: View the latest insights generated from your screen activity.
2. **Insights**: Browse all AI-generated insights, filter by type and status.
3. **Activity**: View and save your recent screen activity.
4. **Settings**: Configure API keys, capture settings, and test notifications.

## Project Structure

```
├── public/              # Static assets
├── src/
│   ├── app/             # Next.js app router pages
│   ├── components/      # Reusable React components
│   ├── lib/             # Utility functions and API wrappers
│   └── models/          # MongoDB models
├── .env.local           # Environment variables (create this)
├── next.config.js       # Next.js configuration
├── package.json         # Project dependencies
├── tailwind.config.js   # Tailwind CSS configuration
└── tsconfig.json        # TypeScript configuration
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [Nebius AI Studio](https://studio.nebius.com/models) for providing the AI capabilities
- [Screenpipe](https://docs.screenpi.pe/getting-started) for the screen capture functionality
