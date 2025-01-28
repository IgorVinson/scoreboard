import React, {useState} from 'react';
import {TextInput, TouchableOpacity, View} from 'react-native';
import {Button} from '~/components/ui/button';
import {Text} from '~/components/ui/text';
import {AntDesign} from '@expo/vector-icons';
import {Input} from '~/components/ui/input';

export default function LoginScreen() {
  const [credentials, setCredentials] = useState({
    emailOrPhone: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);

  return (
    <View className="flex-1 bg-white p-6">
      <View className="mb-6">
        <Text className="text-2xl font-semibold mb-2">Sign in</Text>
        <Text className="text-sm text-gray-600">Stay updated in your professional world</Text>
      </View>

      <View className="space-y-4">
        <View className="relative">
          <TextInput
            className="h-12 border border-gray-300 rounded px-4 text-base"
            placeholder="Email or Phone"
            value={credentials.emailOrPhone}
            onChangeText={(text) => setCredentials({ ...credentials, emailOrPhone: text })}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <Input/>
        </View>

        <View className="relative">
          <TextInput
            className="h-12 border border-gray-300 rounded px-4 text-base"
            placeholder="Password"
            value={credentials.password}
            onChangeText={(text) => setCredentials({ ...credentials, password: text })}
            secureTextEntry={!showPassword}
          />
          <TouchableOpacity
            className="absolute right-4 top-3.5"
            onPress={() => setShowPassword(!showPassword)}
          >
            <Text className="text-blue-600 text-sm">
              {showPassword ? 'hide' : 'show'}
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={() => {}}>
          <Text className="text-blue-600 text-sm">Forgot password?</Text>
        </TouchableOpacity>

        <Button
          onPress={() => {}}
          className="bg-[#0A66C2] h-12 rounded-full justify-center items-center"
        >
          <Text className="text-white text-base font-semibold">Sign in</Text>
        </Button>

        <Text className="text-center text-gray-600 my-4">or</Text>

        <TouchableOpacity
          className="flex-row h-12 border border-black rounded-full justify-center items-center"
          onPress={() => {}}
        >
          <AntDesign name="apple1" size={20} color="black" className="mr-2" />
          <Text className="text-base font-medium">Sign in with Apple</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}