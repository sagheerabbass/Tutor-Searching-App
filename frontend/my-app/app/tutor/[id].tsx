import { View, Text, Button, TextInput } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import api from '../../hooks/api';

export default function TutorDetail() {
  const { id } = useLocalSearchParams();
  const [tutor, setTutor] = useState<any>(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    api.get(`/tutors/${id}/`).then(res => setTutor(res.data));
  }, []);

  const bookTutor = async () => {
    await api.post('/bookings/', {
      tutor: tutor.user_id,
      subject: tutor.subjects[0].id,
      message,
    });
    alert('Booking request sent!');
  };

  if (!tutor) return null;

  return (
    <View className="p-4">
      <Text className="text-xl font-bold">{tutor.user}</Text>
      <Text>{tutor.bio}</Text>
      <Text>Fee: {tutor.fee}</Text>

      <TextInput
        placeholder="Message to tutor"
        className="border p-2 my-3"
        onChangeText={setMessage}
      />

      <Button title="Book Tutor" onPress={bookTutor} />
    </View>
  );
}
