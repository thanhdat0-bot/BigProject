import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
  SafeAreaView,
  StatusBar,
  Dimensions,
  Alert,
} from "react-native";
import { db } from "../../configs/firebaseConfig";
import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
  onSnapshot,
  doc,
  setDoc,
  getDoc,
} from "firebase/firestore";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authApi, endpoints } from '../../configs/Apis';

const { width } = Dimensions.get("window");
const DEFAULT_AVATAR =
  "https://ui-avatars.com/api/?background=FFD600&color=181818&name=U";

// Chuẩn hóa userId
function normalizeUserId(id) {
  return id ? id.toString().trim().toLowerCase() : "";
}

function makeConversationId(id1, id2) {
  const a = normalizeUserId(id1);
  const b = normalizeUserId(id2);
  if (!a || !b) {
    Alert.alert("Lỗi", "Thiếu userId khi tạo phòng chat!");
    throw new Error("Thiếu userId khi tạo phòng chat!");
  }
  return [a, b].sort().join("_");
}

// Hàm lấy avatar profile của receiver
const fetchReceiverAvatar = async (receiverId) => {
  try {
    const token = await AsyncStorage.getItem('access_token');
    const res = await authApi(token).get(endpoints.profileDetail(receiverId));
    return res.data.avatar || DEFAULT_AVATAR;
  } catch {
    return DEFAULT_AVATAR;
  }
};

