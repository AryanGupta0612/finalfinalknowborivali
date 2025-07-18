import React, { useState } from 'react';
import { MapPin, Clock, Phone, Mail, Globe, Heart, Edit, AlertCircle } from 'lucide-react';
import EditResourceModal from './EditResourceModal';

interface ResourceCardProps {
  id: string;
  name: string;
  type: string;
  address: string;
  contact?: string;
  email?: string;
  website?: string;
  description?: string;
  status?: 'Open' | 'Closed' | 'Open 24/7';
  hours?: string;
  services?: string[];
  verification_status?: 'live' | 'pending' | 'rejected';
  onRefresh?: () => void;
}

function ResourceCard({ 
  id,
  name, 
  type, 
  address, 
  contact, 
  email, 
  website, 
  description, 
  status = 'Open', 
  hours = '9:00 AM - 6:00 PM',
  services = [],
  verification_status = 'live',
  onRefresh
}: ResourceCardProps) {
  const [showEditModal, setShowEditModal] = useState(false);


  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Open': return 'bg-green-100 text-green-800';
      case 'Closed': return 'bg-red-100 text-red-800';
      case 'Open 24/7': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getVerificationBadge = () => {
    if (verification_status === 'pending') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          <AlertCircle className="h-3 w-3" />
          Pending Verification
        </span>
      );
    }
    return null;
  };

  return (
    <>
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 hover:shadow-xl transition-shadow mb-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <button className="text-gray-400 hover:text-red-500 transition-colors">
                <Heart className="h-5 w-5" />
              </button>
              <h3 className="font-semibold text-xl text-gray-900">{name}</h3>
              {getVerificationBadge()}
            </div>
            
            <div className="mb-3">
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
                {status}
              </span>
            </div>
          </div>
          
          <button
            onClick={() => setShowEditModal(true)}
            className="flex items-center gap-1 px-3 py-1 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
          >
            <Edit className="h-4 w-4" />
            Edit
          </button>
        </div>

        {/* Description */}
        {description && (
          <p className="text-gray-600 mb-4 leading-relaxed">{description}</p>
        )}

        {/* Services */}
        {services.length > 0 && (
          <div className="mb-4">
            <div className="flex flex-wrap gap-2">
              {services.slice(0, 3).map((service, index) => (
                <span 
                  key={index}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-700"
                >
                  {service}
                </span>
              ))}
              {services.length > 3 && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-700">
                  +{services.length - 3} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Contact Information */}
        <div className="space-y-3 pt-4 border-t border-gray-100">
          <div className="flex items-start space-x-3 text-sm text-gray-600">
            <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>{address}</span>
          </div>
          
          <div className="flex items-center space-x-3 text-sm text-gray-600">
            <Clock className="h-4 w-4 flex-shrink-0" />
            <span>{hours}</span>
          </div>

          {/* Contact Number */}
          {contact && (
            <div className="flex items-center space-x-3 text-sm text-gray-600">
              <Phone className="h-4 w-4 flex-shrink-0" />
              <a 
                href={`tel:${contact}`}
                className="text-blue-600 hover:text-blue-700 transition-colors font-medium"
              >
                {contact}
              </a>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-4 pt-2">
            {email && (
              <a 
                href={`mailto:${email}`}
                className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 transition-colors"
              >
                <Mail className="h-4 w-4" />
                <span className="text-sm font-medium">Email</span>
              </a>
            )}
            
            {website && (
              <a 
                href={website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 transition-colors"
              >
                <Globe className="h-4 w-4" />
                <span className="text-sm font-medium">Website</span>
              </a>
            )}
          </div>

        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <EditResourceModal
          resource={{
            id,
            name,
            type,
            address,
            contact,
            email,
            website,
            description,
            status,
            hours,
            services
          }}
          onClose={() => setShowEditModal(false)}
          onSuccess={() => {
            setShowEditModal(false);
            if (onRefresh) onRefresh();
          }}
        />
      )}
    </>
  );
}

export default ResourceCard;