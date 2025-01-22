import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ReactComponent as BackIcon } from './back.svg';

const styles = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '20px',
  },
  header: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
    marginBottom: '20px',
    '@media (min-width: 768px)': {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
  },
  searchContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    width: '100%',
    '@media (min-width: 768px)': {
      flexDirection: 'row',
      width: 'auto',
    },
  },
  input: {
    flex: '1',
    padding: '10px',
    borderRadius: '4px',
    border: '1px solid #ccc',
    fontSize: '16px',
  },
  select: {
    flex: '1',
    padding: '10px',
    borderRadius: '4px',
    border: '1px solid #ccc',
    fontSize: '16px',
    backgroundColor: 'white',
  },
  button: {
    padding: '10px 20px',
    borderRadius: '4px',
    border: 'none',
    backgroundColor: '#007bff',
    color: 'white',
    fontSize: '16px',
    cursor: 'pointer',
    transition: 'background-color 0.3s',
    width: '100%',
    '@media (min-width: 768px)': {
      width: 'auto',
    },
    ':hover': {
      backgroundColor: '#0056b3',
    },
  },
  serviceGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
    gap: '20px',
  },
  serviceCard: {
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    overflow: 'hidden',
    transition: 'box-shadow 0.3s',
    display: 'flex',
    flexDirection: 'column',
    height: '100%', // Позволяет карточкам занимать одинаковую высоту
    ':hover': {
      boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
    },
  },
  serviceImage: {
    width: '100%',
    height: '200px',
    objectFit: 'cover',
  },
  serviceContent: {
    padding: '15px',
  },
  serviceName: {
    fontSize: '18px',
    fontWeight: 'bold',
    marginBottom: '5px',
  },
  serviceSource: {
    fontSize: '14px',
    color: '#666',
    marginBottom: '10px',
  },
  serviceDescription: {
    fontSize: '14px',
    color: '#333',
  },
  serviceCategory: {
    fontSize: '14px',
    color: '#333',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
    maxWidth: '500px',
    margin: '0 auto',
    padding: '20px',
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
  },
  fileUpload: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  imagePreview: {
    width: '150px',
    height: '150px',
    objectFit: 'cover',
    borderRadius: '4px',
    marginBottom: '10px',
    cursor: 'pointer',
  },
};

