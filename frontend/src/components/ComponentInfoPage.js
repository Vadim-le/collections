import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ReactComponent as BackIcon } from './back.svg';
import EditDeleteComponentForm from './EditDeleteComponentForm';
import { toast } from 'react-toastify';
import placeholderImage from '../flyCaptcha.jpg';


function ComponentInfoPage() {
  const { id } = useParams();
  console.log('Current ID:', id);
  const { serviceName } = useParams();
  const navigate = useNavigate();
  const [serviceDisplayName, setServiceDisplayName] = useState(null);
  const [serviceDescription, setServiceDescription] = useState(null);
  const [servicePoints, setServicePoints] = useState([]);
  const [expandedPointIndex, setExpandedPointIndex] = useState(null);
  const [activeButtonIndex, setActiveButtonIndex] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editFormOpen, setEditFormOpen] = useState(false);

  useEffect(() => {
    const fetchServiceInfo = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/components/${id}`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Fetched service info:', data);
        setServiceDisplayName(data.componentName);
        setServiceDescription(data.componentDescription);
        setServicePoints(data.functions);
      } catch (error) {
        console.error('Error fetching service info:', error);
      }
    };
    fetchServiceInfo();
  }, [id]);

  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.code === 'Escape') {
        setIsModalOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscKey);

    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, []);

  const toggleExpand = (index) => {
    if (index === expandedPointIndex) {
      setExpandedPointIndex(null);
      setActiveButtonIndex(null);
    } else {
      setExpandedPointIndex(index);
      setActiveButtonIndex(index);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleOpenModal = () => {
    setExpandedPointIndex(null);
    setActiveButtonIndex(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleAddEndpoint = async (newEndpoint) => {
    try {
      console.log('Data being sent to the server:', newEndpoint);

      const response = await fetch(`${process.env.REACT_APP_API_URL}/components/${id}/functions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newEndpoint),
      });
      if (response.ok) {
        const updatedServicePoints = await response.json();
        setServicePoints(updatedServicePoints);
        handleCloseModal();
      } else {
        console.error('Error adding endpoint:', response.statusText);
      }
    } catch (error) {
      console.error('Error adding endpoint:', error);
    }
  };

  const handleEditFormOpen = () => {
    setEditFormOpen(true);
  };
  
  const handleEditFormClose = () => {
    setEditFormOpen(false);
  };

  const handleServiceUpdated = (updatedService) => {
    setServiceDisplayName(updatedService.name); 
    setServiceDescription(updatedService.description); 
  };
  
  const handleServicePointUpdated = (updatedPoint) => {
    setServicePoints((prevPoints) =>
        prevPoints.map((point) =>
            point.id === updatedPoint.id ? updatedPoint : point
        )
    );
};
  const handleServiceDeleted = (deletedServiceName) => {
    window.location.href = '/components'; 
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div className="flex items-center mb-4 md:mb-0">
          <button onClick={() => navigate('/components')} className="mr-4 p-2 rounded-full hover:bg-gray-200 transition-colors">
            <BackIcon className="w-6 h-6" title="Back" />
          </button>
          <h1 className="text-2xl font-bold">Component details</h1>
        </div>
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
          <button 
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            onClick={handleEditFormOpen}
          >
            Edit Component
          </button>
        </div>
      </div>

      {editFormOpen && ( 
        <EditDeleteComponentForm
          id={id}     
          initialData={{ serviceDisplayName, serviceDescription }}
          onClose={handleEditFormClose}
          onServiceUpdated={handleServiceUpdated}
          onServiceDeleted={handleServiceDeleted}
        />
      )}

      <div className="bg-white shadow rounded-lg p-6 mb-8">
        <div className="flex items-center mb-4">
          <div className="w-16 h-16 mr-4">
          <img src={placeholderImage} alt="Заглушка" className="w-full h-full object-cover rounded-full" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">{serviceDisplayName}</h2>
            <p className="text-gray-600">{serviceDescription}</p>
          </div>
        </div>
      </div>

      <h2 className="text-xl font-semibold mb-4">Component functions</h2>
      <button 
        className="mb-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
        onClick={handleOpenModal}
      >
        Add new function
      </button>

      <ul className="space-y-4">
        {servicePoints.map((point, index) => (
          <ServicePoint
            key={point.id}
            point={point}
            isExpanded={index === expandedPointIndex}
            isActive={index === activeButtonIndex}
            toggleExpand={() => toggleExpand(index)}
            serviceName={serviceName}
            setServicePoints={setServicePoints}
            functionId={point.id}
            componentId={id}
            updateServicePoint={handleServicePointUpdated}
          />
        ))}
      </ul>

      {isModalOpen && <AddEndpointModal onClose={handleCloseModal} onAdd={handleAddEndpoint} />}

    </div>
  );
}

