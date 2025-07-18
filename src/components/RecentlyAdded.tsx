import React from 'react';
import { Clock, MapPin } from 'lucide-react';
import { useResources } from '../hooks/useResources';

function RecentlyAdded() {
  const { allResources } = useResources();
  
  // Get recently added community resources (last 5)
  const recentResources = allResources
    .filter((resource: any) => resource.is_user_submitted)
    .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  if (recentResources.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="h-5 w-5 text-blue-600" />
        <h2 className="text-lg font-semibold text-gray-900">Recently Added by Community</h2>
      </div>
      
      <div className="space-y-4">
        {recentResources.map((resource: any) => (
          <div key={resource.id} className="border-l-4 border-blue-500 pl-4 py-2">
            <h3 className="font-medium text-gray-900">{resource.name}</h3>
            <p className="text-sm text-gray-600">{resource.type}</p>
            <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
              <MapPin className="h-3 w-3" />
              <span>{resource.address.split(',')[0]}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default RecentlyAdded;