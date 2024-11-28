import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const EditDeleteComponentForm = ({ id, initialData, onClose, onServiceUpdated, onServiceDeleted }) => {
  const navigate = useNavigate();
  const [serviceDisplayName, setServiceDisplayName] = useState(initialData.serviceDisplayName || '');
  const [serviceDescription, setServiceDescription] = useState(initialData.serviceDescription || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleEditService = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const requestBody = {
      name: serviceDisplayName,
      description: serviceDescription,
    };

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/components/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error('Failed to update service.');
      }

      const updatedService = await response.json();
      onServiceUpdated(updatedService);

      setServiceDisplayName(updatedService.name);
      onClose();
      navigate(`/components/${id}`); 
      toast.success('Данные о компоненте успешно обновлены!');
    } catch (error) {
      console.error('Error updating service:', error);
      setError('Failed to update service. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteService = async () => {
    if (window.confirm('Are you sure you want to delete this service? This action cannot be undone.')) {
      setIsSubmitting(true);
      setError(null);

      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/components/${id}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to delete service.');
        }

        onServiceDeleted(id);
        onClose();
        toast.success('Компонент успешно удален!'); 
      } catch (error) {
        console.error('Error deleting service:', error);
        setError('Failed to delete service. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
    }
  };
  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full" id="my-modal">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3 text-center">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Edit Component</h3>
          <form className="mt-2 space-y-6" onSubmit={handleEditService}>
            <div className="rounded-md shadow-sm -space-y-px">
              <div>
                <label htmlFor="service_display_name" className="sr-only">Service name</label>
                <input
                  id="service_display_name"
                  name="service_display_name"
                  type="text"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="Service name"
                  value={serviceDisplayName}
                  onChange={(e) => setServiceDisplayName(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="service_description" className="sr-only">Service description</label>
                <textarea
                  id="service_description"
                  name="service_description"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                  placeholder="Service description"
                  value={serviceDescription}
                  onChange={(e) => setServiceDescription(e.target.value)}
                  rows="4"
                />
              </div>
            </div>

            {error && (
              <div className="text-red-500 text-sm mt-2">
                {error}
              </div>
            )}

            <div className="flex justify-between">
              <button
                type="button"
                onClick={onClose}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-gray-700 bg-gray-200 hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 mr-2"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 mr-2"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Saving...' : 'Save'}
                
              </button>
              <button
                type="button"
                onClick={handleDeleteService}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default EditDeleteComponentForm;