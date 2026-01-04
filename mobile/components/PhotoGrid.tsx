import { View, Image, TouchableOpacity, Dimensions } from 'react-native';
import type { Photo, LocalPhoto } from '../types';

interface PhotoGridProps {
  photos: (Photo | LocalPhoto)[];
  columns?: number;
  onPhotoPress?: (photo: Photo | LocalPhoto, index: number) => void;
}

const { width } = Dimensions.get('window');

export function PhotoGrid({ photos, columns = 3, onPhotoPress }: PhotoGridProps) {
  const gap = 2;
  const photoSize = (width - gap * (columns + 1)) / columns;

  const getPhotoUri = (photo: Photo | LocalPhoto): string => {
    if ('thumbnailPath' in photo && photo.thumbnailPath) {
      return photo.thumbnailPath;
    }
    if ('uri' in photo) {
      return photo.uri;
    }
    if ('filePath' in photo) {
      return photo.filePath;
    }
    return '';
  };

  return (
    <View className="flex-row flex-wrap" style={{ gap }}>
      {photos.map((photo, index) => (
        <TouchableOpacity
          key={photo.id}
          onPress={() => onPhotoPress?.(photo, index)}
          activeOpacity={0.8}
        >
          <Image
            source={{ uri: getPhotoUri(photo) }}
            style={{ width: photoSize, height: photoSize }}
            className="bg-neutral-200"
          />
        </TouchableOpacity>
      ))}
    </View>
  );
}
