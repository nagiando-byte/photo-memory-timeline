import { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Event } from '../types';

interface CalendarViewProps {
  selectedDate: string | null;
  onSelectDate: (date: string) => void;
  events: Event[];
}

export function CalendarView({
  selectedDate,
  onSelectDate,
  events,
}: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();

  const weekDays = ['日', '月', '火', '水', '木', '金', '土'];
  const months = [
    '1月', '2月', '3月', '4月', '5月', '6月',
    '7月', '8月', '9月', '10月', '11月', '12月',
  ];

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const getEventsForDate = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return events.filter((event) => {
      const eventDate = new Date(event.startTime).toISOString().split('T')[0];
      return eventDate === dateStr;
    });
  };

  const renderDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const isSelected = selectedDate === dateStr;
    const isToday = dateStr === new Date().toISOString().split('T')[0];
    const dayEvents = getEventsForDate(day);
    const hasEvents = dayEvents.length > 0;

    return (
      <TouchableOpacity
        key={day}
        onPress={() => onSelectDate(dateStr)}
        className={`w-10 h-10 items-center justify-center rounded-full ${
          isSelected
            ? 'bg-primary-500'
            : isToday
            ? 'bg-primary-100'
            : ''
        }`}
      >
        <Text
          className={`text-sm ${
            isSelected
              ? 'text-white font-bold'
              : isToday
              ? 'text-primary-700 font-bold'
              : 'text-neutral-800'
          }`}
        >
          {day}
        </Text>
        {hasEvents && !isSelected && (
          <View className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-secondary-500" />
        )}
      </TouchableOpacity>
    );
  };

  const renderCalendarDays = () => {
    const days = [];

    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<View key={`empty-${i}`} className="w-10 h-10" />);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(renderDay(day));
    }

    return days;
  };

  return (
    <View className="bg-white rounded-xl p-4 shadow-sm">
      {/* Header */}
      <View className="flex-row justify-between items-center mb-4">
        <TouchableOpacity onPress={goToPreviousMonth} className="p-2">
          <Ionicons name="chevron-back" size={24} color="#616161" />
        </TouchableOpacity>

        <Text className="text-lg font-semibold text-neutral-800">
          {year}年 {months[month]}
        </Text>

        <TouchableOpacity onPress={goToNextMonth} className="p-2">
          <Ionicons name="chevron-forward" size={24} color="#616161" />
        </TouchableOpacity>
      </View>

      {/* Week days header */}
      <View className="flex-row justify-around mb-2">
        {weekDays.map((day, index) => (
          <View key={day} className="w-10 items-center">
            <Text
              className={`text-sm font-medium ${
                index === 0 ? 'text-red-500' : index === 6 ? 'text-blue-500' : 'text-neutral-500'
              }`}
            >
              {day}
            </Text>
          </View>
        ))}
      </View>

      {/* Calendar grid */}
      <View className="flex-row flex-wrap justify-around">
        {renderCalendarDays()}
      </View>
    </View>
  );
}
