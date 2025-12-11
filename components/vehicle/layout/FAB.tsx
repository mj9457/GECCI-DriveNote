import React from 'react';

interface FABProps {
  visible: boolean;
  onClick: () => void;
}

export const FAB: React.FC<FABProps> = ({ visible, onClick }) => {
  if (!visible) return null;
  return (
    <button
      onClick={onClick}
      className="fixed sm:absolute bottom-4 right-4 sm:bottom-6 sm:right-6 w-12 h-12 sm:w-14 sm:h-14 bg-blue-600 text-white rounded-full shadow-xl flex items-center justify-center hover:bg-blue-700 hover:scale-110 transition-all z-50 group"
    >
      <span className="text-2xl sm:text-3xl leading-none group-hover:rotate-90 transition-transform duration-300">
        +
      </span>
    </button>
  );
};

export default FAB;