function ServicePoint({ point, isExpanded, isActive, toggleExpand, updateServicePoint, componentId , setServicePoints }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedParameters, setEditedParameters] = useState(point.parameters || []);
  const [editedName, setEditedName] = useState(point.name);
  const [changedParameters, setChangedParameters] = useState([]);
  const [parameterTypes, setParameterTypes] = useState([]);
  

  useEffect(() => {
    const fetchParameterTypes = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/components-types`);
        const types = await response.json();
        setParameterTypes(types);
      } catch (error) {
        console.error('Error fetching parameter types:', error);
      }
    };

    fetchParameterTypes();
  }, []);

  const toggleEdit = () => {
    setIsEditing(!isEditing);
  };

  const handleParameterChange = (index, field, value) => {
    const newParameters = [...editedParameters];
    newParameters[index] = { ...newParameters[index], [field]: value };
    setEditedParameters(newParameters);

    if (!changedParameters.includes(index)) {
      setChangedParameters([...changedParameters, index]);
    }
  };

  const handleAddParameter = () => {
    const newParameter = { id: null, name: '', description: '', is_multiple_values: false, is_return_value: null, default: '', path: '',param_type: '', position_in_signature:null };
    setEditedParameters([...editedParameters, newParameter]);
    setChangedParameters([...changedParameters, editedParameters.length]);
  };

  const handleRemoveParameter = async (index) => {
    const parameterToRemove = editedParameters[index];
    console.log(`Attempting to delete parameter with id: ${parameterToRemove.id}`);

    if (parameterToRemove && parameterToRemove.id) {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/parameters/${parameterToRemove.id}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          throw new Error('Failed to delete parameter');
        }
      } catch (error) {
        console.error('Error deleting parameter:', error);
        return;
      }
    }

    const newParameters = editedParameters.filter((_, i) => i !== index);
    setEditedParameters(newParameters);
    setChangedParameters(changedParameters.filter(i => i !== index));
    toast.error('Параметр успешно удален!');

  };

  const handleRemoveServicePoint = async () => {
    try {
      if (!point || !point.id) {
        throw new Error('Service point ID is undefined');
      }
      console.log('Deleting service point with id:', point.id);
      const response = await fetch(`${process.env.REACT_APP_API_URL}/functions/${point.id}`, {
        method: 'DELETE',
      });
  
      if (!response.ok) {
        throw new Error('Failed to delete service point');
      }
      const updatedServicePointsResponse = await fetch(`${process.env.REACT_APP_API_URL}/components/functions/${componentId }`);
      const updatedServicePointsData = await updatedServicePointsResponse.json();
      console.log('Fetched service info:', updatedServicePointsData);
      setServicePoints(updatedServicePointsData);
      toast.error('Функция успешно удалена!');
    } catch (error) {
      console.error('Error deleting service point:', error);
    }
  };

  const saveChanges = async () => {
    try {
        const updatedParametersToSend = changedParameters.map(index => editedParameters[index]).filter(param => param);

        const dataToSend = {
          name: editedName,
          parameters: updatedParametersToSend,
        };

        //console.log('Sending data to server:', JSON.stringify(dataToSend, null, 2));

        const response = await fetch(`${process.env.REACT_APP_API_URL}/functions/parameters/${point.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dataToSend),
        });

        if (response.ok) {
            const updatedParameters = await response.json();
            updateServicePoint({ id: point.id, name: editedName, parameters: updatedParameters });
            setIsEditing(false);
            setChangedParameters([]);
        } else {
            console.error('Failed to update parameters:', response.statusText);
        }
    } catch (error) {
        console.error('Error updating parameters:', error);
    }
}

  useEffect(() => {
    const handleEscapeKey = (event) => {
      if (event.code === 'Escape') {
        setIsEditing(false);
      }
    };

    document.addEventListener('keydown', handleEscapeKey);
    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, []);

  return (
    <li className="bg-white shadow rounded-lg overflow-hidden">
      <button 
        className={`w-full text-left px-6 py-4 focus:outline-none ${isActive ? 'bg-blue-50' : ''}`} 
        onClick={toggleExpand}
      >
        <span className="font-medium">{point.name}</span>
      </button>
      {isExpanded && (
        <div className="px-6 py-4">
          <h4 className="text-md font-medium mb-2">Input parameters</h4>
          <button 
            onClick={toggleEdit}
            className="mb-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Edit parameters
          </button>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Parameter name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Parameter description</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">is multiple values</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">is return value</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">default</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">path</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Parameter type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Position in signature</th>
                  
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {editedParameters.map((parameter, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap">{parameter.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{parameter.description}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{parameter.is_multiple_values ? "Required" : "Optional"}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{parameter.is_return_value ? "Required" : "Optional"}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{parameter.default}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{parameter.path}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{parameter.param_type}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{parameter.position_in_signature}</td>                  
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button 
            onClick={handleRemoveServicePoint}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Delete component function 
          </button>
          {isEditing && (
            <form onSubmit={(e) => {
              e.preventDefault(); 
              saveChanges().then(() => {
                toast.success('Данные успешно сохранены!');
                toggleEdit();
              });
            }}>
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-lg p-6 w-full max-w-6xl">
                  <button className="float-right text-2xl" onClick={toggleEdit}>&times;</button>
                  <h3 className="text-xl font-bold mb-4">Edit component function</h3>
                  <div className="h-96 overflow-y-auto">
                    <div className="space-y-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Name:</label>
                        <input 
                          type="text" 
                          value={editedName} 
                          onChange={(e) => setEditedName(e.target.value)}
                          required
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                      </div>
                    </div>
                    <h3 className="text-lg font-medium mb-2">Edit parameters</h3>
                    <button 
                      type="button" 
                      onClick={handleAddParameter}
                      className="mb-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                    >
                      Add parameter
                    </button>
                    <div className="space-y-4">
                    <table className="min-w-full border-collapse">
                      <thead>
                        <tr className="bg-gray-200">
                          <th className="text-left p-2">Name</th>
                          <th className="text-left p-2">Description</th>
                          <th className="text-left p-2">Is Multiple Values</th>
                          <th className="text-left p-2">Is Return Value</th>
                          <th className="text-left p-2">Default</th>
                          <th className="text-left p-2">Path</th>
                          <th className="text-left p-2">Parameter Type</th>
                          <th className="text-left p-2">Position in Signature</th>
                          <th className="text-left p-2">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {editedParameters.map((parameter, index) => (
                          <tr key={index} className="border-b">
                            <td className="p-2">
                              <input
                                type="text"
                                placeholder="Name"
                                value={parameter.name}
                                onChange={(e) => handleParameterChange(index, 'name', e.target.value)}
                                required
                                className="w-full border border-gray-300 rounded-md shadow-sm py-1 px-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                              />
                            </td>
                            <td className="p-2">
                              <input
                                type="text"
                                placeholder="Description"
                                value={parameter.description}
                                onChange={(e) => handleParameterChange(index, 'description', e.target.value)}
                                required
                                className="w-full border border-gray-300 rounded-md shadow-sm py-1 px-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                              />
                            </td>
                            <td className="p-2 text-center">
                              <input
                                type="checkbox"
                                checked={parameter.is_multiple_values}
                                onChange={(e) => handleParameterChange(index, 'is_multiple_values', e.target.checked)}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                              />
                            </td>
                            <td className="p-2 text-center">
                              <input
                                type="checkbox"
                                checked={parameter.is_return_value}
                                onChange={(e) => handleParameterChange(index, 'is_return_value', e.target.checked)}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                              />
                            </td>
                            <td className="p-2">
                              <input
                                type="text"
                                placeholder="Default"
                                value={parameter.default}
                                onChange={(e) => handleParameterChange(index, 'default', e.target.value)}
                                className="w-full border border-gray-300 rounded-md shadow-sm py-1 px-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                              />
                            </td>
                            <td className="p-2">
                              <input
                                type="text"
                                placeholder="Path"
                                value={parameter.path}
                                onChange={(e) => handleParameterChange(index, 'path', e.target.value)}
                                className="w-full border border-gray-300 rounded-md shadow-sm py-1 px-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                              />
                            </td>
                            <td className="p-2">
                              <select
                                value={parameter.param_type}
                                onChange={(e) => handleParameterChange(index, 'param_type', e.target.value)}
                                required
                                className="w-full border border-gray-300 rounded-md shadow-sm py-1 px-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                              >
                                <option value="" disabled>Select type</option>
                                {parameterTypes.map((type, i) => (
                                  <option key={i} value={type}>{type}</option>
                                ))}
                              </select>
                            </td>
                            <td className="p-2">
                              <input
                                type="number"
                                placeholder="Position"
                                value={parameter.position_in_signature}
                                onChange={(e) => handleParameterChange(index, 'position_in_signature', e.target.value)}
                                className="w-full border border-gray-300 rounded-md shadow-sm py-1 px-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                              />
                            </td>
                            <td className="p-2 text-center">
                              <button
                                onClick={() => handleRemoveParameter(index)}
                                className="bg-red-500 text-white rounded-md px-2 py-1 hover:bg-red-600"
                              >
                                Remove
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    </div>
                    <button 
                      type="submit" 
                      className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                    >
                      Save changes
                    </button>
                  </div>
                </div>
              </div>
            </form>
          )}
        </div>
      )}
    </li>
  );
}

function AddEndpointModal({ onClose, onAdd }) {
  const [name, setName] = useState('');
  const [parameters, setParameters] = useState([{ name: '', description: '', param_type: '', is_multiple_values: false, is_return_value:false, default: '', path: '', position_in_signature:null }]);
  const [parameterTypes, setParameterTypes] = useState([]);

  useEffect(() => {
    const fetchParameterTypes = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/components-types`);
        const data = await response.json();
        console.log(JSON.stringify(data));
        setParameterTypes(data);
      } catch (error) {
        console.error('Error fetching parameter types:', error);
      }
    };

    fetchParameterTypes();
  }, []);

  const handleNameChange = (e) => setName(e.target.value);
  const handleParameterChange = (index, field, value) => {
    const newParameters = [...parameters];
    newParameters[index][field] = value;
    setParameters(newParameters);
  };

  const handleAddParameter = () => {
    setParameters([...parameters, { name: '', description: '', param_type: '', is_multiple_values: false, is_return_value:false, default: '', path: '', position_in_signature: null }]);
  };

  const handleRemoveParameter = (index) => {
    setParameters(parameters.filter((_, i) => i !== index));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Form submitted'); 
    const newEndpoint = {
      name,
      parameters
    };
    onAdd(newEndpoint);
    toast.success('Функция успешно добавлена!');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-7xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Add New Endpoint</h2>
          <button onClick={onClose} className="text-2xl">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">NAME:</label>
            <input 
              type="text" 
              id="name"
              value={name}
              onChange={handleNameChange} 
              required
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          <div>
            <h3 className="text-lg font-medium mb-2">Parameters</h3>
            <button 
              type="button" 
              onClick={handleAddParameter}
              className="mb-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
            >
              Add parameter
            </button>
            {parameters.map((parameter, index) => (
              <div key={index} className="flex items-center space-x-2 mb-2">
                <input
                  type="text"
                  placeholder="Name"
                  value={parameter.name}
                  onChange={(e) => handleParameterChange(index, 'name', e.target.value)}
                  required
                  className="flex-1 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
                <input
                  type="text"
                  placeholder="Description"
                  value={parameter.description}
                  onChange={(e) => handleParameterChange(index, 'description', e.target.value)}
                  required
                  className="flex-1 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
                <select
 value={parameter.param_type}
                  onChange={(e) => handleParameterChange(index, 'param_type', e.target.value)}
                  required
                  className="border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="" disabled>Select type</option>
                  {parameterTypes.map((type, i) => (
                    <option key={i} value={type}>{type}</option>
                  ))}
                </select>
                <input
                  type="checkbox"
                  checked={parameter.is_multiple_values}
                  onChange={(e) => handleParameterChange(index, 'is_multiple_values', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <input
                  type="checkbox"
                  checked={parameter.is_return_value}
                  onChange={(e) => handleParameterChange(index, 'is_return_value', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <input
                  type="text"
                  placeholder="Default"
                  value={parameter.default}
                  onChange={(e) => handleParameterChange(index, 'default', e.target.value)}
                  className="flex-1 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
                <input
                  type="text"
                  placeholder="Path"
                  value={parameter.path}
                  onChange={(e) => handleParameterChange(index, 'path', e.target.value)}
                  className="flex-1 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
                <input
                  type="number"
                  placeholder="Position in signature"
                  value={parameter.position_in_signature}
                  onChange={(e) => handleParameterChange(index, 'position_in_signature', e.target.value)}
                  className="flex-1 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
                <button 
                  type="button" 
                  onClick={() => handleRemoveParameter(index)}
                  className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                >
                  &times;
                </button>
              </div>
            ))}
          </div>
          <button 
            type="submit"
            className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Add Endpoint
          </button>
        </form>
      </div>
    </div>
  );
}

export default ComponentInfoPage;