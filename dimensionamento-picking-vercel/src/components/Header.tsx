import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="bg-slate-800 text-white p-4 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        <h1 className="text-2xl font-bold">Dimensionamento de Picking</h1>
        <nav>
          <ul className="flex space-x-4">
            <li className="hover:text-blue-300 cursor-pointer">Dashboard</li>
            <li className="hover:text-blue-300 cursor-pointer">Base de Dados</li>
            <li className="hover:text-blue-300 cursor-pointer">Parâmetros</li>
            <li className="hover:text-blue-300 cursor-pointer">Simulação</li>
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header;
