import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ReactComponent as BackIcon } from './back.svg';
import EditDeleteServiceForm from './EditDeleteServiceForm';
import { toast } from 'react-toastify';


function ServiceInfoPage() {
  const { serviceName } = useParams();
  const navigate = useNavigate();
  const [serviceDisplayName, setServiceDisplayName] = useState(null);
  const [serviceDescription, setServiceDescription] = useState(null);
  const [servicePoints, setServicePoints] = useState([]);
  const [serviceLogo, setServiceLogo] = useState(null);
  const [expandedPointIndex, setExpandedPointIndex] = useState(null);
  const [activeButtonIndex, setActiveButtonIndex] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const [paramName, setParamName] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [authMethod, setAuthMethod] = useState('var1');
  const [authType, setAuthType] = useState('');
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [clientUrl, setClientUrl] = useState('');
  const [scope, setScope] = useState('');
  const [authorizationUrl, setAuthorizationUrl] = useState('');
  const [authorizationContentType, setAuthorizationContentType] = useState('');
  const [editFormOpen, setEditFormOpen] = useState(false);

  useEffect(() => {
    const fetchServiceInfo = async () => {
      try {
        console.log("Current serviceName:", serviceName);
        const response = await fetch(`${process.env.REACT_APP_API_URL}/api/services/${serviceName}`);
        const data = await response.json();
        console.log(data);
        setServiceDisplayName(data.serviceName);
        setServiceDescription(data.serviceDescription);
        setServicePoints(data.servicePoints);
        setServiceLogo(data.serviceLogo);
      } catch (error) {
        console.error('Error fetching service info:', error);
      }
    };

    fetchServiceInfo();
  }, [serviceName]);

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

  const updateServicePoint = (id, updatedPoint) => {
    setServicePoints(prevPoints =>
      prevPoints.map(point => (point.id === id ? updatedPoint : point))
    );
  };
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
      console.log(newEndpoint);
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/services/${serviceName}/endpoints`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newEndpoint),
      });
      if (response.ok) {
        const updatedServicePoints = await response.json();
        console.log(updatedServicePoints);
        setServicePoints(updatedServicePoints);
        handleCloseModal();
      } else {
        console.error('Error adding endpoint:', response.statusText);
      }
    } catch (error) {
      console.error('Error adding endpoint:', error);
    }
  };

  const handleAuthTypeChange = (e) => {
    setAuthType(e.target.value);
  };

  const handleAuthChoiceChange = (e) => {
    setAuthMethod(e.target.value);
  };

  const handleNewServiceSubmit = async (event) => {
    event.preventDefault();
    let requestBody = { serviceName };
    let url;

    switch (authMethod) {
      case 'var2':
        requestBody.token = apiKey;
        requestBody.paramName = paramName;
        requestBody.auth_id = authType === 'Header' ? 1 : 2;
        url = '/api/create-auth-service';
        break;

      case 'var3':
        requestBody = {
          ...requestBody,
          clientId,
          clientSecret,
          clientUrl,
          authorizationContentType,
          authorizationUrl,
          scope
        };
        url = '/api/create-oauth-service';
        break;

      default:
        break;
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error('Failed to create service.');
      }

      console.log('Service created successfully.');
    } catch (error) {
      console.error('Error creating service:', error);
    }
    
    setShowForm(false);
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

  const handleServiceDeleted = (deletedServiceName) => {
    window.location.href = '/services'; 
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div className="flex items-center mb-4 md:mb-0">
          <button onClick={() => navigate('/services')} className="mr-4 p-2 rounded-full hover:bg-gray-200 transition-colors">
            <BackIcon className="w-6 h-6" title="Back" />
          </button>
          <h1 className="text-2xl font-bold">Service details</h1>
        </div>
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
          <button 
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            onClick={handleEditFormOpen}
          >
            Edit Service
          </button>
          <button 
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? 'Cancel' : 'Add authorization'}
          </button>
        </div>
      </div>

      {editFormOpen && ( 
        <EditDeleteServiceForm
          serviceName={serviceName}     
          initialData={{ serviceDisplayName, serviceDescription }}
          onClose={handleEditFormClose}
          onServiceUpdated={handleServiceUpdated}
          onServiceDeleted={handleServiceDeleted}
        />
      )}

      <div className="bg-white shadow rounded-lg p-6 mb-8">
        <div className="flex items-center mb-4">
          <div className="w-16 h-16 mr-4">
            <img src={serviceLogo} alt="Service" className="w-full h-full object-cover rounded-full" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">{serviceDisplayName}</h2>
            <p className="text-gray-600">{serviceDescription}</p>
          </div>
        </div>
      </div>

      <h2 className="text-xl font-semibold mb-4">Service endpoints</h2>
      <button 
        className="mb-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
        onClick={handleOpenModal}
      >
        Add new endpoint
      </button>

      <ul className="space-y-4">
        {servicePoints.map((point, index) => (
          <ServicePoint
            key={index}
            point={point}
            isExpanded={index === expandedPointIndex}
            isActive={index === activeButtonIndex}
            toggleExpand={() => toggleExpand(index)}
            serviceName={serviceName}
            setServicePoints={setServicePoints}
            updateServicePoint={updateServicePoint}
          />
        ))}
      </ul>

      {isModalOpen && <AddEndpointModal onClose={handleCloseModal} onAdd={handleAddEndpoint} />}

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <form className="space-y-4" onSubmit={handleNewServiceSubmit}>
              <div>
                <label htmlFor="field3" className="block text-sm font-medium text-gray-700">Authorization method:</label>
                <select
                  id="Authchoice"
                  value={authMethod}
                  onChange={handleAuthChoiceChange}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                >
                  <option value="var1">No authorization</option>
                  <option value="var2">Service</option>
                  <option value="var3">Oauth</option>
                </select>
              </div>

              {authMethod === 'var2' && (
                <div className='space-y-4'>
                  <div className='flex items-center space-x-4'>
                    <label className="flex items-center">
                      <input
                        required
                        type="radio"
                        name="authType"
                        value="Header"
                        checked={authType === 'Header'}
                        onChange={handleAuthTypeChange}
                        className="mr-2"
                      />
                      Bearer
                    </label>
                    <label className="flex items-center">
                      <input
                        required
                        type="radio"
                        name="authType"
                        value="Query"
                        checked={authType === 'Query'}
                        onChange={handleAuthTypeChange}
                        className="mr-2"
                      />
                      Query
                    </label>
                  </div>
                  <div>
                    <label htmlFor="param_name" className="block text-sm font-medium text-gray-700">Parameter name:</label>
                    <input
                      required
                      type="text"
                      id="param_name"
                      value={paramName}
                      onChange={(e) => setParamName(e.target.value)}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label htmlFor="apikey" className="block text-sm font-medium text-gray-700">Service token / API key:</label>
                    <input
                      required
                      type="text"
                      id="apikey"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>
                </div>
              )}

              {authMethod === 'var3' && (
                <div className='space-y-4'>
                  <div>
                    <label htmlFor="client_id" className="block text-sm font-medium text-gray-700">Client ID:</label>
                    <input
                      required
                      type="text"
                      id="client_id"
                      value={clientId}
                      onChange={(e) => setClientId(e.target.value)}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label htmlFor="client_secret" className="block text-sm font-medium text-gray-700">Client Secret:</label>
                    <input
                      required
                      type="text"
                      id="client_secret"
                      value={clientSecret}
                      onChange={(e) => setClientSecret(e.target.value)}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label htmlFor="client_url" className="block text-sm font-medium text-gray-700">Client URL:</label>
                    <input
                      required
                      type="text"
                      id="client_url"
                      value={clientUrl}
                      onChange={(e) => setClientUrl(e.target.value)}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label htmlFor="scope" className="block text-sm font-medium text-gray-700">Scope:</label>
                    <input
                      required
                      type="text"
                      id="scope"
                      value={scope}
                      onChange={(e) => setScope(e.target.value)}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label htmlFor="authorization_url" className="block text-sm font-medium text-gray-700">Authorization URL:</label>
                    <input
                      required
                      type="text"
                      id="authorization_url"
                      value={authorizationUrl}
                      onChange={(e) => setAuthorizationUrl(e.target.value)}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="authorization_content_type" className="block text-sm font-medium text-gray-700">Authorization Content-Type:</label>
                    <input
                      required
                      type="text"
                      id="authorization_content_type"
                      value={authorizationContentType}
                      onChange={(e) => setAuthorizationContentType(e.target.value)}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-2">
                <button 
                  type="button" 
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Back
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Add
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function ServicePoint({ point, isExpanded, isActive, toggleExpand, updateServicePoint, serviceName, setServicePoints }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedParameters, setEditedParameters] = useState(point.parameters || []);
  const [editedName, setEditedName] = useState(point.uri);
  const [editedDescription, setEditedDescription] = useState(point.description);
  const [changedParameters, setChangedParameters] = useState([]);
  const [parameterTypes, setParameterTypes] = useState([]);

  useEffect(() => {
    const fetchParameterTypes = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/api/parameter-types`);
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
    const newParameter = { id: null, name: '', required: false, type: null, description: '' };
    setEditedParameters([...editedParameters, newParameter]);
    setChangedParameters([...changedParameters, editedParameters.length]);
  };

  const handleRemoveParameter = async (index) => {
    const parameterToRemove = editedParameters[index];

    if (parameterToRemove && parameterToRemove.id) {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/api/service-points/${point.id}/parameters/${parameterToRemove.id}`, {
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
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/service-points/${point.id}`, {
        method: 'DELETE',
      });
  
      if (!response.ok) {
        throw new Error('Failed to delete service point');
      }
  
      const updatedServicePointsResponse = await fetch(`${process.env.REACT_APP_API_URL}/api/services/${serviceName}`);
      const updatedServicePointsData = await updatedServicePointsResponse.json();
      setServicePoints(updatedServicePointsData.servicePoints);
      toast.error('Эндпоинт успешно удален!');
    } catch (error) {
      console.error('Error deleting service point:', error);
    }
  };

  const saveChanges = async () => {
    try {
      const updatedParametersToSend = changedParameters.map(index => editedParameters[index]).filter(param => param);

      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/service-points/${point.id}/parameters`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parameters: updatedParametersToSend,
          uri: editedName,
          description: editedDescription
        }),
      });

      if (response.ok) {
        const updatedData = await response.json(); 
      console.log(updatedData);

      const updatedPoint = {
        id: updatedData.service_point.id,
        uri: updatedData.service_point.uri,
        description: updatedData.service_point.description,
        parameters: updatedData.parameters 
      };

      updateServicePoint(point.id, updatedPoint);
        setIsEditing(false);
        setChangedParameters([]);
      } else {
        console.error('Failed to update parameters:', response.statusText);
      }
    } catch (error) {
      console.error('Error updating parameters:', error);
    }
  };

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
        <span className="font-medium">{point.uri}</span>
      </button>
      {isExpanded && (
        <div className="px-6 py-4">
          <h3 className="text-lg font-medium mb-2">{point.description}</h3>
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Required</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Parameter type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Parameter description</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {editedParameters.map((parameter, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap">{parameter.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{parameter.required ? "Required" : "Optional"}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{parameter.type}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{parameter.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button 
            onClick={handleRemoveServicePoint}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Delete service endpoint
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
                <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
                  <button className="float-right text-2xl" onClick={toggleEdit}>&times;</button>
                  <h3 className="text-xl font-bold mb-4">Edit service point</h3>
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
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Description:</label>
                        <textarea 
                          value={editedDescription} 
                          onChange={(e) => setEditedDescription(e.target.value)}
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
                      {editedParameters.map((parameter, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <input
                            type="text"
                            placeholder="Name"
                            value={parameter.name}
                            onChange={(e) => handleParameterChange(index, 'name', e.target.value)}
                            required
                            className="flex-1 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          />
                          <input
                            type="checkbox"
                            checked={parameter.required}
                            onChange={(e) => handleParameterChange(index, 'required', e.target.checked)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <select
                            value={parameter.type}
                            onChange={(e) => handleParameterChange(index, 'type', e.target.value)}
                            required
                            className="border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          >
                            <option value="">Select type</option>
                            {parameterTypes.map(type => (
                              <option key={type.id} value={type.type}>{type.type}</option>
                            ))}
                          </select>
                          <input
                            type="text"
                            placeholder="Description"
                            value={parameter.description}
                            onChange={(e) => handleParameterChange(index, 'description', e.target.value)}
                            required
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
  const [uri, setUri] = useState('');
  const [description, setDescription] = useState('');
  const [parameters, setParameters] = useState([{ name: '', required: false, type: '', description: '' }]);
  const [parameterTypes, setParameterTypes] = useState([]);

  useEffect(() => {
    const fetchParameterTypes = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/api/parameter-types`);
        const data = await response.json();
        setParameterTypes(data);
      } catch (error) {
        console.error('Error fetching parameter types:', error);
      }
    };

    fetchParameterTypes();
  }, []);

  const handleUriChange = (e) => setUri(e.target.value);
  const handleDescriptionChange = (e) => setDescription(e.target.value);
  const handleParameterChange = (index, field, value) => {
    const newParameters = [...parameters];
    newParameters[index][field] = value;
    setParameters(newParameters);
  };

  const handleAddParameter = () => {
    setParameters([...parameters, { name: '', required: false, type: '', description: '' }]);
  };

  const handleRemoveParameter = (index) => {
    setParameters(parameters.filter((_, i) => i !== index));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newEndpoint = {
      uri,
      description,
      parameters
    };
    onAdd(newEndpoint);
    toast.success('Эндпоинт успешно!');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Add New Endpoint</h2>
          <button onClick={onClose} className="text-2xl">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="uri" className="block text-sm font-medium text-gray-700">URI:</label>
            <input 
              type="text" 
              id="uri"
              value={uri} 
              onChange={handleUriChange} 
              required
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description:</label>
            <textarea 
              id="description"
              value={description} 
              onChange={handleDescriptionChange} 
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
                  type="checkbox"
                  checked={parameter.required}
                  onChange={(e) => handleParameterChange(index, 'required', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <select
                  value={parameter.type}
                  onChange={(e) => handleParameterChange(index, 'type', e.target.value)}
                  required
                  className="border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="" disabled>Select type</option>
                  {parameterTypes.map((type, i) => (
                    <option key={i} value={type.type}>{type.type}</option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="Description"
                  value={parameter.description}
                  onChange={(e) => handleParameterChange(index, 'description', e.target.value)}
                  required
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

export default ServiceInfoPage;