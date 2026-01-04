import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore, usePhotoStore, useEventStore } from '../../store';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { localPhotos } = usePhotoStore();
  const { events } = useEventStore();

  const handleLogout = () => {
    Alert.alert(
      'ログアウト',
      'ログアウトしますか？',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: 'ログアウト',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/(auth)/login');
          },
        },
      ]
    );
  };

  const MenuItem = ({
    icon,
    title,
    subtitle,
    onPress,
    danger = false,
  }: {
    icon: string;
    title: string;
    subtitle?: string;
    onPress?: () => void;
    danger?: boolean;
  }) => (
    <TouchableOpacity
      onPress={onPress}
      className="flex-row items-center bg-white px-4 py-4 border-b border-neutral-100"
    >
      <View className={`w-10 h-10 rounded-full items-center justify-center ${danger ? 'bg-red-50' : 'bg-primary-50'}`}>
        <Ionicons
          name={icon as keyof typeof Ionicons.glyphMap}
          size={20}
          color={danger ? '#EF4444' : '#2196F3'}
        />
      </View>
      <View className="flex-1 ml-3">
        <Text className={`font-medium ${danger ? 'text-red-500' : 'text-neutral-800'}`}>
          {title}
        </Text>
        {subtitle && (
          <Text className="text-neutral-500 text-sm">{subtitle}</Text>
        )}
      </View>
      <Ionicons name="chevron-forward" size={20} color="#BDBDBD" />
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 bg-neutral-50">
      {/* User Info */}
      <View className="bg-primary-500 pt-8 pb-12 px-4">
        <View className="flex-row items-center">
          <View className="w-16 h-16 rounded-full bg-white items-center justify-center">
            <Ionicons name="person" size={32} color="#2196F3" />
          </View>
          <View className="ml-4">
            <Text className="text-white text-xl font-bold">
              {user?.name || 'ゲスト'}
            </Text>
            <Text className="text-primary-100">{user?.email}</Text>
          </View>
        </View>
      </View>

      {/* Stats */}
      <View className="flex-row bg-white mx-4 -mt-6 rounded-xl shadow-sm">
        <View className="flex-1 items-center py-4 border-r border-neutral-100">
          <Text className="text-2xl font-bold text-primary-500">
            {localPhotos.length}
          </Text>
          <Text className="text-neutral-500 text-sm">写真</Text>
        </View>
        <View className="flex-1 items-center py-4">
          <Text className="text-2xl font-bold text-secondary-500">
            {events.length}
          </Text>
          <Text className="text-neutral-500 text-sm">イベント</Text>
        </View>
      </View>

      {/* Menu */}
      <View className="mt-6">
        <Text className="text-neutral-500 text-sm px-4 mb-2">設定</Text>

        <MenuItem
          icon="notifications-outline"
          title="通知設定"
          subtitle="プッシュ通知の設定"
        />
        <MenuItem
          icon="shield-outline"
          title="プライバシー"
          subtitle="データの管理"
        />
        <MenuItem
          icon="cloud-outline"
          title="ストレージ"
          subtitle="同期設定とキャッシュ"
        />
        <MenuItem
          icon="help-circle-outline"
          title="ヘルプ"
          subtitle="使い方とFAQ"
        />
      </View>

      <View className="mt-6">
        <MenuItem
          icon="log-out-outline"
          title="ログアウト"
          onPress={handleLogout}
          danger
        />
      </View>

      {/* Version */}
      <View className="items-center mt-8">
        <Text className="text-neutral-400 text-sm">
          Photo Memory Timeline v1.0.0
        </Text>
      </View>
    </View>
  );
}
