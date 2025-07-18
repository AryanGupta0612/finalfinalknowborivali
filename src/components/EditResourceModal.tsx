import React, { useState } from 'react';
import { X, Save, AlertCircle } from 'lucide-react';
import { categories } from '../data/resources';
import { useResources } from '../hooks/useResources';
import { supabase } from '../lib/supabase';

interface EditResourceModalProps {
  resource: {
    id: string;
    name: string;
    type: string;
    address: string;
    contact?: string;
    email?: string;
    website?: string;
    description?: string;
    status: 'Open' | 'Closed' | 'Open 24/7';
    hours?: string;
    services?: string[];
  };
  onClose: () => void;
  onSuccess: () => void;
  isAdmin?: boolean;
}

function EditResourceModal({ resource, onClose, onSuccess, isAdmin = false }: EditResourceModalProps) {
  const { submitResourceEdit } = useResources();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [serviceInput, setServiceInput] = useState('');
  
  const handleAdminDirectEdit = async () => {
    try {
      const editData = {
        ...formData,
        contact: formData.contact || null,
        email: formData.email || null,
        website: formData.website || null,
        description: formData.description || null,
        hours: formData.hours || null,
        services: formData.services.length > 0 ? formData.services : null,
        is_admin_submitted: true, // Mark admin edits
        verification_status: 'live', // Admin edits go live immediately
        approved: true
      };

      const { error } = await supabase
        .from('resources')
        .update(editData)
        .eq('id', resource.id);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error updating resource:', error);
      return { success: false, error };
    }
  };

  const [formData, setFormData] = useState({
    name: resource.name,
    type: resource.type,
    category: 'Hospitals & Clinics', // Default category
    address: resource.address,
    contact: resource.contact || '',
    email: resource.email || '',
    website: resource.website || '',
    description: resource.description || '',
    status: resource.status,
    hours: resource.hours || '',
    services: resource.services || []
  });

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.type.trim()) newErrors.type = 'Type is required';
    if (!formData.category) newErrors.category = 'Category is required';
    if (!formData.address.trim()) newErrors.address = 'Address is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.hours.trim()) newErrors.hours = 'Hours are required';

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (formData.website && !/^https?:\/\/.+\..+/.test(formData.website)) {
      newErrors.website = 'Please enter a valid website URL (include http:// or https://)';
    }

    if (formData.contact && !/^[\+]?[0-9\s\-\(\)]{10,}$/.test(formData.contact)) {
      newErrors.contact = 'Please enter a valid phone number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const addService = () => {
    if (serviceInput.trim() && !formData.services.includes(serviceInput.trim())) {
      setFormData(prev => ({
        ...prev,
        services: [...prev.services, serviceInput.trim()]
      }));
      setServiceInput('');
    }
  };

  const removeService = (index: number) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      let result;
      
      if (isAdmin) {
        result = await handleAdminDirectEdit();
      } else {
        const editData = {
          ...formData,
          contact: formData.contact || null,
          email: formData.email || null,
          website: formData.website || null,
          description: formData.description || null,
          hours: formData.hours || null,
          services: formData.services.length > 0 ? formData.services : null
        };
        result = await submitResourceEdit(resource.id, editData);
      }

      if (result.success) {
        onSuccess();
      } else {
        setErrors({ submit: isAdmin ? 'Failed to update resource. Please try again.' : 'Failed to submit edit. Please try again.' });
      }

    } catch (error) {
      console.error('Error submitting edit:', error);
      setErrors({ submit: isAdmin ? 'Failed to update resource. Please try again.' : 'Failed to submit edit. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              {isAdmin ? 'Edit Resource (Admin)' : 'Edit Resource'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          {!isAdmin && <p className="text-sm text-gray-600 mt-2">
            Your changes will be reviewed by the community before going live.
          </p>}
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {errors.submit && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
                <p className="text-red-700">{errors.submit}</p>
              </div>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-6">
            {/* Name */}
            <div className="md:col-span-2">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Resource Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
            </div>

            {/* Type */}
            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
                Type *
              </label>
              <input
                type="text"
                id="type"
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.type ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.type && <p className="mt-1 text-sm text-red-600">{errors.type}</p>}
            </div>

            {/* Category */}
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                Category *
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.category ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
              {errors.category && <p className="mt-1 text-sm text-red-600">{errors.category}</p>}
            </div>

            {/* Address */}
            <div className="md:col-span-2">
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                Address *
              </label>
              <input
                type="text"
                id="address"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.address ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.address && <p className="mt-1 text-sm text-red-600">{errors.address}</p>}
            </div>

            {/* Contact */}
            <div>
              <label htmlFor="contact" className="block text-sm font-medium text-gray-700 mb-2">
                Contact Number
              </label>
              <input
                type="tel"
                id="contact"
                name="contact"
                value={formData.contact}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.contact ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.contact && <p className="mt-1 text-sm text-red-600">{errors.contact}</p>}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.email ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
            </div>

            {/* Website */}
            <div className="md:col-span-2">
              <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-2">
                Website
              </label>
              <input
                type="url"
                id="website"
                name="website"
                value={formData.website}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.website ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.website && <p className="mt-1 text-sm text-red-600">{errors.website}</p>}
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                id="description"
                name="description"
                rows={4}
                value={formData.description}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.description ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
            </div>

            {/* Status */}
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="Open">Open</option>
                <option value="Closed">Closed</option>
                <option value="Open 24/7">Open 24/7</option>
              </select>
            </div>

            {/* Hours */}
            <div className="md:col-span-2">
              <label htmlFor="hours" className="block text-sm font-medium text-gray-700 mb-2">
                Operating Hours *
              </label>
              <input
                type="text"
                id="hours"
                name="hours"
                value={formData.hours}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.hours ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.hours && <p className="mt-1 text-sm text-red-600">{errors.hours}</p>}
            </div>

            {/* Services */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Services Offered
              </label>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={serviceInput}
                  onChange={(e) => setServiceInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addService())}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Add a service and press Enter"
                />
                <button
                  type="button"
                  onClick={addService}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Add
                </button>
              </div>
              {formData.services.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.services.map((service, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                    >
                      {service}
                      <button
                        type="button"
                        onClick={() => removeService(index)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className="mt-8 flex justify-end gap-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  {isAdmin ? 'Updating...' : 'Submitting...'}
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  {isAdmin ? 'Update Resource' : 'Submit Edit'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditResourceModal;