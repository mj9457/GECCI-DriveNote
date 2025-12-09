// components/vehicle/common/MonthNavigator.tsx
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface MonthNavigatorProps {
    currentDate: Date;
    onChangeMonth: (delta: number) => void;
    onGoToday: () => void;
}

export const MonthNavigator: React.FC<MonthNavigatorProps> = ({
    currentDate,
    onChangeMonth,
    onGoToday,
}) => {
    const today = new Date();
    const isCurrentMonth =
        today.getFullYear() === currentDate.getFullYear() &&
        today.getMonth() === currentDate.getMonth();

    return (
        <div className="flex items-center gap-1 sm:gap-2">
            <button
                onClick={() => onChangeMonth(-1)}
                className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-full"
            >
                <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            {!isCurrentMonth && (
                <button
                    onClick={onGoToday}
                    className="px-2 sm:px-3 py-1 text-[11px] sm:text-xs border rounded-full bg-white text-gray-700 hover:bg-blue-50 hover:border-blue-400"
                >
                    오늘
                </button>
            )}

            <button
                onClick={() => onChangeMonth(1)}
                className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-full"
            >
                <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
        </div>
    );
};
