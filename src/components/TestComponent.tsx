import React, { useState } from 'react';

const TestComponent: React.FC = () => {
  const [count, setCount] = useState(0);

  return (
    <div className="card p-6 my-4 text-center">
      <h2 className="text-xl font-bold mb-4">Componente React de Prueba</h2>
      <p className="mb-4">Este componente demuestra que la integración de React con Astro funciona correctamente.</p>
      <div className="flex items-center justify-center gap-4">
        <button 
          onClick={() => setCount(count - 1)}
          className="btn btn-secondary"
        >
          -
        </button>
        <span className="text-xl font-bold">{count}</span>
        <button 
          onClick={() => setCount(count + 1)}
          className="btn btn-primary"
        >
          +
        </button>
      </div>
    </div>
  );
};

export default TestComponent;
