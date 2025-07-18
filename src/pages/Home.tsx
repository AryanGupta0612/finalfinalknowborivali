import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Plus, Users, TrendingUp } from 'lucide-react';
import { useResources } from '../hooks/useResources';
import { categories } from '../data/resources';
import ToastContainer from '../components/ToastContainer';
import { useToast } from '../hooks/useToast';

function Home() {
  const { totalLiveCount } = useResources();
  const { toasts, removeToast } = useToast();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-blue-100 to-blue-200">
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center py-20 px-4">
        <div className="bg-white/80 rounded-2xl shadow-xl p-10 max-w-2xl w-full text-center">
          <div className="flex justify-center mb-6">
            <div className="bg-blue-100 rounded-full p-5 shadow">
              <MapPin className="h-12 w-12 text-blue-600" />
            </div>
          </div>
          <h1 className="text-5xl font-extrabold text-blue-900 mb-4 tracking-tight">
            Know Borivali
          </h1>
          <p className="text-lg text-blue-700 mb-8">
            Discover essential places and services in Borivali, Mumbai. Community-verified information for hospitals, shops, parks, and more.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/resources"
              className="inline-flex items-center px-8 py-4 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-all duration-200 hover:scale-105 shadow-lg"
            >
              <MapPin className="h-5 w-5 mr-2" />
              Explore Resources
            </Link>
            <Link
              to="/add-resource"
              className="inline-flex items-center px-8 py-4 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-all duration-200 hover:scale-105 shadow-lg border border-blue-200"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add Resource
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="max-w-5xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div className="bg-white rounded-xl shadow-lg p-8 flex flex-col items-center">
            <MapPin className="h-8 w-8 text-blue-600 mb-3" />
            <h3 className="text-3xl font-bold text-gray-900 mb-2">{totalLiveCount}</h3>
            <p className="text-gray-600">Total Resources</p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-8 flex flex-col items-center">
            <Users className="h-8 w-8 text-green-600 mb-3" />
            <h3 className="text-3xl font-bold text-gray-900 mb-2">{categories.length}</h3>
            <p className="text-gray-600">Categories</p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-8 flex flex-col items-center">
            <TrendingUp className="h-8 w-8 text-purple-600 mb-3" />
            <h3 className="text-3xl font-bold text-gray-900 mb-2">Growing</h3>
            <p className="text-gray-600">Community Driven</p>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="max-w-5xl mx-auto px-4 pb-16">
        <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Browse by Category</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {categories.map((category) => (
            <Link
              key={category}
              to={`/resources?category=${encodeURIComponent(category)}`}
              className="bg-white rounded-xl shadow-md border border-gray-200 p-8 hover:shadow-lg transition-all duration-200 hover:scale-105 group flex flex-col justify-between"
            >
              <div>
                <h3 className="font-semibold text-xl text-gray-900 group-hover:text-blue-600 transition-colors mb-2">
                  {category}
                </h3>
              </div>
              <div className="flex justify-end mt-4">
                <MapPin className="h-6 w-6 text-blue-600 bg-blue-100 rounded-full p-2" />
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

export default Home;