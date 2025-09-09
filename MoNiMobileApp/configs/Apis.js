import axios from 'axios';

export const BASE_URL = "http://192.168.100.179:8000/";
// export const BASE_URL = "http://10.17.42.131:8000";

export const endpoints = {
  login: '/user/login/',
  register: '/user/register/',
  profile: '/user/profile/',
  sendRegisterOtp: '/user/send-register-otp/',
  sendForgotPasswordOtp: '/user/send-forgot-password-otp/',
  verifyOtp: '/user/verify-otp/',
  resetPassword: '/user/reset-password/',
  categories: '/Category/',
  transactions: '/Transaction/',
  transactionsFilter: '/transactions/filter/',
  notes: '/Note/',
  reminders: '/Reminder/',
  reminderDetail: (id) => `/Reminder/${id}/`,
  budgetLimits: '/BudgetLimit/',
  statisticsOverview: '/statistics/overview/',
  statisticsWeeklySummary: '/statistics/weekly-summary/',
  statisticsMonthly: (month) => `/statistics/monthly-report/?month=${month}`,
  categoryDetail: (id) => `/Category/${id}/`,
  transactionDetail: (id) => `/Transaction/${id}/`,
  notes: '/Note/',
  noteDetail: (id) => `/Note/${id}/`,
};

export const authApi = (token) =>
  axios.create({
    baseURL: BASE_URL,
    headers: {
      'Authorization': `Bearer ${token}`,
    }
  });

export default axios.create({
  baseURL: BASE_URL,
});