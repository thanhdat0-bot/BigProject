import React, { useEffect, useState } from 'react';
import { View, FlatList } from 'react-native';
import { Text, FAB, Portal, Modal, TextInput, Button, ActivityIndicator, IconButton } from 'react-native-paper';
import { authApi, endpoints } from '../../configs/Apis';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useNavigation } from '@react-navigation/native';
import {
  modernCard,
  fabStyle,
  formModalStyle,
  formModalTitleStyle,
  formGroupStyle,
  formLabelStyle,
  formInputStyle,
  formDateBtnStyle,
  formSaveBtnStyle,
  deleteModalStyle,
  deleteModalTitleStyle,
  deleteModalTextStyle,
  deleteModalCatStyle,
  deleteModalButtonRow,
  deleteCancelStyle,
  deleteConfirmStyle,
  modalStyle
} from "../styles/Style";

export default function ReminderScreen() {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [visible, setVisible] = useState(false);
  const [editReminder, setEditReminder] = useState(null);

  // Delete modal state
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  // Fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [remindAt, setRemindAt] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Custom Alert Modal State
  const [customAlert, setCustomAlert] = useState({ visible: false, title: '', message: '' });
  const showCustomAlert = (title, message) => setCustomAlert({ visible: true, title, message });
  const hideCustomAlert = () => setCustomAlert({ visible: false, title: '', message: '' });

  const navigation = useNavigation();

  // Set header only via navigation, not inside component render
  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: "Nhắc nhở",
      headerTitleAlign: "center",
      headerTintColor: "#FFD600",
      headerStyle: { backgroundColor: "#181818" },
      headerTitleStyle: { color: "#FFD600", fontWeight: "bold", fontSize: 21, letterSpacing: 0.5 }
    });
  }, [navigation]);

  const reload = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem("access_token");
      const res = await authApi(token).get(endpoints.reminders);
      setReminders(res.data.results || res.data || []);
    } catch {
      setReminders([]);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { reload(); }, []);

  const openAdd = () => {
    setEditReminder(null);
    setTitle('');
    setDescription('');
    setRemindAt(null);
    setVisible(true);
  };
  const openEdit = (reminder) => {
    setEditReminder(reminder);
    setTitle(reminder.title || '');
    setDescription(reminder.description || '');
    setRemindAt(reminder.remind_at ? new Date(reminder.remind_at) : null);
    setVisible(true);
  };

