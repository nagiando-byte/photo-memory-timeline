import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePhotoStore } from '../../store';
import { getAllLocalPhotos, groupPhotosByMonth } from '../../services/photoService';
import type { LocalPhoto } from '../../types';

const { width } = Dimensions.get('window');
const PHOTO_SIZE = (width - 32 - 8) / 3; // 3 columns with padding

interface PhotoSection {
  title: string;
  data: LocalPhoto[];
}

export default function PhotosScreen() {
  const { localPhotos, setLocalPhotos, setSyncProgress } = usePhotoStore();
  const [refreshing, setRefreshing] = useState(false);
  const [sections, setSections] = useState<PhotoSection[]>([]);

  useEffect(() => {
    if (localPhotos.length === 0) {
      loadPhotos();
    } else {
      groupPhotos();
    }
  }, [localPhotos]);

  const loadPhotos = async () => {
    try {
      const photos = await getAllLocalPhotos((loaded, total) => {
        setSyncProgress(loaded, total);
      });
      setLocalPhotos(photos);
    } catch (error) {
      console.error('Failed to load photos:', error);
    }
  };

  const groupPhotos = () => {
    const grouped = groupPhotosByMonth(localPhotos);
    const sortedSections: PhotoSection[] = [];

    // Sort by date descending
    const sortedKeys = Array.from(grouped.keys()).sort((a, b) => b.localeCompare(a));

    for (const key of sortedKeys) {
      const [year, month] = key.split('-');
      sortedSections.push({
        title: `${year}年${parseInt(month)}月`,
        data: grouped.get(key) || [],
      });
    }

    setSections(sortedSections);
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadPhotos();
    setRefreshing(false);
  }, []);

  const renderPhoto = ({ item }: { item: LocalPhoto }) => (
    <TouchableOpacity className="m-0.5">
      <Image
        source={{ uri: item.uri }}
        style={{ width: PHOTO_SIZE, height: PHOTO_SIZE }}
        className="rounded-sm"
      />
    </TouchableOpacity>
  );

  const renderSection = ({ item }: { item: PhotoSection }) => (
    <View className="mb-4">
      <Text className="text-lg font-semibold text-neutral-700 mb-2 px-4">
        {item.title} ({item.data.length}枚)
      </Text>
      <FlatList
        data={item.data}
        renderItem={renderPhoto}
        keyExtractor={(photo) => photo.id}
        numColumns={3}
        scrollEnabled={false}
        contentContainerStyle={{ paddingHorizontal: 12 }}
      />
    </View>
  );

  return (
    <View className="flex-1 bg-neutral-50">
      {sections.length > 0 ? (
        <FlatList
          data={sections}
          renderItem={renderSection}
          keyExtractor={(item) => item.title}
          contentContainerStyle={{ paddingVertical: 16 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      ) : (
        <View className="flex-1 justify-center items-center">
          <Ionicons name="images-outline" size={64} color="#BDBDBD" />
          <Text className="text-neutral-500 mt-4 text-lg">
            写真がありません
          </Text>
          <Text className="text-neutral-400 mt-1 text-center px-8">
            写真ライブラリへのアクセスを許可してください
          </Text>
          <TouchableOpacity
            onPress={loadPhotos}
            className="mt-4 bg-primary-500 px-6 py-3 rounded-lg"
          >
            <Text className="text-white font-medium">写真を読み込む</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
