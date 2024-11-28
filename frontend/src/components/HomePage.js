import React from 'react';
import { Link } from 'react-router-dom';

const HomePage = () => {
  return (
    <div className="home-container">
      <div className="card-container">
        <Link to="/services" className="card">
          <h2>Коллекция сервисов</h2>
          <p>Перейти к сервисам</p>
        </Link>
        <Link to="/components" className="card">
          <h2>Коллекция компонентов</h2>
          <p>Перейти к компонентам</p>
        </Link>
      </div>
      <style jsx>{`
        .home-container {
          text-align: center;
          padding: 2rem;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          justify-content: center;
          background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
        }
        .title {
          font-size: 2.5rem;
          color: #333;
          margin-bottom: 2rem;
          text-shadow: 2px 2px 4px rgba(0,0,0,0.1);
        }
        .card-container {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 2rem;
        }
        .card {
          background-color: rgba(255, 255, 255, 0.8);
          border-radius: 15px;
          padding: 2rem;
          text-decoration: none;
          color: #333;
          width: 100%;
          max-width: 400px;
          transition: all 0.3s ease;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .card:hover {
          transform: translateY(-5px);
          box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
        }
        .card h2 {
          font-size: 1.5rem;
          margin-bottom: 0.5rem;
          color: #2c3e50;
        }
        .card p {
          font-size: 1rem;
          color: #7f8c8d;
        }
        @media (max-width: 768px) {
          .title {
            font-size: 2rem;
          }
          .card {
            padding: 1.5rem;
          }
        }
        @media (max-width: 480px) {
          .home-container {
            padding: 1rem;
          }
          .title {
            font-size: 1.8rem;
          }
          .card {
            padding: 1rem;
          }
        }
      `}</style>
    </div>
  );
};

export default HomePage;