export default function ChatScreen({ route }) {
  const senderId = normalizeUserId(route.params?.senderId);
  const receiverId = normalizeUserId(route.params?.receiverId);
  const receiverName = route.params?.receiverName;
  const senderAvatar = route.params?.senderAvatar || DEFAULT_AVATAR;

  // State cho receiverAvatar, sẽ tự động cập nhật nếu cần
  const [receiverAvatar, setReceiverAvatar] = useState(route.params?.receiverAvatar || DEFAULT_AVATAR);

  // Nếu avatar truyền sang là mặc định, thì fetch từ API để cập nhật đúng avatar của receiver
  useEffect(() => {
    if (!receiverAvatar || receiverAvatar === DEFAULT_AVATAR) {
      const fetchAvatar = async () => {
        const av = await fetchReceiverAvatar(receiverId);
        setReceiverAvatar(av);
      };
      fetchAvatar();
    }
  }, [receiverId, receiverAvatar]);

  if (!senderId || !receiverId) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#181818" }}>
        <Text style={{ color: "#FFD600", fontSize: 18, fontWeight: "bold" }}>Lỗi: Thiếu thông tin người dùng!</Text>
      </SafeAreaView>
    );
  }

  let conversationId = "";
  try {
    conversationId =
      route.params?.conversationId || makeConversationId(senderId, receiverId);
  } catch (err) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#181818" }}>
        <Text style={{ color: "#FFD600", fontSize: 18, fontWeight: "bold" }}>Lỗi: Thiếu thông tin người dùng!</Text>
      </SafeAreaView>
    );
  }

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const flatListRef = useRef(null);

  useEffect(() => {
    const q = query(
      collection(db, "chats", conversationId, "messages"),
      orderBy("timestamp")
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = [];
      snapshot.forEach((doc) => msgs.push({ id: doc.id, ...doc.data() }));
      setMessages(msgs);
      if (flatListRef.current && msgs.length > 0) {
        setTimeout(() => flatListRef.current.scrollToEnd({ animated: true }), 150);
      }
    });
    return () => unsubscribe();
  }, [conversationId]);

  // Đảm bảo document gốc luôn có field
  const ensureConversationDoc = async () => {
    const convRef = doc(db, "chats", conversationId);
    const convSnap = await getDoc(convRef);
    if (!convSnap.exists() || Object.keys(convSnap.data() || {}).length === 0) {
      await setDoc(convRef, {
        createdAt: serverTimestamp(),
        users: [senderId, receiverId],
      }, { merge: true });
    }
  };

  // Tin nhắn gửi luôn lưu avatar của sender
  const handleSend = async () => {
    if (text.trim()) {
      setIsSending(true);
      try {
        await ensureConversationDoc();
        await addDoc(
          collection(db, "chats", conversationId, "messages"),
          {
            senderId,
            receiverId,
            text: text.trim(),
            timestamp: serverTimestamp(),
            senderName: "Bạn",
            avatarUrl: senderAvatar,
          }
        );
        setText("");
      } catch (err) {
        alert("Lỗi gửi tin nhắn!");
      }
      setIsSending(false);
    }
  };

  const formatDate = (timestamp) => {
    try {
      const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
      const today = new Date();
      const messageDate = new Date(date);
      if (messageDate.toDateString() === today.toDateString()) return "Hôm nay";
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      if (messageDate.toDateString() === yesterday.toDateString()) return "Hôm qua";
      return date.toLocaleDateString("vi-VN");
    } catch (e) {
      return "";
    }
  };
  const formatTime = (timestamp) => {
    try {
      const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
    } catch (e) {
      return "";
    }
  };
  const shouldShowDate = (message, index) => {
    if (index === 0) return true;
    const prevMsg = messages[index - 1];
    if (!message.timestamp || !prevMsg.timestamp) return false;
    const d1 = message.timestamp.toDate
      ? message.timestamp.toDate().toDateString()
      : new Date(message.timestamp).toDateString();
    const d2 = prevMsg.timestamp.toDate
      ? prevMsg.timestamp.toDate().toDateString()
      : new Date(prevMsg.timestamp).toDateString();
    return d1 !== d2;
  };

  // ==== FIXED: lấy avatar đúng cho cả hai phía ====
  const renderItem = ({ item, index }) => {
    const isMe = normalizeUserId(item.senderId) === senderId;
    // Nếu là mình gửi: avatar lấy từ item.avatarUrl hoặc senderAvatar
    // Nếu là người nhận gửi: avatar lấy từ item.avatarUrl (nếu có), hoặc receiverAvatar (đã fetch từ API)
    const avatarForBubble = isMe
      ? (item.avatarUrl || senderAvatar)
      : (item.avatarUrl || receiverAvatar);

    return (
      <View>
        {shouldShowDate(item, index) && (
          <View style={styles.dateSeparator}>
            <View style={styles.dateSeparatorLine} />
            <Text style={styles.dateText}>{formatDate(item.timestamp)}</Text>
            <View style={styles.dateSeparatorLine} />
          </View>
        )}
        <View style={[
          styles.messageRow,
          isMe ? styles.rightRow : styles.leftRow
        ]}>
          {!isMe && (
            <Image
              source={{ uri: avatarForBubble }}
              style={styles.avatar}
            />
          )}
          <View style={[
            styles.bubble,
            isMe ? styles.bubbleRight : styles.bubbleLeft
          ]}>
            <Text style={[
              styles.messageText,
              isMe ? styles.textMe : styles.textOther
            ]}>
              {item.text}
            </Text>
            <Text style={isMe ? styles.timeRight : styles.timeLeft}>
              {formatTime(item.timestamp)}
            </Text>
          </View>
          {isMe && (
            <Image
              source={{ uri: avatarForBubble }}
              style={styles.avatar}
            />
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeContainer}>
      <StatusBar backgroundColor="#232323" barStyle="light-content" />
      <View style={styles.header}>
        <Image
          source={{
            uri: receiverAvatar,
          }}
          style={styles.headerAvatar}
        />
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>
            {receiverName || `User ${receiverId}`}
          </Text>
          <Text style={styles.headerStatus}>Đang hoạt động</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={{ flex: 1 }}>
          {messages.length === 0 && (
            <View style={styles.emptyBox}>
              <Icon name="message-text-outline" size={40} color="#FFD60099" />
              <Text style={styles.emptyText}>
                Chưa có tin nhắn nào. Hãy bắt đầu trò chuyện!
              </Text>
            </View>
          )}
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        </View>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Nhập tin nhắn..."
            placeholderTextColor="#FFD60099"
            value={text}
            onChangeText={setText}
            onSubmitEditing={handleSend}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              text.trim() ? styles.sendButtonActive : null,
            ]}
            onPress={handleSend}
            disabled={isSending || !text.trim()}
            activeOpacity={0.7}
          >
            {isSending ? (
              <ActivityIndicator color="#181818" size={20} />
            ) : (
              <Icon name="send" size={24} color="#181818" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: "#161616"
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#232323",
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#FFD60022",
    elevation: 3
  },
  headerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 14,
    borderWidth: 2.2,
    borderColor: "#FFD600",
    backgroundColor: "#FFD60022"
  },
  headerInfo: {
    flex: 1,
    flexDirection: "column"
  },
  headerTitle: {
    color: "#FFD600",
    fontSize: 21,
    fontWeight: "bold",
    letterSpacing: 0.5
  },
  headerStatus: {
    color: "#FFD60099",
    fontSize: 14,
    marginTop: 2
  },
  emptyBox: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 60,
    marginBottom: 24
  },
  emptyText: {
    color: "#FFD60099",
    fontSize: 16,
    fontStyle: "italic",
    marginTop: 8
  },
  listContent: {
    paddingHorizontal: 8,
    paddingBottom: 90
  },
  dateSeparator: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 18,
    paddingHorizontal: 18
  },
  dateSeparatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#FFD60020"
  },
  dateText: {
    fontSize: 13,
    color: "#FFD60099",
    backgroundColor: "#181818",
    paddingHorizontal: 12,
    paddingVertical: 4,
    fontWeight: "500",
    borderRadius: 10
  },
  messageRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginVertical: 4,
    paddingHorizontal: 2
  },
  leftRow: { justifyContent: "flex-start" },
  rightRow: { justifyContent: "flex-end" },
  bubble: {
    maxWidth: width * 0.68,
    borderRadius: 18,
    paddingHorizontal: 15,
    paddingVertical: 11,
    marginHorizontal: 6,
    elevation: 2,
    shadowColor: "#FFD600",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.09,
    shadowRadius: 8
  },
  bubbleRight: {
    backgroundColor: "#FFD600",
    alignSelf: "flex-end",
    borderBottomRightRadius: 8
  },
  bubbleLeft: {
    backgroundColor: "#232323",
    alignSelf: "flex-start",
    borderBottomLeftRadius: 8
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "400"
  },
  textMe: {
    color: "#181818",
    fontWeight: "bold"
  },
  textOther: {
    color: "#FFD600",
    fontWeight: "bold"
  },
  timeRight: {
    fontSize: 11,
    color: "#181818BB",
    alignSelf: "flex-end",
    marginTop: 3
  },
  timeLeft: {
    fontSize: 11,
    color: "#FFD600A0",
    alignSelf: "flex-end",
    marginTop: 3
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginHorizontal: 2,
    borderWidth: 1.5,
    borderColor: "#FFD600"
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#222",
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: "#FFD60033",
    elevation: 3,
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0
  },
  input: {
    flex: 1,
    backgroundColor: "#fff",
    color: "#181818",
    borderRadius: 15,
    paddingHorizontal: 14,
    paddingVertical: 9,
    fontSize: 16,
    marginRight: 10,
    borderWidth: 1.5,
    borderColor: "#FFD60055",
    minHeight: 36,
    maxHeight: 90
  },
  sendButton: {
    backgroundColor: "#FFD60099",
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 11,
    elevation: 2,
    alignItems: "center",
    justifyContent: "center"
  },
  sendButtonActive: {
    backgroundColor: "#FFD600"
  }
});