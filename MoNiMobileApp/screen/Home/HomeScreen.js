import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, ActivityIndicator, ScrollView, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PieChart, BarChart } from 'react-native-chart-kit';
import { authApi, endpoints } from '../../configs/Apis';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { Modal, Portal, Button } from 'react-native-paper';

const screenWidth = Dimensions.get('window').width;
const chartCardPadding = 24;
const chartWidth = screenWidth - chartCardPadding * 2;
const chartHeight = 190;
const pieCenterX = (chartWidth - chartHeight) / 2;

function formatMonth(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}
function displayMonth(date) {
  return `Tháng ${date.getMonth() + 1}/${date.getFullYear()}`;
}
function toLocalDate(date) {
  if (!date) return new Date();
  if (!(date instanceof Date)) date = new Date(date);
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}
function getMonday(date) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d;
}
function displayWeekRange(date) {
  const monday = getMonday(date);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return `Tuần ${monday.getDate()}/${monday.getMonth() + 1} - ${sunday.getDate()}/${sunday.getMonth() + 1}/${sunday.getFullYear()}`;
}

/**
 * Tính chênh lệch giữa tháng hiện tại và tháng trước (KHÔNG %).
 * type: 'expense' | 'income' | 'balance'
 */
function buildChangeInfo(current, previous, type) {
  const delta = Number(current || 0) - Number(previous || 0);

  // expense tăng là xấu; income & balance tăng là tốt
  const goodIncrease = (type !== 'expense');
  let color;
  if (delta === 0) color = '#FFD600';
  else if (delta > 0) color = goodIncrease ? '#43A047' : '#E91E63';
  else color = goodIncrease ? '#E91E63' : '#43A047';

  let icon;
  if (delta > 0) icon = 'arrow-up-bold';
  else if (delta < 0) icon = 'arrow-down-bold';
  else icon = 'minus';

  return { delta, color, icon };
}

