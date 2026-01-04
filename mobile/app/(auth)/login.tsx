import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter, Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store';
import { authApi } from '../../api/auth';

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('エラー', 'メールアドレスとパスワードを入力してください');
      return;
    }

    setIsLoading(true);
    try {
      const response = await authApi.login({ email, password });
      await login(response.user, response.token);
      router.replace('/(tabs)');
    } catch (error) {
      Alert.alert(
        'ログインエラー',
        'メールアドレスまたはパスワードが正しくありません'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Demo login for development
  const handleDemoLogin = async () => {
    setIsLoading(true);
    try {
      // Simulate login for demo
      await login(
        {
          id: 'demo-user',
          email: 'demo@example.com',
          name: 'デモユーザー',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        'demo-token'
      );
      router.replace('/(tabs)');
    } catch (error) {
      Alert.alert('エラー', 'デモログインに失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-white"
    >
      <View className="flex-1 justify-center px-6">
        {/* Logo */}
        <View className="items-center mb-12">
          <View className="w-20 h-20 bg-primary-500 rounded-full items-center justify-center mb-4">
            <Ionicons name="images" size={40} color="white" />
          </View>
          <Text className="text-2xl font-bold text-neutral-800">
            Photo Memory Timeline
          </Text>
          <Text className="text-neutral-500 mt-2">
            思い出を自動整理
          </Text>
        </View>

        {/* Form */}
        <View className="space-y-4">
          <View>
            <Text className="text-neutral-600 mb-2 font-medium">
              メールアドレス
            </Text>
            <View className="flex-row items-center bg-neutral-100 rounded-xl px-4">
              <Ionicons name="mail-outline" size={20} color="#9E9E9E" />
              <TextInput
                className="flex-1 py-4 px-3 text-neutral-800"
                placeholder="example@email.com"
                placeholderTextColor="#9E9E9E"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          <View className="mt-4">
            <Text className="text-neutral-600 mb-2 font-medium">パスワード</Text>
            <View className="flex-row items-center bg-neutral-100 rounded-xl px-4">
              <Ionicons name="lock-closed-outline" size={20} color="#9E9E9E" />
              <TextInput
                className="flex-1 py-4 px-3 text-neutral-800"
                placeholder="パスワードを入力"
                placeholderTextColor="#9E9E9E"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color="#9E9E9E"
                />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            onPress={handleLogin}
            disabled={isLoading}
            className="bg-primary-500 py-4 rounded-xl items-center mt-6"
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-bold text-lg">ログイン</Text>
            )}
          </TouchableOpacity>

          {/* Demo Login */}
          <TouchableOpacity
            onPress={handleDemoLogin}
            disabled={isLoading}
            className="bg-neutral-200 py-4 rounded-xl items-center mt-2"
          >
            <Text className="text-neutral-700 font-medium">
              デモモードで試す
            </Text>
          </TouchableOpacity>
        </View>

        {/* Register Link */}
        <View className="flex-row justify-center mt-8">
          <Text className="text-neutral-500">アカウントをお持ちでない方は</Text>
          <Link href="/(auth)/register" asChild>
            <TouchableOpacity>
              <Text className="text-primary-500 font-medium ml-1">登録</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
