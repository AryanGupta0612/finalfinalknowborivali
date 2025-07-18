import React, { useState } from 'react';
import { MapPin, Clock, Phone, Mail, Globe, Edit, Trash2, AlertTriangle, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import EditResourceModal from './EditResourceModal';
import { useToast } from '../hooks/useToast';
import { useResources } from '../hooks/useResources';

interface AdminResourceCardProps {
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
  onDelete?: (id: string) => void;
}

function AdminResourceCard({ 
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
  onRefresh,
  onDelete
}: AdminResourceCardProps) {
  const { showToast } = useToast();
  const { deleteResource, approveResource, rejectResource } = useResources();
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Open': return 'bg-green-100 text-green-800';
      case 'Closed': return 'bg-red-100 text-red-800';
      case 'Open 24/7': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getVerificationBadge = () => {
    switch (verification_status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            Pending
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
            Rejected
          </span>
        );
      case 'live':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Live
          </span>
        );
      default:
        return null;
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      console.log('Admin deleting resource:', id);
      
      const result = await deleteResource(id);

      if (!result.success) {
        console.error('Delete operation failed:', result.error);
        showToast('Failed to delete resource', 'error');
        return;
      }

      console.log('Resource deletion successful');
      
      showToast('Resource deleted successfully', 'success');



      setShowDeleteConfirm(false);
      
      // Call onDelete callback if provided
      if (onDelete) {
        onDelete(id);
      }
      
      // Refresh the resources list to ensure consistency
      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      console.error('Error deleting resource:', error);
      showToast('Failed to delete resource', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleApprove = async () => {
    setIsProcessing(true);
    try {
      console.log('Admin approving resource:', id);
      
      const result = await approveResource(id);

      if (!result.success) {
        throw result.error;
      }
      
      showToast('Resource approved successfully', 'success');
    } catch (error) {
      console.error('Error approving resource:', error);
      showToast('Failed to approve resource', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    setIsProcessing(true);
    try {
      console.log('Admin rejecting resource:', id);
      
      const result = await rejectResource(id);

      if (!result.success) {
        throw result.error;
      }
      
      showToast('Resource rejected', 'info');
    } catch (error) {
      console.error('Error rejecting resource:', error);
      showToast('Failed to reject resource', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <div className="bg-white rounded-2xl shadow-lg border-2 border-blue-200 p-8 hover:shadow-xl transition-shadow mb-4">
        {/* Admin Badge */}
        <div className="bg-blue-50 border border-blue-200 rounded-md p-2 mb-4">
          <p className="text-xs text-blue-700 font-medium">ADMIN VIEW</p>
        </div>

        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="font-semibold text-xl text-gray-900">{name}</h3>
              {getVerificationBadge()}
            </div>
            
            <div className="mb-3">
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
                {status}
              </span>
            </div>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => setShowEditModal(true)}
              className="flex items-center gap-1 px-3 py-1 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-all duration-200 hover:scale-105"
            >
              <Edit className="h-4 w-4" />
              Edit
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              disabled={isDeleting}
              className="flex items-center gap-1 px-3 py-1 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-all duration-200 hover:scale-105 disabled:opacity-50"
            >
              {isDeleting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" />
                  Delete
                </>
              )}
            </button>
          </div>
        </div>

        {/* Admin Actions for Pending Resources */}
        {verification_status === 'pending' && (
          <div className="flex gap-2 mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <button
              onClick={handleApprove}
              disabled={isProcessing}
              className="flex items-center gap-1 px-3 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition-all duration-200 hover:scale-105"
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4" />
                  Approve
                </>
              )}
            </button>
            <button
              onClick={handleReject}
              disabled={isProcessing}
              className="flex items-center gap-1 px-3 py-1 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 transition-all duration-200 hover:scale-105"
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Processing...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" />
                  Reject
                </>
              )}
            </button>
          </div>
        )}

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
          }}
          isAdmin={true}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="h-6 w-6 text-red-600" />
              <h3 className="text-lg font-semibold text-gray-900">Delete Resource</h3>
            </div>
            
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete "{name}"? This action cannot be undone.
            </p>
            
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default AdminResourceCard;