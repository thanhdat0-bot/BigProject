import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, TouchableOpacity } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { authApi, endpoints } from '../../configs/Apis';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

export default function NoteDetail() {
  const route = useRoute();
  const navigation = useNavigation();
  const { noteId } = route.params;

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <TouchableOpacity style={{ marginLeft: 15 }} onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={26} color="#FFD600" />
        </TouchableOpacity>
      ),
      title: "Chi tiết ghi chú",
      headerTitleAlign: 'center',
      headerTintColor: "#FFD600",
      headerTitleStyle: { color: "#FFD600", fontWeight: "bold", fontSize: 20 }
    });
  }, [navigation]);

  const [note, setNote] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNoteDetail = async () => {
      setLoading(true);
      try {
        const token = await AsyncStorage.getItem('access_token');
        const res = await authApi(token).get(endpoints.noteDetail(noteId));
        setNote(res.data);
      } catch (err) {
        setNote(null);
      } finally {
        setLoading(false);
      }
    };
    fetchNoteDetail();
  }, [noteId]);

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#FFD600" /></View>
  }

  if (!note) {
    return <View style={styles.center}><Text style={{ color: "#FFD600" }}>Không tìm thấy ghi chú.</Text></View>
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 24 }}>
      <View style={styles.box}>
        <View style={styles.row}>
          <Icon name="note-text" size={30} color="#FFD600" />
          <Text style={styles.titleText}>{note.title || "(Không tiêu đề)"}</Text>
        </View>
        <Text style={styles.content}>
          {note.content || "(Không có nội dung)"}
        </Text>
        <View style={styles.infoRow}>
          <Icon name={note.is_pinned ? "pin" : "pin-off"} size={22} color="#FFD600" />
          <Text style={styles.infoLabel}>Trạng thái ghim: </Text>
          <Text style={styles.infoText}>{note.is_pinned ? "Đã ghim" : "Chưa ghim"}</Text>
        </View>
        {note.updated_at && (
          <View style={styles.infoRow}>
            <Icon name="clock-edit-outline" size={22} color="#FFD600" />
            <Text style={styles.infoLabel}>Cập nhật: </Text>
            <Text style={styles.infoText}>{new Date(note.updated_at).toLocaleString()}</Text>
          </View>
        )}
        {note.created_at && (
          <View style={styles.infoRow}>
            <Icon name="clock-outline" size={22} color="#FFD600" />
            <Text style={styles.infoLabel}>Tạo lúc: </Text>
            <Text style={styles.infoText}>{new Date(note.created_at).toLocaleString()}</Text>
          </View>
        )}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#181818", padding: 18 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#181818" },
  box: {
    backgroundColor: "#232323",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1.2,
    borderColor: "#FFD600",
    shadowColor: "#FFD60044",
    shadowOpacity: 0.09,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2
  },
  row: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  titleText: { color: "#FFD600", fontSize: 20, fontWeight: "bold", marginLeft: 12, flex: 1, flexWrap: "wrap" },
  content: { fontSize: 16, color: "#FFD600", marginBottom: 16, fontStyle: "italic" },
  infoRow: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  infoLabel: { color: "#FFD600", fontWeight: "bold", marginLeft: 7 },
  infoText: { color: "#FFD600", marginLeft: 3, flex: 1, flexWrap: 'wrap' }
});