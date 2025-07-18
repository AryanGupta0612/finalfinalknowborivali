import React from 'react';
import { Users } from 'lucide-react';
import { useVisitorTracking } from '../hooks/useVisitorTracking';

function VisitorCounter() {
  const { visitorCount, loading } = useVisitorTracking();

  return (
    <div className="fixed bottom-4 right-4 bg-white shadow-lg rounded-lg px-4 py-2 border border-gray-200">
      <div className="flex items-center space-x-2 text-sm text-gray-600">
        <Users className="h-4 w-4" />
        <span>
          Unique Visitors: {' '}
          <span className="font-semibold text-blue-600">
            {loading ? '...' : visitorCount.toLocaleString()}
          </span>
        </span>
      </div>
    </div>
  );
}

export default VisitorCounter;