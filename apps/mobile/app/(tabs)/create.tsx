import {
  View,
  Text,
  TouchableOpacity,
  useColorScheme,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

const contentTypes = [
  {
    id: 'photo',
    name: 'Photo',
    icon: 'camera',
    description: 'Take or upload a photo',
  },
  {
    id: 'video',
    name: 'Video',
    icon: 'videocam',
    description: 'Record or upload a video',
  },
  {
    id: 'story',
    name: 'Story',
    icon: 'albums',
    description: 'Create a story sequence',
  },
  {
    id: 'reel',
    name: 'Reel',
    icon: 'film',
    description: 'Create a short-form video',
  },
];

const aiTools = [
  {
    id: 'script',
    name: 'AI Script',
    icon: 'document-text',
    description: 'Generate video scripts',
  },
  {
    id: 'caption',
    name: 'AI Caption',
    icon: 'chatbubble-ellipses',
    description: 'Generate captions',
  },
  {
    id: 'hashtags',
    name: 'AI Hashtags',
    icon: 'pricetag',
    description: 'Generate hashtags',
  },
  {
    id: 'enhance',
    name: 'AI Enhance',
    icon: 'sparkles',
    description: 'Enhance your content',
  },
];

export default function CreateScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const handleTakePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      alert('Camera permission is required');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      // Navigate to content editor with the image
      router.push({
        pathname: '/content/create',
        params: { uri: result.assets[0].uri, type: 'photo' },
      });
    }
  };

  const handlePickMedia = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      const type = result.assets[0].type === 'video' ? 'video' : 'photo';
      router.push({
        pathname: '/content/create',
        params: { uri: result.assets[0].uri, type },
      });
    }
  };

  return (
    <ScrollView
      className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}
      contentContainerStyle={{ paddingBottom: 100 }}
    >
      {/* Header */}
      <View className="px-4 pt-4 pb-6">
        <Text className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Create Content
        </Text>
        <Text className={`mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          Choose how you want to create your content
        </Text>
      </View>

      {/* Quick Capture */}
      <View className="px-4">
        <Text className={`text-lg font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Quick Capture
        </Text>
        <View className="flex-row">
          <TouchableOpacity
            onPress={handleTakePhoto}
            className="flex-1 mr-2 p-6 bg-primary-600 rounded-xl items-center"
          >
            <Ionicons name="camera" size={32} color="white" />
            <Text className="mt-2 text-white font-semibold">Take Photo</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handlePickMedia}
            className={`flex-1 ml-2 p-6 rounded-xl items-center ${
              isDark ? 'bg-gray-800' : 'bg-white'
            }`}
            style={{ elevation: 2, shadowOpacity: 0.1, shadowRadius: 4 }}
          >
            <Ionicons name="images" size={32} color="#4f46e5" />
            <Text className={`mt-2 font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Upload Media
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Content Types */}
      <View className="mt-8 px-4">
        <Text className={`text-lg font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Content Types
        </Text>
        <View className="flex-row flex-wrap -mx-2">
          {contentTypes.map((type) => (
            <View key={type.id} className="w-1/2 px-2 mb-4">
              <TouchableOpacity
                className={`p-4 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'}`}
                style={{ elevation: 2, shadowOpacity: 0.1, shadowRadius: 4 }}
              >
                <View className="h-12 w-12 rounded-full bg-primary-100 dark:bg-primary-900/30 items-center justify-center mb-3">
                  <Ionicons name={type.icon as never} size={24} color="#4f46e5" />
                </View>
                <Text className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {type.name}
                </Text>
                <Text className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {type.description}
                </Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </View>

      {/* AI Tools */}
      <View className="mt-4 px-4">
        <Text className={`text-lg font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          AI-Powered Tools
        </Text>
        <View className="flex-row flex-wrap -mx-2">
          {aiTools.map((tool) => (
            <View key={tool.id} className="w-1/2 px-2 mb-4">
              <TouchableOpacity
                className={`p-4 rounded-xl border-2 border-dashed ${
                  isDark ? 'border-gray-700' : 'border-gray-200'
                }`}
              >
                <View className="flex-row items-center">
                  <Ionicons
                    name={tool.icon as never}
                    size={20}
                    color={isDark ? '#9ca3af' : '#6b7280'}
                  />
                  <Text className={`ml-2 font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    {tool.name}
                  </Text>
                </View>
                <Text className={`text-xs mt-2 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                  {tool.description}
                </Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </View>

      {/* Tips */}
      <View className="mt-4 px-4">
        <View
          className={`p-4 rounded-xl ${isDark ? 'bg-blue-900/30' : 'bg-blue-50'}`}
        >
          <View className="flex-row items-center mb-2">
            <Ionicons name="bulb" size={20} color="#3b82f6" />
            <Text className="ml-2 font-semibold text-blue-700 dark:text-blue-400">
              Pro Tips
            </Text>
          </View>
          <Text className={`text-sm ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>
            • Use natural lighting for better quality{'\n'}
            • Keep videos between 15-60 seconds{'\n'}
            • Add captions for accessibility{'\n'}
            • Use trending audio for more reach
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}
