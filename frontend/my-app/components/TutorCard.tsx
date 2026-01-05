import { View, Text, Pressable } from 'react-native';
import { router } from 'expo-router';

interface TutorCardProps {
  tutor: {
    id: string | number;
    user: string;
    fee: string | number;
    location: string;
  } | null;
}

export default function TutorCard({ tutor }: TutorCardProps) {
  if (!tutor) {
    return null; // or some placeholder
  }

  return (
    <Pressable
      onPress={() =>
        router.push({
          pathname: '/tutor/[id]',                 // must match your file: app/tutor/[id].tsx
          params: { id: tutor.id.toString() },      // convert to string just in case
        })
      }
      style={{
        padding: 15,
        margin: 10,
        backgroundColor: '#eee',
        borderRadius: 12,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      }}
    >
      <View>
        <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 4 }}>
          {tutor.user}
        </Text>
        <Text>Fee: {tutor.fee}</Text>
        <Text>Location: {tutor.location}</Text>
      </View>
    </Pressable>
  );
}