export default function HomeScreen() {
  const [reportType, setReportType] = useState('month');
  const [selectedDate, setSelectedDate] = useState(() => {
    const now = new Date();
    now.setDate(1);
    return now;
  });

  const [overview, setOverview] = useState(null);
  const [prevOverview, setPrevOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCategoryDetail, setShowCategoryDetail] = useState(false);

  // Reminder state
  const [reminderModalVisible, setReminderModalVisible] = useState(false);
  const [dueReminders, setDueReminders] = useState([]);
  const [reminderLoading, setReminderLoading] = useState(false);

  const scrollRef = useRef();
  const navigation = useNavigation();

  // Lấy userId hiện tại từ AsyncStorage
  const [userId, setUserId] = useState('');
  useEffect(() => {
    AsyncStorage.getItem('user_id').then(id => {
      if (id && id.trim()) setUserId(id.trim());
      else setUserId('');
    });
  }, []);

  const loadDueReminders = async () => {
    setReminderLoading(true);
    try {
      const token = await AsyncStorage.getItem('access_token');
      const res = await authApi(token).get(endpoints.reminders);
      const today = new Date();
      const due = (res.data.results || res.data || []).filter(r => {
        if (!r.remind_at) return false;
        const remindDate = new Date(r.remind_at);
        return remindDate <= today;
      });
      setDueReminders(due);
    } catch {
      setDueReminders([]);
    } finally {
      setReminderLoading(false);
    }
  };

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <TouchableOpacity
          style={{ marginLeft: 15, marginRight: 5 }}
          onPress={() => {
            setReminderModalVisible(true);
            loadDueReminders();
          }}
        >
          <Icon name="bell-outline" size={26} color="#FFD600" />
        </TouchableOpacity>
      ),
      // --- Thêm nút chat kế bên nút hồ sơ ---
      headerRight: () => (
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity
            style={{ marginRight: 10 }}
            onPress={() => navigation.navigate('ChatListScreen', { userId })}
          >
            <Icon name="chat" size={26} color="#FFD600" />
          </TouchableOpacity>
          <TouchableOpacity
            style={{ marginRight: 15 }}
            onPress={() => navigation.navigate('FunctionTabs', { screen: 'Profile' })}
          >
            <Icon name="account-circle" size={30} color="#FFD600" />
          </TouchableOpacity>
        </View>
      ),
      headerStyle: { backgroundColor: '#181818' },
      headerTitleAlign: 'center',
      headerTintColor: '#FFD600',
      headerTitleStyle: { color: '#FFD600', fontWeight: 'bold', fontSize: 20 }
    });
  }, [navigation, userId]);

  useEffect(() => {
    if (reportType === 'week') {
      setSelectedDate(getMonday(toLocalDate(new Date())));
    } else if (reportType === 'month') {
      const d = new Date();
      d.setDate(1);
      setSelectedDate(d);
    }
  }, [reportType]);

  // Lấy dữ liệu thống kê + tháng trước (nếu theo tháng)
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const token = await AsyncStorage.getItem('access_token');

        if (reportType === 'week') {
          setPrevOverview(null);
          const monday = getMonday(toLocalDate(selectedDate));
          const dateStr = [
            monday.getFullYear(),
            String(monday.getMonth() + 1).padStart(2, '0'),
            String(monday.getDate()).padStart(2, '0')
          ].join('-');
          const res = await authApi(token).get(endpoints.statisticsWeeklySummary + `?date=${dateStr}`);
          setOverview(res.data);
        } else {
          const monthStr = formatMonth(selectedDate);
          const prevDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1);
          const prevMonthStr = formatMonth(prevDate);

          const [currRes, prevRes] = await Promise.all([
            authApi(token).get(endpoints.statisticsOverview + `?month=${monthStr}`),
            authApi(token).get(endpoints.statisticsOverview + `?month=${prevMonthStr}`).catch(() => ({ data: null }))
          ]);

          setOverview(currRes.data);
          setPrevOverview(prevRes.data);
        }
      } catch {
        setOverview(null);
        setPrevOverview(null);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [reportType, selectedDate]);

  const handlePrev = () => {
    setSelectedDate(prev => {
      if (reportType === 'month') {
        const d = new Date(prev);
        d.setMonth(d.getMonth() - 1);
        return d;
      } else {
        const d = getMonday(toLocalDate(prev));
        d.setDate(d.getDate() - 7);
        return d;
      }
    });
  };
  const handleNext = () => {
    setSelectedDate(prev => {
      if (reportType === 'month') {
        const d = new Date(prev);
        d.setMonth(d.getMonth() + 1);
        return d;
      } else {
        const d = getMonday(toLocalDate(prev));
        d.setDate(d.getDate() + 7);
        return d;
      }
    });
  };

  const isWeek = reportType === 'week';
  const totalExpense = Number(overview?.total_expense ?? 0);
  const totalIncome = Number(overview?.total_income ?? 0);
  const balance = overview?.balance !== undefined
    ? Number(overview.balance)
    : (totalIncome - totalExpense);

  // Tháng trước
  const prevExpense = Number(prevOverview?.total_expense ?? 0);
  const prevIncome = Number(prevOverview?.total_income ?? 0);
  const prevBalance = prevOverview?.balance !== undefined
    ? Number(prevOverview.balance)
    : (prevIncome - prevExpense);

  const expenseChange = !isWeek && prevOverview ? buildChangeInfo(totalExpense, prevExpense, 'expense') : null;
  const incomeChange = !isWeek && prevOverview ? buildChangeInfo(totalIncome, prevIncome, 'income') : null;
  const balanceChange = !isWeek && prevOverview ? buildChangeInfo(balance, prevBalance, 'balance') : null;

  const categoryList = isWeek
    ? overview?.top_categories ?? []
    : overview?.category_summary ?? [];

  const pieData = categoryList
    .filter((c) => Number(c.expense) > 0)
    .map((cat, i) => ({
      name: cat.category,
      expense: Number(cat.expense),
      color: chartColors[i % chartColors.length],
      legendFontColor: '#FFD600',
      legendFontSize: 15,
      icon: categoryIcons[cat.category] || 'wallet',
    }));

  const pieDataWithPercent = pieData.map(item => ({
    ...item,
    percent: totalExpense > 0 ? Math.round(item.expense / totalExpense * 100) : 0,
  }));

  const daysInMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0).getDate();
  const barLabels = Array.from({ length: daysInMonth }, (_, i) => (i + 1).toString());
  const barData = Array(daysInMonth).fill(0);

  if (reportType === 'month' && overview?.daily_expense) {
    overview.daily_expense.forEach(item => {
      const day = new Date(item.date).getDate();
      barData[day - 1] = Number(item.expense);
    });
  }

  const barColumnWidth = 38;
  const barChartWidth = Math.max(screenWidth - 48, daysInMonth * barColumnWidth);

  const maxValue = Math.max(...barData, 0);
  const steps = 4;
  const yAxisLabels = Array.from({ length: steps + 1 }).map((_, i) =>
    Math.round(maxValue * (steps - i) / steps).toLocaleString() + 'đ'
  );

  useEffect(() => {
    if (reportType === 'month' && scrollRef.current && daysInMonth > 0) {
      const today = new Date();
      const isThisMonth =
        today.getMonth() === selectedDate.getMonth() &&
        today.getFullYear() === selectedDate.getFullYear();
      if (isThisMonth) {
        setTimeout(() => {
          const scrollTo = Math.max(0, (today.getDate() - 3) * barColumnWidth);
          scrollRef.current.scrollTo({ x: scrollTo, animated: true });
        }, 700);
      }
    }
  }, [reportType, selectedDate, daysInMonth]);

  const renderReminderModal = () => (
    <Portal>
      <Modal
        visible={reminderModalVisible}
        onDismiss={() => setReminderModalVisible(false)}
        contentContainerStyle={styles.reminderModal}
      >
        <Text style={styles.reminderTitle}>Nhắc nhở đến hạn</Text>
        {reminderLoading ? (
          <ActivityIndicator color="#FFD600" style={{ marginVertical: 20 }} />
        ) : dueReminders.length === 0 ? (
          <Text style={styles.reminderEmpty}>Không có nhắc nhở đến hạn hoặc quá hạn.</Text>
        ) : (
          dueReminders.map(reminder => (
            <View key={reminder.id} style={styles.reminderRow}>
              <Icon name="bell-alert" color="#FFD600" size={20} style={{ marginRight: 8 }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.reminderRowTitle}>{reminder.title}</Text>
                <Text style={styles.reminderRowDesc}>{reminder.description}</Text>
                <Text style={styles.reminderRowDate}>
                  {reminder.remind_at ? new Date(reminder.remind_at).toLocaleDateString() : ''}
                </Text>
              </View>
            </View>
          ))
        )}
        <Button
          mode="contained"
          buttonColor="#FFD600"
          onPress={() => setReminderModalVisible(false)}
          textColor="#232323"
          style={{ borderRadius: 10, marginTop: 18, paddingVertical: 8 }}
        >
          Đóng
        </Button>
      </Modal>
    </Portal>
  );

  // Hàng hiển thị so sánh tháng
  const MonthCompareRow = () => {
    if (isWeek || !prevOverview) return null;
    return (
      <View style={styles.compareRowWrapper}>
        <CompareBox label="Chi tiêu" change={expenseChange} baseColor="#E91E63" />
        <CompareBox label="Thu nhập" change={incomeChange} baseColor="#43A047" />
        <CompareBox label="Chênh lệch" change={balanceChange} baseColor="#FFD600" />
      </View>
    );
  };

  return (
    <ScrollView style={styles.bg}>
      {renderReminderModal()}
      <View style={styles.container}>
        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[styles.tabButton, reportType === 'week' && styles.tabActive]}
            onPress={() => setReportType('week')}
          >
            <Text style={[styles.tabText, reportType === 'week' && styles.tabTextActive]}>Theo tuần</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, reportType === 'month' && styles.tabActive]}
            onPress={() => setReportType('month')}
          >
            <Text style={[styles.tabText, reportType === 'month' && styles.tabTextActive]}>Theo tháng</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={handlePrev}>
            <Icon name="chevron-left" size={32} color="#FFD600" />
          </TouchableOpacity>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <Icon name="calendar-month-outline" size={20} color="#FFD600" />
            <Text style={styles.headerMonth}>
              {reportType === 'month'
                ? displayMonth(selectedDate)
                : displayWeekRange(selectedDate)}
            </Text>
          </View>
          <TouchableOpacity onPress={handleNext}>
            <Icon name="chevron-right" size={32} color="#FFD600" />
          </TouchableOpacity>
        </View>

        {/* Tổng quan tháng hiện tại */}
        <View style={styles.row}>
          <SummaryCard
            icon="arrow-down-bold-circle-outline"
            iconColor="#E91E63"
            label="Chi tiêu"
            value={totalExpense.toLocaleString() + 'đ'}
            valueColor="#E91E63"
          />
          <SummaryCard
            icon="arrow-up-bold-circle-outline"
            iconColor="#43A047"
            label="Thu nhập"
            value={totalIncome.toLocaleString() + 'đ'}
            valueColor="#43A047"
          />
          <SummaryCard
            icon="cash"
            iconColor="#FFD600"
            label="Chênh lệch"
            value={isNaN(balance) ? '--' : balance.toLocaleString() + 'đ'}
            valueColor="#FFD600"
          />
        </View>

        {/* So sánh tháng trước */}
        <MonthCompareRow />

        {/* Các nút chức năng nhanh */}
        <View style={styles.funcButtonSection}>
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.functionBtn} onPress={() => navigation.navigate('FunctionTabs', { screen: 'Category' })}>
              <Icon name="folder" size={26} color="#FFD600" />
              <Text style={styles.functionLabel}>Danh mục</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.functionBtn} onPress={() => navigation.navigate('FunctionTabs', { screen: 'Transaction' })}>
              <Icon name="swap-horizontal" size={26} color="#FFD600" />
              <Text style={styles.functionLabel}>Giao dịch</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.functionBtn} onPress={() => navigation.navigate('FunctionTabs', { screen: 'BudgetLimit' })}>
              <Icon name="finance" size={26} color="#FFD600" />
              <Text style={styles.functionLabel}>Hạn mức</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.functionBtn} onPress={() => navigation.navigate('FunctionTabs', { screen: 'Note' })}>
              <Icon name="note-text" size={26} color="#FFD600" />
              <Text style={styles.functionLabel}>Ghi chú</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.functionBtn} onPress={() => navigation.navigate('FunctionTabs', { screen: 'Reminder' })}>
              <Icon name="alarm" size={26} color="#FFD600" />
              <Text style={styles.functionLabel}>Nhắc nhở</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Biểu đồ tròn + legend */}
        <View style={styles.chartCard}>
          {loading ? (
            <ActivityIndicator color="#FFD600" size="large" />
          ) : pieDataWithPercent.length > 0 ? (
            <>
              <View style={styles.centerPieChartBox}>
                <PieChart
                  data={pieDataWithPercent}
                  width={chartWidth}
                  height={chartHeight}
                  chartConfig={{
                    backgroundColor: '#232323',
                    backgroundGradientFrom: '#232323',
                    backgroundGradientTo: '#232323',
                    color: (opacity = 1) => `rgba(255, 214, 0, ${opacity})`,
                    labelColor: () => '#FFD600',
                  }}
                  accessor="expense"
                  backgroundColor="transparent"
                  hasLegend={false}
                  absolute={false}
                  center={[pieCenterX, 0]}
                  paddingLeft="0"
                />
              </View>
              <View style={styles.legendBox}>
                {pieDataWithPercent.map((item, idx) => (
                  <View style={styles.legendRow} key={idx}>
                    <Icon name={item.icon} size={17} color={item.color} style={{ marginRight: 7 }} />
                    <View style={[styles.dot, { backgroundColor: item.color }]} />
                    <Text style={styles.legendText}>
                      <Text style={{ fontWeight: 'bold', color: '#FFD600' }}>{item.percent}%</Text>
                      {'  '}<Text style={{ color: '#FFD600' }}>{item.name}</Text>
                    </Text>
                  </View>
                ))}
              </View>
            </>
          ) : (
            <Text style={styles.noData}>Không có chi tiêu nào!</Text>
          )}
        </View>

        {/* Biểu đồ cột theo ngày (chỉ tháng) */}
        {reportType === 'month' && (
          <View style={[styles.chartCard, { flexDirection: 'row', alignItems: 'flex-start' }]}>
            <View style={{ width: 58, paddingTop: 36 }}>
              {yAxisLabels.map((v, i) => (
                <Text
                  key={i}
                  style={{
                    color: '#FFD600',
                    fontSize: 12,
                    height: 38,
                    textAlign: 'right',
                    fontWeight: 'bold'
                  }}>
                  {v}
                </Text>
              ))}
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              ref={scrollRef}
              style={{ flex: 1 }}
              contentContainerStyle={{ minHeight: 220, alignItems: 'center' }}
            >
              <BarChart
                data={{
                  labels: barLabels,
                  datasets: [{ data: barData }]
                }}
                width={barChartWidth}
                height={220}
                fromZero
                chartConfig={{
                  backgroundColor: '#232323',
                  backgroundGradientFrom: '#232323',
                  backgroundGradientTo: '#232323',
                  decimalPlaces: 0,
                  color: () => '#FFD600',
                  labelColor: () => '#FFD600',
                  fillShadowGradient: '#FFD600',
                  fillShadowGradientOpacity: 1,
                  barPercentage: 0.7,
                  propsForLabels: { fontSize: 11, fontWeight: 'bold' },
                  propsForBackgroundLines: { stroke: '#FFD60077', strokeDasharray: '3,3' }
                }}
                style={{ borderRadius: 16, marginLeft: 0, alignSelf: 'center' }}
                showBarTops={false}
                withInnerLines
                withHorizontalLabels={false}
              />
            </ScrollView>
          </View>
        )}

        {/* Chi tiết danh mục */}
        <TouchableOpacity style={styles.detailToggle} onPress={() => setShowCategoryDetail(x => !x)}>
          <Text style={styles.detailTitle}>
            Chi tiết từng danh mục ({pieDataWithPercent.length})
          </Text>
          <Icon name={showCategoryDetail ? 'chevron-up' : 'chevron-down'} size={22} color="#FFD600" />
        </TouchableOpacity>
        {showCategoryDetail && (
          <View style={styles.detailList}>
            {pieDataWithPercent.map((item, idx) => (
              <View style={styles.detailRow} key={idx}>
                <Icon name={item.icon} size={18} color={item.color} style={{ marginRight: 7 }} />
                <Text style={{ flex: 1, color: '#FFD600', fontSize: 15 }}>{item.name}</Text>
                <Text style={{ color: '#E91E63', fontSize: 15, fontWeight: 'bold' }}>{item.expense.toLocaleString()}đ</Text>
                <Text style={{ color: '#43A047', fontSize: 14, marginLeft: 8 }}>{item.percent}%</Text>
              </View>
            ))}
          </View>
        )}

        {/* Cảnh báo vượt hạn mức */}
        {overview?.budget_limit_exceeded?.length > 0 && (
          <View style={styles.budgetWarningBlock}>
            <Text style={styles.budgetWarningTitle}>Danh mục vượt hạn mức:</Text>
            {overview.budget_limit_exceeded.map((item, idx) => (
              <View style={styles.budgetWarningRow} key={idx}>
                <Icon name="alert-circle" size={18} color="#E91E63" style={{ marginRight: 7 }} />
                <Text style={{ color: '#FFD600', fontWeight: 'bold', flex: 1 }}>{item.category}</Text>
                <Text style={{ color: '#E91E63' }}>
                  {Number(item.actual_expense).toLocaleString()}đ / {Number(item.limit).toLocaleString()}đ
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

function SummaryCard({ icon, iconColor, label, value, valueColor }) {
  return (
    <View style={styles.summaryCard}>
      <View style={[styles.summaryIconBox, { backgroundColor: iconColor + '22' }]}>
        <Icon name={icon} size={24} color={iconColor} />
      </View>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={[styles.summaryValue, { color: valueColor }]}>{value}</Text>
    </View>
  );
}

/**
 * Hộp hiển thị chênh lệch (không %)
 */
function CompareBox({ label, change, baseColor }) {
  if (!change) {
    return (
      <View style={styles.compareBox}>
        <Text style={[styles.compareLabel, { color: baseColor }]}>{label}</Text>
        <Text style={styles.comparePlaceholder}>--</Text>
      </View>
    );
  }
  const { delta, color, icon } = change;
  const formattedDelta =
    delta === 0
      ? '= 0đ'
      : (delta > 0 ? '+' : '') + delta.toLocaleString() + 'đ';

  return (
    <View style={styles.compareBox}>
      <Text style={[styles.compareLabel, { color: baseColor }]}>{label}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
        <Icon name={icon} size={18} color={color} style={{ marginRight: 4 }} />
        <Text style={[styles.compareDelta, { color }]}>{formattedDelta}</Text>
      </View>
    </View>
  );
}

const chartColors = [
  '#FFD600', '#FF6384', '#36A2EB', '#FFCE56', '#43A047',
  '#00BCD4', '#E91E63', '#9C27B0', '#FF9800'
];

const categoryIcons = {
  'Ăn uống': 'silverware-fork-knife',
  'Travel': 'airplane',
  'Chợ, siêu thị': 'shopping',
  'Nhà cửa': 'home-city-outline',
  'Người thân': 'account-heart-outline',
  'Khác': 'wallet-outline',
  'skincare': 'face-woman-outline'
};

const styles = StyleSheet.create({
  bg: { backgroundColor: '#181818', flex: 1 },
  container: { flex: 1, alignItems: 'center', padding: 18, paddingBottom: 40 },

  tabRow: { flexDirection: 'row', justifyContent: 'center', marginBottom: 12, marginTop: 8 },
  tabButton: { paddingHorizontal: 24, paddingVertical: 7, borderRadius: 18 },
  tabActive: { backgroundColor: '#FFD600' },
  tabText: { color: '#FFD600', fontWeight: 'bold', fontSize: 16 },
  tabTextActive: { color: '#181818' },

  headerRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    width: '100%', marginTop: 8, marginBottom: 10
  },
  headerMonth: { fontSize: 18, fontWeight: 'bold', color: '#FFD600', marginLeft: 2 },

  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 10
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#232323',
    borderRadius: 13,
    paddingVertical: 18,
    paddingHorizontal: 10,
    marginHorizontal: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.2,
    borderColor: '#FFD600',
    elevation: 2,
    shadowColor: '#FFD600',
    shadowOpacity: 0.13,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 }
  },
  summaryIconBox: {
    backgroundColor: '#FFD60022',
    width: 36,
    height: 36,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6
  },
  summaryLabel: { fontSize: 14, color: '#FFD600', marginBottom: 2, fontWeight: 'bold', letterSpacing: 0.5 },
  summaryValue: { fontSize: 20, fontWeight: 'bold', marginTop: 3 },

  // So sánh
  compareRowWrapper: {
    flexDirection: 'row',
    width: '100%',
    marginBottom: 14,
    marginTop: 2,
    justifyContent: 'space-between'
  },
  compareBox: {
    flex: 1,
    backgroundColor: '#232323',
    marginHorizontal: 2,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: '#FFD60055',
    alignItems: 'center'
  },
  compareLabel: { fontSize: 12, fontWeight: 'bold', letterSpacing: 0.5 },
  compareDelta: { fontSize: 14, fontWeight: 'bold' },
  comparePlaceholder: { color: '#FFD60077', fontStyle: 'italic', marginTop: 4 },

  funcButtonSection: { width: '100%', marginBottom: 9, marginTop: 6 },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginTop: 0,
    marginBottom: 8,
    width: '100%'
  },
  functionBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#181818',
    borderRadius: 18,
    paddingVertical: 13,
    paddingHorizontal: 8,
    marginHorizontal: 3,
    borderWidth: 1.2,
    borderColor: '#FFD60099',
    minWidth: 78,
    maxWidth: 140,
    elevation: 1,
    shadowColor: '#FFD600',
    shadowOpacity: 0.04,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 }
  },
  functionLabel: {
    color: '#FFD600',
    fontWeight: 'bold',
    fontSize: 13,
    marginTop: 1,
    letterSpacing: 0.5
  },

  chartCard: {
    width: '100%',
    backgroundColor: '#232323',
    borderRadius: 24,
    marginTop: 4,
    paddingVertical: 10,
    alignItems: 'stretch',
    elevation: 1,
    shadowColor: '#FFD600',
    shadowOpacity: 0.09,
    shadowRadius: 7,
    shadowOffset: { width: 0, height: 2 },
    borderWidth: 1.5,
    borderColor: '#FFD600',
    paddingLeft: chartCardPadding,
    paddingRight: chartCardPadding
  },
  centerPieChartBox: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 0,
    overflow: 'visible'
  },
  legendBox: { marginTop: 8, width: '92%' },
  legendRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 2, marginLeft: 8 },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 7,
    borderWidth: 1.2,
    borderColor: '#FFD600'
  },
  legendText: { fontSize: 14, color: '#FFD600' },
  noData: {
    color: '#FFD600',
    marginTop: 18,
    fontStyle: 'italic',
    fontSize: 16,
    textAlign: 'center'
  },

  detailToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
    marginBottom: 2,
    width: '100%',
    paddingVertical: 8
  },
  detailTitle: { fontSize: 16, fontWeight: 'bold', color: '#FFD600', marginRight: 5 },
  detailList: {
    width: '100%',
    backgroundColor: '#232323',
    borderRadius: 18,
    marginBottom: 22,
    paddingTop: 0,
    paddingHorizontal: 12,
    paddingBottom: 12,
    shadowColor: '#FFD600',
    shadowOpacity: 0.09,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    borderWidth: 1.5,
    borderColor: '#FFD600'
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 0.6,
    borderColor: '#FFD60055',
    paddingHorizontal: 2
  },

  budgetWarningBlock: {
    marginTop: 18,
    backgroundColor: '#2c1a1a',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E91E63',
    padding: 12,
    width: '100%'
  },
  budgetWarningTitle: {
    color: '#E91E63',
    fontWeight: 'bold',
    marginBottom: 5,
    fontSize: 15
  },
  budgetWarningRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 3 },

  // Reminder modal styles
  reminderModal: {
    backgroundColor: '#232323',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#FFD600',
    marginHorizontal: 22,
    marginTop: 80,
    padding: 18,
    maxHeight: 350
  },
  reminderTitle: { color: '#FFD600', fontWeight: 'bold', fontSize: 18, marginBottom: 10 },
  reminderEmpty: { color: '#FFD60099', fontStyle: 'italic' },
  reminderRow: {
    borderBottomWidth: 0.7,
    borderColor: '#FFD60033',
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center'
  },
  reminderRowTitle: { color: '#FFD600', fontWeight: 'bold', fontSize: 15 },
  reminderRowDesc: { color: '#FFD60099', fontSize: 13 },
  reminderRowDate: { color: '#FFD60077', fontSize: 13 }
});