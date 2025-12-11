// components/vehicle/common/VehicleFilterSelector.tsx
import { VehicleFilter } from '@/types/vehicle';

interface VehicleFilterSelectorProps {
  value: VehicleFilter;
  onChange: (filter: VehicleFilter) => void;
}

export const VehicleFilterSelector: React.FC<VehicleFilterSelectorProps> = ({
  value,
  onChange,
}) => {
  return (
    <div className="flex flex-wrap items-center gap-1.5 text-[11px] sm:text-xs">
      <span className="text-gray-500 mr-1">차량별 보기:</span>

      <button
        type="button"
        onClick={() => onChange('all')}
        className={`px-2 py-0.5 rounded-full border ${
          value === 'all'
            ? 'bg-blue-600 text-white border-blue-600'
            : 'bg-white text-gray-600 border-gray-300'
        }`}
      >
        전체
      </button>

      <button
        type="button"
        onClick={() => onChange('v1')}
        className={`px-2 py-0.5 rounded-full border ${
          value === 'v1'
            ? 'bg-green-600 text-white border-green-600'
            : 'bg-white text-gray-600 border-gray-300'
        }`}
      >
        티볼리
      </button>

      <button
        type="button"
        onClick={() => onChange('v2')}
        className={`px-2 py-0.5 rounded-full border ${
          value === 'v2'
            ? 'bg-purple-600 text-white border-purple-600'
            : 'bg-white text-gray-600 border-gray-300'
        }`}
      >
        카니발
      </button>
    </div>
  );
};
