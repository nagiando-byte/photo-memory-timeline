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
  ScrollView,
} from 'react-native';
import { useRouter, Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store';
import { authApi } from '../../api/auth';

export default function RegisterScreen() {
  const router = useRouter();
  const { login } = useAuthStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async () => {
    if (!name || !email || !password || !confirmPassword) {
      Alert.alert('エラー', 'すべての項目を入力してください');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('エラー', 'パスワードが一致しません');
      return;
    }

    if (password.length < 8) {
      Alert.alert('エラー', 'パスワードは8文字以上で入力してください');
      return;
    }

    setIsLoading(true);
    try {
      const response = await authApi.register({ name, email, password });
      await login(response.user, response.token);
      router.replace('/(tabs)');
    } catch (error) {
      Alert.alert('登録エラー', '登録に失敗しました。別のメールアドレスをお試しください');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-white"
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-1 justify-center px-6 py-8">
          {/* Header */}
          <View className="items-center mb-8">
            <View className="w-16 h-16 bg-primary-500 rounded-full items-center justify-center mb-4">
              <Ionicons name="person-add" size={32} color="white" />
            </View>
            <Text className="text-2xl font-bold text-neutral-800">
              アカウント作成
            </Text>
            <Text className="text-neutral-500 mt-2">
              思い出の整理を始めましょう
            </Text>
          </View>

          {/* Form */}
          <View className="space-y-4">
            <View>
              <Text className="text-neutral-600 mb-2 font-medium">お名前</Text>
              <View className="flex-row items-center bg-neutral-100 rounded-xl px-4">
                <Ionicons name="person-outline" size={20} color="#9E9E9E" />
                <TextInput
                  className="flex-1 py-4 px-3 text-neutral-800"
                  placeholder="山田 太郎"
                  placeholderTextColor="#9E9E9E"
                  value={name}
                  onChangeText={setName}
                />
              </View>
            </View>

            <View className="mt-4">
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
                  placeholder="8文字以上"
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

            <View className="mt-4">
              <Text className="text-neutral-600 mb-2 font-medium">
                パスワード（確認）
              </Text>
              <View className="flex-row items-center bg-neutral-100 rounded-xl px-4">
                <Ionicons name="lock-closed-outline" size={20} color="#9E9E9E" />
                <TextInput
                  className="flex-1 py-4 px-3 text-neutral-800"
                  placeholder="パスワードを再入力"
                  placeholderTextColor="#9E9E9E"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showPassword}
                />
              </View>
            </View>

            <TouchableOpacity
              onPress={handleRegister}
              disabled={isLoading}
              className="bg-primary-500 py-4 rounded-xl items-center mt-6"
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white font-bold text-lg">登録</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Login Link */}
          <View className="flex-row justify-center mt-8">
            <Text className="text-neutral-500">アカウントをお持ちの方は</Text>
            <Link href="/(auth)/login" asChild>
              <TouchableOpacity>
                <Text className="text-primary-500 font-medium ml-1">ログイン</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
