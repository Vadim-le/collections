import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import placeholderImage from '../flyCaptcha.jpg';
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
  },
  searchContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    width: '100%',
  },
  input: {
    flex: '1',
    padding: '10px',
    borderRadius: '4px',
    border: '1px solid #ccc',
    fontSize: '16px',
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
    textAlign: 'center',
    alignItems: 'center',
  },
  serviceImage: {
    width: '70%',
    height: '150px',
    objectFit: 'cover',
    borderRadius: '8px',
    transition: 'transform 0.3s, box-shadow 0.3s',
    margin: '0 auto',
  },
  serviceName: {
    fontSize: '18px',
    fontWeight: 'bold',
    margin: '10px 0 5px 0',
  },
  serviceDescription: {
    fontSize: '14px',
    color: '#333',
    padding: '0 10px',
  },
};

function ComponentCard() {
  const [components, setComponents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [newComponent, setNewComponent] = useState({
    name: '',
    description: ''
  });

  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/components`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setComponents(data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleChange = event => setSearchTerm(event.target.value);

  const handleNewComponentChange = event => {
    const { name, value } = event.target;
    setNewComponent(prevState => ({ ...prevState, [name]: value }));
  };

  const handleNewComponentSubmit = async event => {
    event.preventDefault();
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/components`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newComponent),
      });

      if (response.ok) {
        await fetchData();
        setShowForm(false);
        setNewComponent({ name: '', description: '' });
      } else {
        console.error('Error adding new component:', response.statusText);
      }
    } catch (error) {
      console.error('Error adding new component:', error);
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
          <button onClick={() => setShowForm(!showForm)} style={styles.button}>
            {showForm ? 'Отменить' : 'Добавить компонент'}
          </button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleNewComponentSubmit} style={styles.form}>
          <input
            type="text"
            name="name"
            placeholder="Название"
            value={newComponent.name}
            onChange={handleNewComponentChange}
            required
            style={styles.input}
          />
          <textarea
            name="description"
            placeholder="Описание"
            value={newComponent.description}
            onChange={handleNewComponentChange}
            required
            style={styles.input}
          />
          <button type="submit" style={styles.button}>Добавить</button>
        </form>
      )}

      <div style={styles.serviceGrid}>
        {components
          .filter(component => component.name.toLowerCase().includes(searchTerm.toLowerCase()))
          .map(component => (
            <Link key={component.id} to={`/components/${component.id}`} style={styles.serviceCard}>
              <img src={placeholderImage} alt="Заглушка" style={styles.serviceImage} />
              <h2 style={styles.serviceName}>{component.name}</h2>
              <p style={styles.serviceDescription}>{component.description}</p>
            </Link>
          ))}
      </div>
    </div>
  );
}

export default ComponentCard;