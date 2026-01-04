import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore, useEventStore, usePhotoStore } from '../../store';
import { requestPermissions, getAllLocalPhotos } from '../../services/photoService';
import { syncPhotos } from '../../services/syncService';
import { CalendarView } from '../../components/CalendarView';
import { EventCard } from '../../components/EventCard';

export default function HomeScreen() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const { events, selectedDate, setSelectedDate, getEventsByDate } = useEventStore();
  const { setSyncing, isSyncing, setSyncProgress, localPhotos, setLocalPhotos } = usePhotoStore();

  const [refreshing, setRefreshing] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);

  useEffect(() => {
    checkAndRequestPermissions();
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/(auth)/login');
    }
  }, [isAuthenticated, router]);

  const checkAndRequestPermissions = async () => {
    const permissions = await requestPermissions();
    setHasPermission(permissions.media);

    if (permissions.media) {
      loadLocalPhotos();
    }
  };

  const loadLocalPhotos = async () => {
    try {
      const photos = await getAllLocalPhotos((loaded, total) => {
        setSyncProgress(loaded, total);
      });
      setLocalPhotos(photos);
    } catch (error) {
      console.error('Failed to load local photos:', error);
    }
  };

  const handleSync = async () => {
    if (!hasPermission) {
      Alert.alert('権限が必要です', '写真ライブラリへのアクセスを許可してください。');
      return;
    }

    setSyncing(true);
    try {
      const result = await syncPhotos((current, total, status) => {
        setSyncProgress(current, total);
      });
      Alert.alert(
        '同期完了',
        `アップロード: ${result.uploaded}枚\nスキップ: ${result.skipped}枚\n失敗: ${result.failed}枚`
      );
    } catch (error) {
      Alert.alert('エラー', error instanceof Error ? error.message : '同期に失敗しました');
    } finally {
      setSyncing(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadLocalPhotos();
    setRefreshing(false);
  }, []);

  const selectedEvents = selectedDate ? getEventsByDate(selectedDate) : [];

  if (!isAuthenticated) {
    return null;
  }

  return (
    <ScrollView
      className="flex-1 bg-neutral-50"
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View className="p-4">
        {/* Header */}
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-2xl font-bold text-neutral-900">
            思い出タイムライン
          </Text>
          <TouchableOpacity
            onPress={handleSync}
            disabled={isSyncing}
            className="bg-primary-500 px-4 py-2 rounded-lg flex-row items-center"
          >
            <Ionicons
              name={isSyncing ? 'sync' : 'cloud-upload'}
              size={20}
              color="white"
            />
            <Text className="text-white ml-2 font-medium">
              {isSyncing ? '同期中...' : '同期'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View className="flex-row justify-around bg-white rounded-xl p-4 mb-4 shadow-sm">
          <View className="items-center">
            <Text className="text-2xl font-bold text-primary-500">
              {localPhotos.length}
            </Text>
            <Text className="text-neutral-500 text-sm">ローカル写真</Text>
          </View>
          <View className="items-center">
            <Text className="text-2xl font-bold text-secondary-500">
              {events.length}
            </Text>
            <Text className="text-neutral-500 text-sm">イベント</Text>
          </View>
        </View>

        {/* Calendar */}
        <CalendarView
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          events={events}
        />

        {/* Events for selected date */}
        <View className="mt-6">
          <Text className="text-lg font-semibold text-neutral-700 mb-3">
            {selectedDate || '今日'}のイベント
          </Text>

          {selectedEvents.length > 0 ? (
            selectedEvents.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                onPress={() => router.push(`/event/${event.id}`)}
              />
            ))
          ) : (
            <View className="bg-white rounded-xl p-6 items-center">
              <Ionicons name="calendar-outline" size={48} color="#BDBDBD" />
              <Text className="text-neutral-500 mt-2">
                この日のイベントはありません
              </Text>
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
}
