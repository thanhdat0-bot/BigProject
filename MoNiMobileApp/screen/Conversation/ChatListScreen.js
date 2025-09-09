import React, { useEffect, useState, useLayoutEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  Image,
  StyleSheet,
  Modal,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { db } from "../../configs/firebaseConfig";
import { collection, query, getDocs, orderBy, limit, doc, setDoc, serverTimestamp } from "firebase/firestore";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authApi, endpoints } from '../../configs/Apis';
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

const DEFAULT_AVATAR = "https://ui-avatars.com/api/?background=FFD600&color=181818&name=U";

function normalizeUserId(id) {
  return id ? id.toString().trim().toLowerCase() : "";
}

function makeConversationId(id1, id2) {
  const a = normalizeUserId(id1);
  const b = normalizeUserId(id2);
  if (!a || !b) throw new Error("Thiếu userId khi tạo phòng chat!");
  return [a, b].sort().join("_");
}

// Hàm lấy profile receiver từ username (ID)
const fetchReceiverProfile = async (receiverId) => {
  try {
    const token = await AsyncStorage.getItem('access_token');
    const res = await authApi(token).get(endpoints.profileDetail(receiverId));
    return res.data.avatar || DEFAULT_AVATAR;
  } catch {
    return DEFAULT_AVATAR;
  }
};

