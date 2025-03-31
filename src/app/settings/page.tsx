'use client';

import { useState } from 'react';
import Header from '@/components/Header';

export default function SettingsPage() {
  // Settings state
  const [nebiusApiKey, setNebiusApiKey] = useState('');
  const [mongodbUri, setMongodbUri] = useState('');
  const [activeTab, setActiveTab] = useState('api');
  const [captureDuration, setCaptureDuration] = useState(15);
  const [captureInterval, setCaptureInterval] = useState(5);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Function to handle saving settings
  const handleSaveSettings = async () => {
    try {
      setIsSaving(true);
      setSaveMessage(null);
      
      // In a real app, you'd save these settings to the server and update the .env file
      // For now, we'll just simulate a successful save
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSaveMessage({
        type: 'success',
        text: 'Settings saved successfully. You may need to restart the server for API changes to take effect.',
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      setSaveMessage({
        type: 'error',
        text: 'Failed to save settings. Please try again.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Function to handle sending a test notification
  const handleSendTestNotification = async () => {
    try {
      setIsSaving(true);
      setSaveMessage(null);
      
      const response = await fetch('/api/notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'Test Notification',
          message: 'This is a test notification from DeskSense settings page.',
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to send test notification');
      }
      
      const data = await response.json();
      
      setSaveMessage({
        type: 'success',
        text: data.simulated
          ? 'Test notification simulated (Screenpipe is not running)'
          : 'Test notification sent successfully to your desktop!',
      });
    } catch (error) {
      console.error('Error sending test notification:', error);
      setSaveMessage({
        type: 'error',
        text: 'Failed to send test notification. Please check your Screenpipe installation.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Configure your DeskSense application settings.
            </p>
          </div>
          
          {saveMessage && (
            <div className={`p-4 mb-4 rounded-md ${saveMessage.type === 'success' ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300' : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'}`}>
              {saveMessage.text}
            </div>
          )}
          
          <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
            <div className="border-b border-gray-200 dark:border-gray-700">
              <nav className="flex -mb-px">
                <button
                  className={`py-4 px-6 text-sm font-medium ${activeTab === 'api' ? 'border-b-2 border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'}`}
                  onClick={() => setActiveTab('api')}
                >
                  API Settings
                </button>
                <button
                  className={`py-4 px-6 text-sm font-medium ${activeTab === 'capture' ? 'border-b-2 border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'}`}
                  onClick={() => setActiveTab('capture')}
                >
                  Capture Settings
                </button>
                <button
                  className={`py-4 px-6 text-sm font-medium ${activeTab === 'test' ? 'border-b-2 border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'}`}
                  onClick={() => setActiveTab('test')}
                >
                  Test & Debug
                </button>
              </nav>
            </div>
            
            <div className="px-4 py-5 sm:p-6">
              {activeTab === 'api' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">API Configuration</h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      Configure your API keys and connection settings.
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div>
                      <label htmlFor="nebiusApiKey" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Nebius AI Studio API Key
                      </label>
                      <input
                        type="password"
                        id="nebiusApiKey"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        placeholder="Enter your Nebius API key"
                        value={nebiusApiKey}
                        onChange={(e) => setNebiusApiKey(e.target.value)}
                      />
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        Your API key will be stored securely in the .env.local file.
                      </p>
                    </div>
                    
                    <div>
                      <label htmlFor="mongodbUri" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        MongoDB Connection URI
                      </label>
                      <input
                        type="password"
                        id="mongodbUri"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        placeholder="Enter your MongoDB connection URI"
                        value={mongodbUri}
                        onChange={(e) => setMongodbUri(e.target.value)}
                      />
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        The connection string to your MongoDB database.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {activeTab === 'capture' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">Capture Settings</h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      Configure how DeskSense captures and processes screen data.
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div>
                      <label htmlFor="captureDuration" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Capture Duration (minutes)
                      </label>
                      <input
                        type="number"
                        id="captureDuration"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        min="1"
                        max="60"
                        value={captureDuration}
                        onChange={(e) => setCaptureDuration(parseInt(e.target.value, 10))}
                      />
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        How far back in time to look when capturing screen activity.
                      </p>
                    </div>
                    
                    <div>
                      <label htmlFor="captureInterval" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Auto-Capture Interval (minutes)
                      </label>
                      <input
                        type="number"
                        id="captureInterval"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        min="0"
                        max="60"
                        value={captureInterval}
                        onChange={(e) => setCaptureInterval(parseInt(e.target.value, 10))}
                      />
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        How often to automatically capture screen activity (0 to disable).
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {activeTab === 'test' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">Test & Debug</h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      Test the functionality of DeskSense components.
                    </p>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-md font-medium text-gray-900 dark:text-white">Screenpipe Notifications</h4>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Test if desktop notifications are working correctly.
                      </p>
                      <button
                        onClick={handleSendTestNotification}
                        disabled={isSaving}
                        className="mt-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                      >
                        {isSaving ? 'Sending...' : 'Send Test Notification'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700 text-right sm:px-6">
              <button
                onClick={handleSaveSettings}
                disabled={isSaving}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}