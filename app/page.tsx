'use client';
import { useState, useEffect } from 'react';
import { Play, Square, Clock, Terminal, Globe } from 'lucide-react';
import NavBar from './_components/layout/navbar';
import Scanner from './_components/blocks/scanner';
import Account from './_components/blocks/accounts';
interface Box {
  id: number;
  name: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  os: string;
  category: string;
  description: string;
  status: 'stopped' | 'starting' | 'running' | 'stopping';
  timeRemaining: string | null;
  ip: string | null;
  container_name?: string;
}

export default function ProvingGroundsUI() {
  const [boxes, setBoxes] = useState<Box[]>([]);
  const [loading, setLoading] = useState(true);

  

  // Load boxes from localStorage and merge with JSON data
  useEffect(() => {
    fetch('/data/boxes.json')
      .then(res => res.json())
      .then((data: Box[]) => {
        // Get running boxes from localStorage
        const storedBoxes = JSON.parse(localStorage.getItem('runningBoxes') || '[]');
        
        // Merge stored state with JSON data
        const mergedBoxes = data.map(box => {
          const storedBox = storedBoxes.find((stored: any) => stored.id === box.id);
          return storedBox ? { ...box, ...storedBox } : box;
        });
        
        setBoxes(mergedBoxes);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load boxes:', err);
        setLoading(false);
      });
  }, []);

    // Save running boxes to localStorage whenever boxes change
    useEffect(() => {
  // Don't save if boxes haven't loaded yet
  if (boxes.length === 0) return;
  
  const activeBoxes = boxes
    .filter(box => box.status !== 'stopped')
    .map(box => ({
      id: box.id,
      status: box.status,
      container_name: box.container_name,
      ip: box.ip,
      timeRemaining: box.timeRemaining
    }));
  
  localStorage.setItem('runningBoxes', JSON.stringify(activeBoxes));
  window.dispatchEvent(new Event("storage"));
}, [boxes]);

  const startBox = async (id: number) => {
    try {
      // Update UI to starting state
      setBoxes(prev =>
        prev.map(box =>
          box.id === id
            ? { ...box, status: 'starting', timeRemaining: null, ip: null }
            : box
        )
      );

      const response = await fetch('http://localhost:5000/start-lab', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        // Update to running state
        setBoxes(prev =>
          prev.map(box =>
            box.id === id 
              ? {
                  ...box,
                  status: 'running',
                  timeRemaining: '4h 0m',
                  ip: data.ip_address || `10.10.11.${Math.floor(Math.random() * 200) + 100}`,
                  container_name: data.container_name
                }
              : box
          )
        );
      } else {
        // Revert to stopped on error
        setBoxes(prev =>
          prev.map(box =>
            box.id === id ? { ...box, status: 'stopped' } : box
          )
        );
        console.error('Failed to start lab:', data.error);
      }
    } catch (error) {
      // Revert to stopped on error
      setBoxes(prev =>
        prev.map(box =>
          box.id === id ? { ...box, status: 'stopped' } : box
        )
      );
      console.error('Error starting lab:', error);
    }
  };

  const stopBox = async (id: number) => {
    try {
      const box = boxes.find(b => b.id === id);
      if (!box || !box.container_name) return;

      // Update UI to stopping state
      setBoxes(prev =>
        prev.map(box =>
          box.id === id ? { ...box, status: 'stopping' } : box
        )
      );

      const response = await fetch(`http://localhost:5000/stop-lab/${box.container_name}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      console.log(data);

      if (data.success) {
        setBoxes(prev =>
          prev.map(box =>
            box.id === id ? { ...box, status: 'stopped', timeRemaining: null, ip: null } : box
          )
        );
      } else {
        // Revert to running on error
        setBoxes(prev =>
          prev.map(box =>
            box.id === id ? { ...box, status: 'running' } : box
          )
        );
        console.error('Failed to stop lab:', data.error);
      }
    } catch (error) {
      // Revert to running on error
      setBoxes(prev =>
        prev.map(box =>
          box.id === id ? { ...box, status: 'running' } : box
        )
      );
      console.error('Error stopping lab:', error);
    }
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
      case 'stopping':
        return 'text-red-600 bg-red-100';
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
                    {box.container_name && (
                      <div className="mt-2 text-xs text-gray-500">
                        Container: {box.container_name}
                      </div>
                    )}
                  </div>
                )}

                {/* Action Button */}
                <div className="flex items-center justify-between">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(box.status)}`}>
                    {box.status === 'starting'
                      ? 'Starting...'
                      : box.status === 'stopping'
                      ? 'Stopping...'
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

                  {box.status === 'stopping' && (
                    <button
                      disabled
                      className="bg-gray-300 text-gray-500 px-4 py-2 rounded-lg text-sm font-medium cursor-not-allowed flex items-center"
                    >
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-400 border-t-transparent mr-1"></div>
                      Stopping
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
       <Scanner/>
       {boxes.find(box => box.status === 'running')?.container_name && (
  <Account containerName={boxes.find(box => box.status === 'running')!.container_name!} />
)}
    </div>
  );
}