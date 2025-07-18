import React, { useEffect } from 'react';
import { useResources } from '../hooks/useResources';
import { useAuth } from '../hooks/useAuth';
import AdminResourceCard from '../components/AdminResourceCard';
import ResourceCard from '../components/ResourceCard';
import RecentlyAdded from '../components/RecentlyAdded';
import { Loader2, TrendingUp } from 'lucide-react';

function Resources() {
  const { liveResources, allResources, loading, error, fetchAllResources } = useResources();
  const { isAdmin } = useAuth();

  // Get the appropriate resources based on user type
  const displayResources = isAdmin ? allResources : liveResources;

  // Featured resources: first 6 live resources
  const featuredResources = liveResources.slice(0, 6);

  useEffect(() => {
    if (isAdmin) {
      fetchAllResources();
    }
  }, [isAdmin]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          <span className="text-gray-600">Loading resources...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Resources</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="mb-8">
          <h1 className="text-4xl font-bold text-blue-900 mb-2">
            {isAdmin ? 'Manage Resources' : 'All Resources'}
          </h1>
          <p className="text-gray-600 text-lg">
            {isAdmin 
              ? 'View and manage all resources in the system'
              : `Browse all ${displayResources.length} available resources`
            }
          </p>
        </div>

        {/* Featured Resources */}
        {!isAdmin && featuredResources.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-gray-900">Featured Resources</h2>
              <span className="text-blue-600 font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Top Picks
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredResources.map((resource) => (
                <ResourceCard
                  key={resource.id}
                  id={resource.id}
                  name={resource.name}
                  type={resource.type}
                  address={resource.address}
                  contact={resource.contact}
                  email={resource.email}
                  website={resource.website}
                  description={resource.description}
                  status={resource.status}
                  hours={resource.hours}
                  services={resource.services}
                />
              ))}
            </div>
          </div>
        )}

        {/* Recently Added */}
        {!isAdmin && (
          <div className="mb-12">
            <RecentlyAdded />
          </div>
        )}

        {/* Resource Grid */}
        {displayResources.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24">
            <h3 className="text-2xl font-semibold text-gray-900 mb-2">No resources found</h3>
            <p className="text-gray-600 mb-4">There are currently no resources available.</p>
            <img src="https://illustrations.popsy.co/gray/empty-state.svg" alt="No resources" className="w-64 h-64 opacity-60" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {displayResources.map((resource) => (
              isAdmin ? (
                <AdminResourceCard
                  key={resource.id}
                  id={resource.id}
                  name={resource.name}
                  type={resource.type}
                  address={resource.address}
                  contact={resource.contact}
                  email={resource.email}
                  website={resource.website}
                  description={resource.description}
                  status={resource.status}
                  hours={resource.hours}
                  services={resource.services}
                  verification_status={resource.verification_status}
                />
              ) : (
                <ResourceCard
                  key={resource.id}
                  id={resource.id}
                  name={resource.name}
                  type={resource.type}
                  address={resource.address}
                  contact={resource.contact}
                  email={resource.email}
                  website={resource.website}
                  description={resource.description}
                  status={resource.status}
                  hours={resource.hours}
                  services={resource.services}
                />
              )
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Resources;