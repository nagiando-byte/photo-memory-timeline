import { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useEventStore } from '../../store';
import { eventsApi } from '../../api/events';
import { EventCard } from '../../components/EventCard';
import type { Event } from '../../types';

export default function TimelineScreen() {
  const router = useRouter();
  const { events, setEvents, setLoading, isLoading } = useEventStore();
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());

  const months = [
    '1月', '2月', '3月', '4月', '5月', '6月',
    '7月', '8月', '9月', '10月', '11月', '12月',
  ];

  useEffect(() => {
    loadEvents();
  }, [selectedYear, selectedMonth]);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const data = await eventsApi.getEventsByMonth(selectedYear, selectedMonth + 1);
      setEvents(data);
    } catch (error) {
      console.error('Failed to load events:', error);
    } finally {
      setLoading(false);
    }
  };

  const goToPreviousMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  const renderEvent = ({ item }: { item: Event }) => (
    <EventCard
      event={item}
      onPress={() => router.push(`/event/${item.id}`)}
    />
  );

  return (
    <View className="flex-1 bg-neutral-50">
      {/* Month Selector */}
      <View className="bg-white px-4 py-3 flex-row justify-between items-center border-b border-neutral-200">
        <TouchableOpacity onPress={goToPreviousMonth} className="p-2">
          <Ionicons name="chevron-back" size={24} color="#616161" />
        </TouchableOpacity>

        <Text className="text-lg font-semibold text-neutral-800">
          {selectedYear}年 {months[selectedMonth]}
        </Text>

        <TouchableOpacity onPress={goToNextMonth} className="p-2">
          <Ionicons name="chevron-forward" size={24} color="#616161" />
        </TouchableOpacity>
      </View>

      {/* Events List */}
      {isLoading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#2196F3" />
          <Text className="text-neutral-500 mt-2">読み込み中...</Text>
        </View>
      ) : events.length > 0 ? (
        <FlatList
          data={events}
          renderItem={renderEvent}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16 }}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View className="flex-1 justify-center items-center">
          <Ionicons name="images-outline" size={64} color="#BDBDBD" />
          <Text className="text-neutral-500 mt-4 text-lg">
            この月のイベントはありません
          </Text>
          <Text className="text-neutral-400 mt-1 text-center px-8">
            写真を同期すると、自動的にイベントが検出されます
          </Text>
        </View>
      )}
    </View>
  );
}
