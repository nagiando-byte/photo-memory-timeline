import { useEffect, useState } from 'react';
import { View, Text, ScrollView, Image, ActivityIndicator } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { eventsApi } from '../../api/events';
import { PhotoGrid } from '../../components/PhotoGrid';
import type { Event } from '../../types';

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [event, setEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadEvent();
  }, [id]);

  const loadEvent = async () => {
    if (!id) return;

    setIsLoading(true);
    try {
      const data = await eventsApi.getEvent(id);
      setEvent(data);
    } catch (error) {
      console.error('Failed to load event:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const weekDays = ['日', '月', '火', '水', '木', '金', '土'];
    const weekDay = weekDays[date.getDay()];
    return `${year}年${month}月${day}日（${weekDay}）`;
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-neutral-50">
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  if (!event) {
    return (
      <View className="flex-1 justify-center items-center bg-neutral-50">
        <Ionicons name="alert-circle-outline" size={48} color="#BDBDBD" />
        <Text className="text-neutral-500 mt-2">イベントが見つかりません</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-neutral-50">
      {/* Cover Image */}
      <View className="h-64 bg-neutral-200">
        {event.coverPhoto ? (
          <Image
            source={{ uri: event.coverPhoto.filePath }}
            className="w-full h-full"
            resizeMode="cover"
          />
        ) : (
          <View className="w-full h-full items-center justify-center">
            <Ionicons name="images-outline" size={64} color="#BDBDBD" />
          </View>
        )}
      </View>

      <View className="p-4">
        {/* Title */}
        <Text className="text-2xl font-bold text-neutral-800">
          {event.title}
        </Text>

        {/* Date and Time */}
        <View className="flex-row items-center mt-3">
          <View className="w-10 h-10 rounded-full bg-primary-50 items-center justify-center">
            <Ionicons name="calendar" size={20} color="#2196F3" />
          </View>
          <View className="ml-3">
            <Text className="text-neutral-800 font-medium">
              {formatDate(event.startTime)}
            </Text>
            <Text className="text-neutral-500">
              {formatTime(event.startTime)} - {formatTime(event.endTime)}
            </Text>
          </View>
        </View>

        {/* Location */}
        {event.location && (
          <View className="flex-row items-center mt-3">
            <View className="w-10 h-10 rounded-full bg-secondary-50 items-center justify-center">
              <Ionicons name="location" size={20} color="#FF9800" />
            </View>
            <View className="ml-3 flex-1">
              <Text className="text-neutral-800 font-medium">
                {event.location.placeName || '場所'}
              </Text>
              {event.location.address && (
                <Text className="text-neutral-500" numberOfLines={2}>
                  {event.location.address}
                </Text>
              )}
            </View>
          </View>
        )}

        {/* Persons */}
        {event.persons && event.persons.length > 0 && (
          <View className="flex-row items-center mt-3">
            <View className="w-10 h-10 rounded-full bg-green-50 items-center justify-center">
              <Ionicons name="people" size={20} color="#4CAF50" />
            </View>
            <View className="ml-3">
              <Text className="text-neutral-800 font-medium">
                {event.persons.length}人
              </Text>
              <Text className="text-neutral-500">
                {event.persons.map((p) => p.name || '名前なし').join(', ')}
              </Text>
            </View>
          </View>
        )}

        {/* Description */}
        {event.description && (
          <View className="mt-4 bg-white rounded-xl p-4">
            <Text className="text-neutral-800">{event.description}</Text>
          </View>
        )}

        {/* Photos */}
        {event.photos && event.photos.length > 0 && (
          <View className="mt-6">
            <Text className="text-lg font-semibold text-neutral-700 mb-3">
              写真（{event.photos.length}枚）
            </Text>
            <PhotoGrid
              photos={event.photos}
              columns={3}
              onPhotoPress={(photo, index) => {
                console.log('Photo pressed:', index);
              }}
            />
          </View>
        )}
      </View>
    </ScrollView>
  );
}