function ServiceCard() {
  const [services, setServices] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredServices, setFilteredServices] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [categories, setCategories] = useState([]);
  const [newService, setNewService] = useState({
    name: '',
    category_id: '',
    image: '',
    uri: '',
    description: ''
  });

  const navigate = useNavigate();
  const [imagePreview, setImagePreview] = useState('add_img.png');

  const fetchData = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/service`);
  
      // Логируем информацию о ответе
      console.log('Response Status:', response.status);
      console.log('Response Headers:', response.headers);
  
      // Проверяем, успешен ли ответ
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
      const data = await response.json();
      console.log('Response Data:', data); // Логируем данные
  
      setServices(data);
      setFilteredServices(data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  useEffect(() => {
    fetchData();
    fetchCategories();
  }, []);

  useEffect(() => {
    const filtered = services.filter(service =>
      service.name && service.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredByCategory = selectedCategory
      ? filtered.filter(service => service.category_name === selectedCategory)
      : filtered;

    setFilteredServices(filteredByCategory);
  }, [searchTerm, services, selectedCategory]);

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/categories`);
      const data = await response.json();
      console.log('Fetched Categories:', data);
      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleChange = event => setSearchTerm(event.target.value);

  const handleCategoryChange = event => setSelectedCategory(event.target.value);

  const handleNewServiceChange = event => {
    const { name, value } = event.target;
    setNewService(prevState => ({ ...prevState, [name]: value }));
  };

  const handleFileChange = event => {
    const file = event.target.files[0];
    setNewService(prevState => ({ ...prevState, image: file }));
    setImagePreview(URL.createObjectURL(file));
  };

  const handleNewServiceSubmit = async event => {
    event.preventDefault();

    const formData = new FormData();
    formData.append('uri', newService.uri);
    formData.append('name', newService.name);
    formData.append('categoryId', parseInt(newService.category_id, 10)); 
    formData.append('description', newService.description);

    // Добавляем изображение только если оно выбрано
    if (newService.image) {
        formData.append('image', newService.image); 
    }

    console.log("Form data:", {
        uri: newService.uri,
        name: newService.name,
        categoryId: newService.category_id,
        description: newService.description,
        image: newService.image ? newService.image.name : 'Не выбрано' // Логируем имя файла или сообщение
    });

    try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/api/services`, {
            method: 'POST',
            body: formData
        });

        if (response.ok) {
            await fetchData();
            setShowForm(false);
            setNewService({ name: '', category_id: '', image: '', uri: '', description: '' });
            setImagePreview('add_img.png');
        } else {
            const errorData = await response.json();
            alert(`Ошибка: ${errorData.detail || 'Неизвестная ошибка'}`);
        }
    } catch (error) {
        console.error('Ошибка при добавлении нового сервиса:', error);
    }
};

  return (
    <div style={styles.container}>
      <div style={styles.header}>
      <div className="flex items-center mb-4 md:mb-0">
        <button onClick={() => navigate('/')} className="mr-4 p-2 rounded-full hover:bg-gray-200 transition-colors">
          <BackIcon className="w-6 h-6" title="Back" />
        </button>
      </div>
        <div style={styles.searchContainer}>
          <input
            type="text"
            placeholder="Поиск..."
            value={searchTerm}
            onChange={handleChange}
            style={styles.input}
          />
          <select value={selectedCategory} onChange={handleCategoryChange} style={styles.select}>
      <option value="">Все категории</option>
      {categories.map(category => (
        <option key={category[0]} value={category[1]}>{category[1]}</option>
      ))}
    </select>
        </div>
        <button style={styles.button} onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Отменить' : 'Добавить сервис'}
        </button>
      </div>

      {showForm && (
        <form style={styles.form} onSubmit={handleNewServiceSubmit}>
          <div style={styles.fileUpload}>
            <img
              src={imagePreview}
              alt="Preview"
              style={styles.imagePreview}
              onClick={() => document.getElementById('file-upload').click()}
            />
            <input
              id="file-upload"
              type="file"
              name="image"
              onChange={handleFileChange}
              accept="image/*"
              style={{ display: 'none' }}
            />
          </div>
          <input
            type="text"
            name="name"
            placeholder="Название"
            value={newService.name}
            onChange={handleNewServiceChange}
            required
            style={styles.input}
          />
          <textarea
            name="description"
            placeholder="Описание"
            value={newService.description}
            onChange={handleNewServiceChange}
            required
            style={{...styles.input, minHeight: '100px'}}
          />
          <select
            name="category_id"
            value={newService.category_id}
            onChange={event => {
              const selectedCategory = categories.find(category => category[0] === parseInt(event.target.value)); // используем category[0] для id
              if (selectedCategory) {
                setNewService(prevState => ({
                  ...prevState,
                  category_id: selectedCategory[0], // используем category[0] для id
                  category_name: selectedCategory[1] // используем category[1] для name
                }));
              }
            }}
            required
            style={styles.select}
          >
            <option value="">Выберите категорию</option>
            {categories.map(category => (
              <option key={category[0]} value={category[0]}>{category[1]}</option> // используем category[0] и category[1]
            ))}
          </select>
          <input
            type="text"
            name="uri"
            placeholder="URL-адрес API"
            value={newService.uri}
            onChange={handleNewServiceChange}
            required
            style={styles.input}
          />
          <button type="submit" style={styles.button}>Добавить</button>
        </form>
      )}

      <div style={styles.serviceGrid}>
        {filteredServices.map(service => (
          <Link key={service.id} to={`/services/${encodeURIComponent(service.name)}`} style={{ textDecoration: 'none', color: 'inherit' }}>
            <div style={styles.serviceCard}>
              <img src={service.image} alt={service.name} style={styles.serviceImage} />
              <div style={styles.serviceContent}>
                <h2 style={styles.serviceName}>{service.name}</h2>
                <p style={styles.serviceSource}>*{service.api_source}</p>
                <p style={styles.serviceDescription}>{service.description}</p>
                <p style={styles.serviceCategory}><b>Категория:</b> {service.category_name}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default ServiceCard;