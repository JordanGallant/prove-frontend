'use client';
import { useState, useEffect } from 'react';
import { Play, Square, Clock, Terminal, Globe } from 'lucide-react';
import NavBar from './_components/layout/navbar';

interface Box {
  id: number;
  name: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  os: string;
  category: string;
  description: string;
  status: 'stopped' | 'starting' | 'running';
  timeRemaining: string | null;
  ip: string | null;
}

export default function ProvingGroundsUI() {
  const [boxes, setBoxes] = useState<Box[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/data/boxes.json')
      .then(res => res.json())
      .then((data: Box[]) => {
        setBoxes(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load boxes:', err);
        setLoading(false);
      });
  }, []);

  const startBox = (id: number) => {
    setBoxes(prev =>
      prev.map(box =>
        box.id === id
          ? { ...box, status: 'starting', timeRemaining: null, ip: null }
          : box
      )
    );

    setTimeout(() => {
      setBoxes(prev =>
        prev.map(box =>
          box.id === id
            ? {
                ...box,
                status: 'running',
                timeRemaining: '4h 0m',
                ip: `10.10.11.${Math.floor(Math.random() * 200) + 100}`,
              }
            : box
        )
      );
    }, 3000);
  };

  const stopBox = (id: number) => {
    setBoxes(prev =>
      prev.map(box =>
        box.id === id ? { ...box, status: 'stopped', timeRemaining: null, ip: null } : box
      )
    );
  };

  const getDifficultyColor = (difficulty: Box['difficulty']) => {
    switch (difficulty) {
      case 'Easy':
        return 'text-green-600 bg-green-100';
      case 'Medium':
        return 'text-yellow-600 bg-yellow-100';
      case 'Hard':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusColor = (status: Box['status']) => {
    switch (status) {
      case 'running':
        return 'text-green-600 bg-green-100';
      case 'starting':
        return 'text-blue-600 bg-blue-100';
      case 'stopped':
        return 'text-gray-600 bg-gray-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) return <div className="p-8 text-center">Loading boxes...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Vulnerable Environments</h2>
          <p className="text-gray-600">Start and manage your practice environments</p>
          <div className="flex items-center space-x-4 mt-2">
            <span className="text-sm text-gray-500">
              Active Boxes: {boxes.filter(b => b.status === 'running').length}
            </span>
            <div className="h-6 w-px bg-gray-300"></div>
            <span className="text-sm text-gray-500">
              Available: {boxes.filter(b => b.status === 'stopped').length}
            </span>
          </div>
        </div>

        {/* Boxes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {boxes.map(box => (
            <div
              key={box.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
            >
              <div className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">{box.name}</h3>
                    <div className="flex items-center space-x-2">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(
                          box.difficulty
                        )}`}
                      >
                        {box.difficulty}
                      </span>
                      <span className="text-xs text-gray-500">{box.os}</span>
                    </div>
                  </div>
                  <Terminal className="h-5 w-5 text-gray-400" />
                </div>

                {/* Category */}
                <div className="mb-3">
                  <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full font-medium">
                    {box.category}
                  </span>
                </div>

                {/* Description */}
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">{box.description}</p>

                {/* Status Info */}
                {box.status === 'running' && (
                  <div className="bg-gray-50 rounded-lg p-3 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center">
                        <Globe className="h-4 w-4 text-green-600 mr-2" />
                        <span className="text-gray-700">IP: {box.ip}</span>
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 text-gray-500 mr-1" />
                        <span className="text-gray-600">{box.timeRemaining}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Button */}
                <div className="flex items-center justify-between">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(box.status)}`}>
                    {box.status === 'starting'
                      ? 'Starting...'
                      : box.status.charAt(0).toUpperCase() + box.status.slice(1)}
                  </span>

                  {box.status === 'stopped' && (
                    <button
                      onClick={() => startBox(box.id)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center"
                    >
                      <Play className="h-4 w-4 mr-1" />
                      Start
                    </button>
                  )}

                  {box.status === 'starting' && (
                    <button
                      disabled
                      className="bg-gray-300 text-gray-500 px-4 py-2 rounded-lg text-sm font-medium cursor-not-allowed flex items-center"
                    >
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-400 border-t-transparent mr-1"></div>
                      Starting
                    </button>
                  )}

                  {box.status === 'running' && (
                    <button
                      onClick={() => stopBox(box.id)}
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center"
                    >
                      <Square className="h-4 w-4 mr-1" />
                      Stop
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
