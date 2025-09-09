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
  deleteModalCatStyle,
  deleteModalButtonRow,
  deleteCancelStyle,
  deleteConfirmStyle,
  modalStyle
} from "../styles/Style";

export default function CategoryScreen() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(false);
  const [editCat, setEditCat] = useState(null);
  const [name, setName] = useState("");

  // Custom delete modal state
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [catToDelete, setCatToDelete] = useState(null);

  // Custom Alert Modal State
  const [customAlert, setCustomAlert] = useState({ visible: false, title: '', message: '' });
  const showCustomAlert = (title, message) => setCustomAlert({ visible: true, title, message });
  const hideCustomAlert = () => setCustomAlert({ visible: false, title: '', message: '' });

  const navigation = useNavigation();

  const reload = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem("access_token");
      const res = await authApi(token).get(endpoints.categories);
      setCategories(res.data.results || []);
    } catch (err) {
      setCategories([]);
      showCustomAlert("Lỗi", "Không tải được danh mục.");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { reload(); }, []);

  const openAdd = () => { setEditCat(null); setName(""); setVisible(true); };
  const openEdit = (cat) => { setEditCat(cat); setName(cat.name); setVisible(true); };

  const handleSave = async () => {
    if (!name.trim()) return showCustomAlert("Lỗi", "Tên danh mục không được để trống.");
    try {
      const token = await AsyncStorage.getItem("access_token");
      if (editCat) {
        await authApi(token).put(endpoints.categoryDetail(editCat.id), { name, is_default: false });
      } else {
        await authApi(token).post(endpoints.categories, { name, is_default: false });
      }
      setVisible(false); reload();
    } catch {
      showCustomAlert("Lỗi", "Không lưu được danh mục.");
    }
  };

  const handleDelete = (cat) => {
    setCatToDelete(cat);
    setDeleteModalVisible(true);
  };
  const confirmDelete = async () => {
    if (!catToDelete) return;
    try {
      const token = await AsyncStorage.getItem("access_token");
      await authApi(token).delete(endpoints.categoryDetail(catToDelete.id));
      setDeleteModalVisible(false);
      setCatToDelete(null);
      reload();
    } catch {
      setDeleteModalVisible(false);
      setCatToDelete(null);
      showCustomAlert("Lỗi", "Không xoá được danh mục.");
    }
  };

  // Chia nhóm mặc định & nhóm của tôi
  const defaultCategories = categories.filter(c => c.is_default);
  const userCategories = categories.filter(c => !c.is_default);

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={modernCard}
      onPress={() => {
        if (item.id) navigation.navigate('CategoryDetail', { categoryId: item.id });
      }}
      activeOpacity={0.7}
      disabled={!item.id}
    >
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <Icon name="folder" size={22} color={item.is_default ? "#FFD600" : "#43A047"} style={{ marginRight: 8 }} />
        <Text style={{
          color: item.is_default ? "#FFD600" : "#fff",
          fontWeight: "bold",
          fontSize: 16,
          flex: 1
        }}>
          {item.name}
        </Text>
        {item.is_default
          ? <Text style={{ color: "#43A047", fontWeight: "bold", fontSize: 13, marginRight: 2 }}>Mặc định</Text>
          : (
            <>
              <IconButton icon="square-edit-outline" iconColor="#FFD600" size={22} onPress={() => openEdit(item)} />
              <IconButton icon="delete-outline" iconColor="#E91E63" size={22} onPress={() => handleDelete(item)} />
            </>
          )}
      </View>
    </TouchableOpacity>
  );

  const renderDeleteModal = () => (
    <Modal
      visible={deleteModalVisible}
      onDismiss={() => setDeleteModalVisible(false)}
      contentContainerStyle={deleteModalStyle}
    >
      <Text style={deleteModalTitleStyle}>Xác nhận xoá</Text>
      <Text style={deleteModalTextStyle}>
        Bạn chắc chắn muốn xoá danh mục{" "}
        <Text style={deleteModalCatStyle}>{catToDelete?.name || ""}</Text>?
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
          data={[
            ...(defaultCategories.length > 0 ? [{ type: 'label', label: 'Danh mục mặc định' }] : []),
            ...defaultCategories,
            ...(userCategories.length > 0 ? [{ type: 'label', label: 'Danh mục của tôi' }] : []),
            ...userCategories
          ]}
          keyExtractor={(item, idx) => item.id ? item.id.toString() : `label-${idx}`}
          renderItem={({ item }) =>
            item.type === "label" ? (
              <Text style={{
                color: "#FFD600",
                marginLeft: 8,
                fontSize: 15,
                marginVertical: 10,
                fontWeight: "bold"
              }}>{item.label}</Text>
            ) : renderItem({ item })
          }
          contentContainerStyle={{ paddingHorizontal: 8, paddingBottom: 40 }}
          ListEmptyComponent={
            <Text style={{ color: "#FFD60099", textAlign: "center", margin: 16 }}>Không có danh mục nào!</Text>
          }
        />}
      <Portal>
        <Modal visible={visible} onDismiss={() => setVisible(false)} contentContainerStyle={formModalStyle}>
          <Text style={formModalTitleStyle}>
            {editCat ? "Sửa danh mục" : "Thêm danh mục"}
          </Text>
          <View style={formGroupStyle}>
            <Text style={formLabelStyle}>Tên danh mục</Text>
            <TextInput
              label=""
              value={name}
              onChangeText={setName}
              mode="flat"
              style={formInputStyle}
              underlineColor="#FFD600"
              activeUnderlineColor="#FFD600"
              theme={{ roundness: 10 }}
              placeholder="Nhập tên danh mục"
              placeholderTextColor="#aaa"
            />
          </View>
          <Button mode="contained" buttonColor="#FFD600" onPress={handleSave} textColor="#232323" style={formSaveBtnStyle}>
            {editCat ? "Lưu" : "Thêm"}
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