export default function ChatListScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const rawUserId = route.params?.userId || '';
  const userId = normalizeUserId(rawUserId);

  const [search, setSearch] = useState("");
  const [conversations, setConversations] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [newReceiverId, setNewReceiverId] = useState("");
  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  useEffect(() => {
    let isActive = true;
    const fetchProfile = async () => {
      setLoadingProfile(true);
      try {
        const token = await AsyncStorage.getItem('access_token');
        if (token) {
          const res = await authApi(token).get(endpoints.profile);
          if (isActive) setProfile(res.data);
        }
      } catch (err) {
        if (isActive) setProfile(null);
      } finally {
        if (isActive) setLoadingProfile(false);
      }
    };
    fetchProfile();
    return () => { isActive = false; };
  }, []);

  // Setup header: title + nút "+"
  useLayoutEffect(() => {
    navigation.setOptions({
      title: "Đoạn chat",
      headerRight: () => (
        <TouchableOpacity style={styles.headerIconBtn} onPress={() => setShowModal(true)}>
          <Icon name="plus" size={26} color="#FFD600" />
        </TouchableOpacity>
      ),
      headerTitleStyle: { fontWeight: 'bold', color: "#FFD600", fontSize: 21, textAlign: 'center' },
      headerStyle: { backgroundColor: "#181818" },
      headerTintColor: "#FFD600",
      headerTitleAlign: 'center'
    });
  }, [navigation]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchConversations();
    });
    return unsubscribe;
  }, [userId, navigation]);

  // FIX: lấy avatar người nhận từ tin nhắn gần nhất của receiver, không phải tin nhắn cuối cùng
  const fetchConversations = async () => {
    if (!userId) {
      Alert.alert("Lỗi", "Không có thông tin tài khoản! Vui lòng đăng nhập lại.");
      return;
    }
    const q = query(collection(db, "chats"));
    const snapshot = await getDocs(q);
    const results = [];
    for (let docItem of snapshot.docs) {
      const convId = docItem.id;
      const users = convId.split("_").map(normalizeUserId);
      if (users.length === 2 && users.includes(userId)) {
        const otherId = users.find(u => u !== userId);
        const chatDoc = docItem.data();
        let receiverAvatar = chatDoc.receiverAvatar || DEFAULT_AVATAR;

        // Lấy 10 tin nhắn gần nhất để check avatar của receiver
        const msgQuery = query(
          collection(db, "chats", convId, "messages"),
          orderBy("timestamp", "desc"),
          limit(10)
        );
        const msgSnap = await getDocs(msgQuery);

        let lastMsg = "";
        let lastTime = null;
        let latestReceiverMsgAvatar = null;
        let latestReceiverMsgTime = null;
        let firstMsgLoaded = false;

        if (msgSnap.docs.length > 0) {
          for (let msgDoc of msgSnap.docs) {
            const data = msgDoc.data();

            // Lấy tin nhắn mới nhất để hiển thị nội dung và thời gian
            if (!firstMsgLoaded) {
              lastMsg = data.text || "";
              lastTime = data.timestamp?.toDate ? data.timestamp.toDate() : null;
              firstMsgLoaded = true;
            }

            // Nếu là tin nhắn của receiver thì lưu lại avatar và thời gian
            if (normalizeUserId(data.senderId) === otherId && data.avatarUrl && !latestReceiverMsgAvatar) {
              latestReceiverMsgAvatar = data.avatarUrl;
              latestReceiverMsgTime = data.timestamp?.toDate ? data.timestamp.toDate() : null;
            }
          }
          if (latestReceiverMsgAvatar) {
            receiverAvatar = latestReceiverMsgAvatar;
          }
        }

        results.push({
          convId,
          receiver: { id: otherId, name: otherId, avatar: receiverAvatar },
          lastMsg,
          lastTime,
        });
      }
    }
    setConversations(results);
  };

  useEffect(() => {
    fetchConversations();
    // eslint-disable-next-line
  }, [userId]);

  const filtered = conversations.filter(c =>
    c.receiver.name.toLowerCase().includes(search.toLowerCase()) ||
    c.receiver.id.toLowerCase().includes(search.toLowerCase())
  );

  const sortedConversations = filtered.sort((a, b) => {
    if (!a.lastTime && !b.lastTime) return 0;
    if (!a.lastTime) return 1;
    if (!b.lastTime) return -1;
    return b.lastTime - a.lastTime;
  });

  const handleStartChat = async () => {
    const normalizedReceiver = normalizeUserId(newReceiverId);
    if (!userId || !userId.trim()) {
      Alert.alert("Lỗi", "Không có userId, vui lòng đăng nhập lại!");
      return;
    }
    if (!normalizedReceiver) {
      Alert.alert("Bạn phải nhập username người nhận!");
      return;
    }

    // Lấy avatar của người nhận từ API
    const receiverAvatar = await fetchReceiverProfile(normalizedReceiver);

    // Tạo document phòng chat, lưu cả avatar của receiver
    const convId = makeConversationId(userId, normalizedReceiver);
    const convRef = doc(db, "chats", convId);
    await setDoc(convRef, {
      createdAt: serverTimestamp(),
      users: [userId, normalizedReceiver],
      receiverAvatar: receiverAvatar
    }, { merge: true });

    setShowModal(false);
    navigation.navigate("ChatScreen", {
      senderId: userId,
      receiverId: normalizedReceiver,
      receiverName: newReceiverId.trim(),
      senderAvatar: profile?.avatar || DEFAULT_AVATAR,
      receiverAvatar: receiverAvatar
    });
    setNewReceiverId("");
  };

  if (loadingProfile) {
    return <ActivityIndicator style={{ flex: 1 }} size="large" color="#FFD600" />;
  }

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.search}
        value={search}
        onChangeText={setSearch}
        placeholder="Tìm kiếm username hoặc tên..."
        placeholderTextColor="#FFD60077"
      />
      <FlatList
        data={sortedConversations}
        keyExtractor={item => item.convId}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.row}
            onPress={() => navigation.navigate("ChatScreen", {
              senderId: userId,
              receiverId: item.receiver.id,
              receiverName: item.receiver.name,
              receiverAvatar: item.receiver.avatar,
              senderAvatar: profile?.avatar || DEFAULT_AVATAR
            })}
            activeOpacity={0.8}
          >
            <Image source={{ uri: item.receiver.avatar }} style={styles.avatar} />
            <View style={styles.rowContent}>
              <View style={styles.rowTop}>
                <Text style={styles.name}>{item.receiver.name}</Text>
                <Text style={styles.time}>
                  {item.lastTime ? item.lastTime.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) : ""}
                </Text>
              </View>
              <Text style={styles.lastMsg} numberOfLines={1}>{item.lastMsg}</Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={styles.emptyList}>Chưa có đoạn chat nào</Text>}
        contentContainerStyle={styles.listContent}
      />
      {/* Modal tạo đoạn chat mới */}
      <Modal visible={showModal} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Nhập username để bắt đầu chat</Text>
            <TextInput
              style={styles.modalInput}
              value={newReceiverId}
              onChangeText={setNewReceiverId}
              placeholder="Username hoặc ID"
              placeholderTextColor="#FFD60077"
            />
            <TouchableOpacity
              style={[styles.modalBtn, newReceiverId.trim() ? styles.modalBtnActive : null]}
              disabled={!newReceiverId.trim()}
              onPress={handleStartChat}
            >
              <Text style={styles.modalBtnText}>Bắt đầu chat</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowModal(false)}>
              <Text style={{ color: "#FFD600", marginTop: 10, textAlign: "center" }}>Đóng</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#181818", padding: 0 },
  headerIconBtn: {
    marginRight: 14,
    padding: 4,
    borderRadius: 20,
    backgroundColor: "#232323"
  },
  search: {
    backgroundColor: "#222",
    color: "#FFD600",
    padding: 13,
    borderRadius: 15,
    marginHorizontal: 16,
    marginVertical: 10,
    fontSize: 16,
    borderWidth: 1.2,
    borderColor: "#FFD60044"
  },
  listContent: {
    paddingHorizontal: 8,
    paddingBottom: 16
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 10,
    borderRadius: 18,
    marginVertical: 5,
    backgroundColor: "#232323",
    elevation: 2,
    shadowColor: "#FFD600",
    shadowOpacity: 0.09,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 }
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#FFD600",
    marginRight: 13,
    borderWidth: 2,
    borderColor: "#FFD600"
  },
  rowContent: {
    flex: 1,
    justifyContent: 'center',
    minHeight: 46
  },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  name: { color: "#FFD600", fontWeight: "bold", fontSize: 18 },
  time: { color: "#FFD60077", fontSize: 14, marginLeft: 10 },
  lastMsg: { color: "#FFD600BB", fontSize: 15, marginTop: 2 },
  emptyList: { color: "#FFD60077", textAlign: "center", marginTop: 40, fontSize: 16 },
  modalBg: { flex: 1, backgroundColor: "#18181899", justifyContent: "center", alignItems: "center" },
  modalContent: {
    backgroundColor: "#232323",
    padding: 24,
    borderRadius: 22,
    width: "88%",
    elevation: 8,
    shadowColor: "#FFD600",
    shadowOpacity: 0.15,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 6 }
  },
  modalTitle: { color: "#FFD600", fontWeight: "bold", fontSize: 19, marginBottom: 12 },
  modalInput: {
    backgroundColor: "#fff",
    color: "#181818",
    borderRadius: 15,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 16,
    marginBottom: 17,
    borderWidth: 1.5,
    borderColor: "#FFD60055"
  },
  modalBtn: {
    backgroundColor: "#FFD60099",
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
    marginTop: 4
  },
  modalBtnActive: { backgroundColor: "#FFD600" },
  modalBtnText: { color: "#181818", fontWeight: "bold", fontSize: 17 }
});