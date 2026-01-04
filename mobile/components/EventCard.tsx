import { View, Text, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Event } from '../types';

interface EventCardProps {
  event: Event;
  onPress?: () => void;
}

export function EventCard({ event, onPress }: EventCardProps) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${month}/${day} ${hours}:${minutes}`;
  };

  const formatDuration = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffMs = endDate.getTime() - startDate.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (diffHours > 0) {
      return `${diffHours}時間${diffMinutes > 0 ? diffMinutes + '分' : ''}`;
    }
    return `${diffMinutes}分`;
  };

  const getEventTypeIcon = (type?: string): keyof typeof Ionicons.glyphMap => {
    switch (type) {
      case 'meal':
        return 'restaurant';
      case 'travel':
        return 'airplane';
      case 'sports':
        return 'basketball';
      case 'meeting':
        return 'people';
      case 'celebration':
        return 'gift';
      default:
        return 'camera';
    }
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      className="bg-white rounded-xl shadow-sm mb-3 overflow-hidden"
    >
      <View className="flex-row">
        {/* Cover Photo */}
        <View className="w-24 h-24 bg-neutral-200">
          {event.coverPhoto?.thumbnailPath ? (
            <Image
              source={{ uri: event.coverPhoto.thumbnailPath }}
              className="w-full h-full"
              resizeMode="cover"
            />
          ) : (
            <View className="w-full h-full items-center justify-center">
              <Ionicons
                name={getEventTypeIcon(event.eventType)}
                size={32}
                color="#BDBDBD"
              />
            </View>
          )}
        </View>

        {/* Content */}
        <View className="flex-1 p-3">
          <Text className="text-base font-semibold text-neutral-800" numberOfLines={1}>
            {event.title}
          </Text>

          {/* Date and Duration */}
          <View className="flex-row items-center mt-1">
            <Ionicons name="time-outline" size={14} color="#9E9E9E" />
            <Text className="text-neutral-500 text-sm ml-1">
              {formatDate(event.startTime)}
            </Text>
            <Text className="text-neutral-400 text-sm mx-1">•</Text>
            <Text className="text-neutral-500 text-sm">
              {formatDuration(event.startTime, event.endTime)}
            </Text>
          </View>

          {/* Location */}
          {event.location && (
            <View className="flex-row items-center mt-1">
              <Ionicons name="location-outline" size={14} color="#9E9E9E" />
              <Text className="text-neutral-500 text-sm ml-1" numberOfLines={1}>
                {event.location.placeName || event.location.city || '場所不明'}
              </Text>
            </View>
          )}

          {/* Photos count and Persons */}
          <View className="flex-row items-center mt-2">
            {event.photos && event.photos.length > 0 && (
              <View className="flex-row items-center mr-3">
                <Ionicons name="images-outline" size={14} color="#2196F3" />
                <Text className="text-primary-500 text-sm ml-1">
                  {event.photos.length}枚
                </Text>
              </View>
            )}
            {event.persons && event.persons.length > 0 && (
              <View className="flex-row items-center">
                <Ionicons name="people-outline" size={14} color="#FF9800" />
                <Text className="text-secondary-500 text-sm ml-1">
                  {event.persons.length}人
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Arrow */}
        <View className="justify-center pr-3">
          <Ionicons name="chevron-forward" size={20} color="#BDBDBD" />
        </View>
      </View>
    </TouchableOpacity>
  );
}