const handleSave = async () => {
  if (!title.trim()) return showCustomAlert("Lỗi", "Tiêu đề không được để trống.");
  if (!remindAt) return showCustomAlert("Lỗi", "Vui lòng chọn ngày nhắc.");
  let dateStr = null;
  if (remindAt) {
    const y = remindAt.getFullYear();
    const m = (remindAt.getMonth() + 1).toString().padStart(2, '0');
    const d = remindAt.getDate().toString().padStart(2, '0');
    dateStr = `${y}-${m}-${d}`;
  }
  try {
    const token = await AsyncStorage.getItem("access_token");
    const data = {
      title,
      description,
      remind_at: dateStr,
    };
    if (editReminder) {
      console.log("PUT to", endpoints.reminderDetail(editReminder.id), data);
      const res = await authApi(token).put(endpoints.reminderDetail(editReminder.id), data);
      console.log("PUT response", res.data);
    } else {
      await authApi(token).post(endpoints.reminders, data);
    }
    setVisible(false);
    setTimeout(() => reload(), 300);
  } catch (e) {
    console.log("PUT/POST error", e?.response?.data || e);
    showCustomAlert("Lỗi", "Không lưu được nhắc nhở.");
  }
};
  // Delete modal
  const handleDelete = (item) => {
    setItemToDelete(item);
    setDeleteModalVisible(true);
  };
  const confirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      const token = await AsyncStorage.getItem("access_token");
      await authApi(token).delete(endpoints.reminderDetail(itemToDelete.id));
      setDeleteModalVisible(false);
      setItemToDelete(null);
      setTimeout(() => reload(), 300);
    } catch (err) {
      setDeleteModalVisible(false);
      setItemToDelete(null);
      showCustomAlert("Lỗi", "Không xoá được nhắc nhở.");
    }
  };

  // Chỉ chọn ngày tháng năm
  const handleShowDatePicker = () => setShowDatePicker(true);
  const handleDatePickerChange = (event, date) => {
    setShowDatePicker(false);
    if (date) setRemindAt(date);
  };

  const renderReminder = ({ item }) => (
    <View style={modernCard}>
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
        <Icon name="alarm" size={24} color="#FFD600" style={{ marginRight: 7 }} />
        <Text style={{
          color: "#FFD600",
          fontWeight: "bold",
          fontSize: 17,
          flex: 1,
          textShadowColor: "#000",
          textShadowOffset: { width: 0, height: 1 },
          textShadowRadius: 3
        }}>
          {item.title}
        </Text>
        <IconButton
          icon="pencil-circle"
          iconColor="#43A047"
          size={26}
          onPress={() => openEdit(item)}
          style={{ margin: 0, marginLeft: 2 }}
        />
        <IconButton
          icon="trash-can"
          iconColor="#E91E63"
          size={26}
          onPress={() => handleDelete(item)}
          style={{ margin: 0, marginLeft: -8 }}
        />
      </View>
      <Text style={{
        color: "#FFD60099",
        fontStyle: "italic",
        marginBottom: 5,
        fontSize: 14,
      }}>{item.remind_at ? ("⏰ " + new Date(item.remind_at).toLocaleDateString()) : ""}</Text>
      <Text style={{
        color: "#FFD600",
        fontSize: 15,
        fontStyle: "italic",
        marginBottom: 2,
      }}>{item.description}</Text>
    </View>
  );

  const renderDeleteModal = () => (
    <Modal
      visible={deleteModalVisible}
      onDismiss={() => setDeleteModalVisible(false)}
      contentContainerStyle={deleteModalStyle}
    >
      <Text style={deleteModalTitleStyle}>Xác nhận xoá</Text>
      <Text style={deleteModalTextStyle}>
        Bạn chắc chắn muốn xoá nhắc nhở
        <Text style={deleteModalCatStyle}> {itemToDelete?.title || ""}</Text>?
      </Text>
      <View style={deleteModalButtonRow}>
        <Button
          mode="outlined"
          onPress={() => setDeleteModalVisible(false)}
          style={deleteCancelStyle}
          labelStyle={{ color: "#FFD600", fontWeight: "bold", fontSize: 16 }}
          contentStyle={{ height: 44 }}
        >Huỷ</Button>
        <Button
          mode="contained"
          onPress={confirmDelete}
          buttonColor="#E91E63"
          style={deleteConfirmStyle}
          labelStyle={{ color: "#fff", fontWeight: "bold", fontSize: 16 }}
          contentStyle={{ height: 44 }}
        >Xoá</Button>
      </View>
    </Modal>
  );

  return (
    <View style={{ flex: 1, backgroundColor: "#181818" }}>
      {loading ? (
        <ActivityIndicator animating color="#FFD600" style={{ margin: 32 }} />
      ) : (
        <FlatList
          data={reminders}
          keyExtractor={item => item.id.toString()}
          renderItem={renderReminder}
          contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 36 }}
          ListEmptyComponent={
            <Text style={{ color: "#FFD60099", textAlign: "center", margin: 24 }}>
              Chưa có nhắc nhở nào!
            </Text>
          }
        />
      )}
      <Portal>
        <Modal visible={visible} onDismiss={() => setVisible(false)} contentContainerStyle={formModalStyle}>
          <Text style={formModalTitleStyle}>{editReminder ? "Sửa" : "Thêm"} nhắc nhở</Text>
          <View style={formGroupStyle}>
            <Text style={formLabelStyle}>Tiêu đề</Text>
            <TextInput
              label=""
              value={title}
              onChangeText={setTitle}
              mode="flat"
              style={formInputStyle}
              underlineColor="#FFD600"
              activeUnderlineColor="#FFD600"
              theme={{ roundness: 10 }}
              placeholder="Nhập tiêu đề"
              placeholderTextColor="#aaa"
            />
          </View>
          <View style={formGroupStyle}>
            <Text style={formLabelStyle}>Nội dung</Text>
            <TextInput
              label=""
              value={description}
              onChangeText={setDescription}
              mode="flat"
              style={formInputStyle}
              underlineColor="#FFD600"
              activeUnderlineColor="#FFD600"
              theme={{ roundness: 10 }}
              placeholder="Nhập nội dung"
              placeholderTextColor="#aaa"
            />
          </View>
          <View style={formGroupStyle}>
            <Text style={formLabelStyle}>Thời gian nhắc</Text>
            <Button mode="outlined" textColor="#FFD600" style={formDateBtnStyle}
              labelStyle={{ fontWeight: "bold" }}
              onPress={handleShowDatePicker}>
              {remindAt ? remindAt.toLocaleDateString() : "Chọn thời gian nhắc"}
            </Button>
          </View>
          <Button mode="contained" buttonColor="#FFD600" onPress={handleSave} textColor="#232323" style={formSaveBtnStyle}>
            {editReminder ? "Lưu" : "Thêm"}
          </Button>
        </Modal>
        {renderDeleteModal()}
        <Modal visible={customAlert.visible} onDismiss={hideCustomAlert} contentContainerStyle={modalStyle}>
          <Text style={{ color: "#FFD600", fontWeight: "bold", fontSize: 18, marginBottom: 12 }}>
            {customAlert.title}
          </Text>
          <Text style={{ color: "#fff", fontSize: 15, marginBottom: 26, textAlign: "center" }}>
            {customAlert.message}
          </Text>
          <Button mode="contained" buttonColor="#FFD600" onPress={hideCustomAlert} textColor="#232323" style={formSaveBtnStyle}>OK</Button>
        </Modal>
        <FAB
          icon="plus"
          style={fabStyle}
          color="#232323"
          customSize={60}
          onPress={openAdd}
          visible={!visible && !deleteModalVisible && !customAlert.visible}
        />
      </Portal>
      {showDatePicker && (
        <DateTimePicker
          value={remindAt || new Date()}
          mode="date"
          display="default"
          onChange={handleDatePickerChange}
        />
      )}
    </View>
  );
}