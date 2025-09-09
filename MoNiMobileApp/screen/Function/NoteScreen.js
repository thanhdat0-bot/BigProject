import React, { useEffect, useState } from "react";
import { View, FlatList, TouchableOpacity } from "react-native";
import { Text, FAB, Portal, Modal, TextInput, Button, ActivityIndicator, IconButton } from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { authApi, endpoints } from "../../configs/Apis";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useNavigation } from "@react-navigation/native";
import {
  modernCard,
  fabStyle,
  formModalStyle,
  formModalTitleStyle,
  formGroupStyle,
  formLabelStyle,
  formInputStyle,
  formSaveBtnStyle,
  deleteModalStyle,
  deleteModalTitleStyle,
  deleteModalTextStyle,
  deleteModalButtonRow,
  deleteCancelStyle,
  deleteConfirmStyle,
  modalStyle
} from "../styles/Style";

export default function NoteScreen() {
    const [notes, setNotes] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modal states
    const [visible, setVisible] = useState(false);
    const [editNote, setEditNote] = useState(null);
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");

    // Delete modal state
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);
    const [noteToDelete, setNoteToDelete] = useState(null);

    // Alert modal state
    const [customAlert, setCustomAlert] = useState({ visible: false, title: '', message: '' });
    const showCustomAlert = (title, message) => setCustomAlert({ visible: true, title, message });
    const hideCustomAlert = () => setCustomAlert({ visible: false, title: '', message: '' });

    const navigation = useNavigation();

    // LOAD notes
    const reload = async () => {
        setLoading(true);
        try {
            const token = await AsyncStorage.getItem("access_token");
            const res = await authApi(token).get(endpoints.notes);
            // Sort pinned notes first
            const data = res.data.results || res.data || [];
            setNotes(data.sort((a, b) => (b.is_pinned ? 1 : 0) - (a.is_pinned ? 1 : 0)));
        } catch (err) {
            setNotes([]);
            showCustomAlert("Lỗi", "Không tải được ghi chú.");
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => { reload(); }, []);

    // ADD/EDIT
    const openAdd = () => { setEditNote(null); setTitle(""); setContent(""); setVisible(true); };
    const openEdit = (note) => { setEditNote(note); setTitle(note.title); setContent(note.content); setVisible(true); };

    const handleSave = async () => {
        if (!title.trim()) return showCustomAlert("Lỗi", "Tiêu đề không được để trống.");
        if (!content.trim()) return showCustomAlert("Lỗi", "Nội dung không được để trống.");
        try {
            const token = await AsyncStorage.getItem("access_token");
            if (editNote) {
                await authApi(token).put(endpoints.noteDetail(editNote.id), { title, content, is_pinned: editNote.is_pinned || false });
            } else {
                await authApi(token).post(endpoints.notes, { title, content, is_pinned: false });
            }
            setVisible(false); reload();
        } catch {
            showCustomAlert("Lỗi", "Không lưu được ghi chú.");
        }
    };

    const togglePin = async (note) => {
        try {
            const token = await AsyncStorage.getItem("access_token");
            await authApi(token).put(endpoints.noteDetail(note.id), {
                title: note.title,
                content: note.content,
                is_pinned: !note.is_pinned,
            });
            // Update UI only for this note:
            setNotes(prev =>
                [...prev]
                    .map(n => n.id === note.id ? { ...n, is_pinned: !n.is_pinned } : n)
                    .sort((a, b) => (b.is_pinned ? 1 : 0) - (a.is_pinned ? 1 : 0))
            );
        } catch {
            showCustomAlert("Lỗi", "Không cập nhật trạng thái ghim.");
        }
    };

    // DELETE
    const handleDelete = (note) => { setNoteToDelete(note); setDeleteModalVisible(true); };
    const confirmDelete = async () => {
        if (!noteToDelete) return;
        try {
            const token = await AsyncStorage.getItem("access_token");
            await authApi(token).delete(endpoints.noteDetail(noteToDelete.id));
            setDeleteModalVisible(false);
            setNoteToDelete(null);
            reload();
        } catch {
            setDeleteModalVisible(false);
            setNoteToDelete(null);
            showCustomAlert("Lỗi", "Không xoá được ghi chú.");
        }
    };

    // List item
    const renderItem = ({ item }) => (
        <TouchableOpacity onPress={() => navigation.navigate('NoteDetail', { noteId: item.id })}>
            <View style={modernCard}>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Icon name="note-text-outline" size={22} color="#FFD600" style={{ marginRight: 8 }} />
                    <View style={{ flex: 1 }}>
                        <Text style={{
                            color: "#FFD600",
                            fontWeight: "bold",
                            fontSize: 16,
                        }} numberOfLines={1}>
                            {item.title}
                        </Text>
                        <Text style={{
                            color: "#FFD600AA",
                            fontSize: 14,
                            marginTop: 2,
                        }} numberOfLines={1}>
                            {item.content}
                        </Text>
                    </View>
                    <IconButton icon="square-edit-outline" iconColor="#FFD600" size={22} onPress={() => openEdit(item)} />
                    <IconButton icon="delete-outline" iconColor="#E91E63" size={22} onPress={() => handleDelete(item)} />
                    <IconButton
                        icon={item.is_pinned ? "pin" : "pin-off"}
                        iconColor={item.is_pinned ? "#FFD600" : "#ccc"}
                        size={22}
                        onPress={() => togglePin(item)}
                    />
                </View>
            </View>
        </TouchableOpacity>
    );

    // Delete modal
    const renderDeleteModal = () => (
        <Modal
            visible={deleteModalVisible}
            onDismiss={() => setDeleteModalVisible(false)}
            contentContainerStyle={deleteModalStyle}
        >
            <Text style={deleteModalTitleStyle}>Xác nhận xoá</Text>
            <Text style={deleteModalTextStyle}>
                Bạn chắc chắn muốn xoá ghi chú này?
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
            {loading ? <ActivityIndicator animating color="#FFD600" style={{ margin: 32 }} /> :
                <FlatList
                    data={notes}
                    keyExtractor={item => item.id.toString()}
                    renderItem={renderItem}
                    contentContainerStyle={{ paddingHorizontal: 8, paddingBottom: 40 }}
                    ListEmptyComponent={
                        <Text style={{ color: "#FFD60099", textAlign: "center", margin: 16 }}>Chưa có ghi chú nào!</Text>
                    }
                />}
            <Portal>
                <Modal visible={visible} onDismiss={() => setVisible(false)} contentContainerStyle={formModalStyle}>
                    <Text style={formModalTitleStyle}>
                        {editNote ? "Sửa ghi chú" : "Thêm ghi chú"}
                    </Text>
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
                            value={content}
                            onChangeText={setContent}
                            mode="flat"
                            style={formInputStyle}
                            underlineColor="#FFD600"
                            activeUnderlineColor="#FFD600"
                            theme={{ roundness: 10 }}
                            multiline
                            placeholder="Nhập ghi chú"
                            placeholderTextColor="#aaa"
                        />
                    </View>
                    <Button mode="contained" buttonColor="#FFD600" onPress={handleSave} textColor="#232323" style={formSaveBtnStyle}>
                        {editNote ? "Lưu" : "Thêm"}
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
        </View>
    );
}