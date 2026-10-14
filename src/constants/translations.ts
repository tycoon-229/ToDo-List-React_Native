export interface TranslationSchema {
  // Navigation & Drawer
  tasksDb: string;
  sysMenu: string;
  systemControl: string;
  profileSettings: string;
  timeline: string;
  focusMode: string;
  telemetry: string;
  categories: string;
  quarantineVault: string;
  alertSystem: string;
  alertStatus: string;
  alertActive: string;
  alertMuted: string;
  defaultOffset: string;
  testSignal: string;
  disconnect: string;
  backHome: string;
  return: string;
  profile: string;

  // Search & Filter Matrix
  searchPlaceholder: string;
  matched: string;
  filterMatrix: string;
  resetAll: string;
  status: string;
  priority: string;
  category: string;
  all: string;
  todo: string;
  completed: string;
  critical: string;
  current: string;
  future: string;
  deadlineSort: string;
  sortAsc: string;
  sortDefault: string;

  // Task & Forms
  addNode: string;
  initNewTask: string;
  title: string;
  titlePlaceholder: string;
  description: string;
  descPlaceholder: string;
  tags: string;
  tagsPlaceholder: string;
  deadline: string;
  reminder: string;
  recurrence: string;
  execute: string;
  cancel: string;
  save: string;
  noTasksMatched: string;
  clearFilters: string;
  editNode: string;
  modifyNode: string;
  subtasksProtocol: string;
  addSubtaskPlaceholder: string;

  // Calendar / Timeline
  statusFilter: string;
  timeFilter: string;
  criticalOverdue: string;
  currentCycle: string;
  futureNodes: string;
  unscheduled: string;
  allNodes: string;
  noDataFound: string;

  // Focus Screen
  focusTitle: string;
  targetNode: string;
  generalSession: string;
  focusTab: string;
  shortBreakTab: string;
  longBreakTab: string;
  protocolFocus: string;
  protocolBreak: string;
  elapsed: string;
  cyclesCompleted: string;
  pauseProtocol: string;
  engageFocus: string;
  reset: string;
  hideConfig: string;
  showConfig: string;
  customDurationMatrix: string;
  focusLabel: string;
  shortBreakLabel: string;
  longBreakLabel: string;
  applyDurations: string;
  focusIntel: string;
  focusingOn: string;
  generalFocusDesc: string;

  // Analytics Screen
  telemetryTitle: string;
  efficiencyIndex: string;
  statusOptimal: string;
  statusNominal: string;
  statusDegraded: string;
  totalNodes: string;
  inProgress: string;
  overdue: string;
  productivityGraph: string;
  dayTab: string;
  weekTab: string;
  monthTab: string;
  total: string;
  categoryAllocation: string;
  noCategoriesLogged: string;
  nodesLabel: string;

  // Categories Screen
  categoriesTitle: string;
  addNewCategory: string;
  edit: string;
  del: string;
  newCategoryHeader: string;
  editCategoryHeader: string;
  categoryNameLabel: string;
  categoryNamePlaceholder: string;
  colorThemeLabel: string;

  // Quarantine Screen
  quarantineTitle: string;
  isolatedNodes: string;
  purgeAllVault: string;
  deletedPrefix: string;
  restoreNode: string;
  purgeForever: string;
  vaultEmpty: string;
  vaultEmptySub: string;

  // Auth
  login: string;
  register: string;
  email: string;
  password: string;
  noAccount: string;
  hasAccount: string;
  registerNow: string;
  backToLogin: string;
}

export const translations: Record<'VI' | 'EN', TranslationSchema> = {
  VI: {
    // Navigation & Drawer
    tasksDb: 'CÔNG VIỆC',
    sysMenu: '[ ≡ BẢNG_ĐIỀU_KHIỂN ]',
    systemControl: 'HỆ_THỐNG_ĐIỀU_KHIỂN //',
    profileSettings: '> CÀI ĐẶT HỒ SƠ_',
    timeline: '> LỊCH TRÌNH_',
    focusMode: '> CHẾ ĐỘ TẬP TRUNG_',
    telemetry: '> THỐNG KÊ TIẾN ĐỘ_',
    categories: '> DANH MỤC_',
    quarantineVault: '> VÙNG CÁCH LY_',
    alertSystem: 'HỆ THỐNG CẢNH BÁO //:',
    alertStatus: 'TRẠNG THÁI:',
    alertActive: 'KÍCH HOẠT',
    alertMuted: 'TẮT TIẾNG',
    defaultOffset: 'BÁO TRƯỚC HẠN //:',
    testSignal: '> KIỂM TRA TÍN HIỆU CẢNH BÁO',
    disconnect: '> NGẮT KẾT NỐI (ĐĂNG XUẤT)_',
    backHome: '< SYS_HOME',
    return: '< QUAY LẠI',
    profile: 'HỒ SƠ CÁ NHÂN',

    // Search & Filter
    searchPlaceholder: 'TRUY VẤN //: gõ tên, mô tả hoặc tag...',
    matched: 'KHỚP:',
    filterMatrix: '[ MA TRẬN LỌC ]',
    resetAll: '[ ĐẶT LẠI ]',
    status: 'TRẠNG THÁI //:',
    priority: 'ĐỘ ƯU TIÊN //:',
    category: 'DANH MỤC //:',
    all: 'TẤT CẢ',
    todo: 'CHƯA XONG',
    completed: 'ĐÃ XONG',
    critical: 'KHẨN CẤP',
    current: 'HÔM NAY',
    future: 'SẮP TỚI',
    deadlineSort: 'HẠN CHÓT:',
    sortAsc: 'TĂNG DẦN',
    sortDefault: 'MẶC ĐỊNH',

    // Task & Forms
    addNode: 'THÊM MỤC TIÊU MỚI',
    initNewTask: 'KHỞI TẠO NHIỆM VỤ MỚI //',
    title: 'TIÊU ĐỀ //:',
    titlePlaceholder: 'Nhập tiêu đề...',
    description: 'MÔ TẢ //:',
    descPlaceholder: 'Nhập mô tả...',
    tags: 'TAGS (PHÂN CÁCH BẰNG DẤU PHẨY) //:',
    tagsPlaceholder: 'frontend, bug, v1.0...',
    deadline: 'HẠN CHÓT //:',
    reminder: 'GIỜ NHẮC //:',
    recurrence: 'CHU KỲ LẶP LẠI //:',
    execute: 'THỰC THI',
    cancel: 'HỦY BỎ',
    save: 'LƯU',
    noTasksMatched: 'KHÔNG TÌM THẤY DỮ LIỆU PHÙ HỢP //',
    clearFilters: '[ XÓA BỘ LỌC ]',
    editNode: 'CHỈNH SỬA NODE',
    modifyNode: 'CẬP NHẬT DỮ LIỆU',
    subtasksProtocol: 'DANH SÁCH CÔNG VIỆC CON //',
    addSubtaskPlaceholder: 'Thêm node con mới...',

    // Calendar / Timeline
    statusFilter: 'LỌC TRẠNG THÁI //:',
    timeFilter: 'LỌC THỜI GIAN //:',
    criticalOverdue: '>>> QUÁ HẠN KHẨN CẤP //:',
    currentCycle: '>>> CHU KỲ HÔM NAY //:',
    futureNodes: '>>> NHIỆM VỤ SẮP TỚI //:',
    unscheduled: '>>> CHƯA CÓ LỊCH TRÌNH //:',
    allNodes: 'TẤT CẢ',
    noDataFound: 'KHÔNG TÌM THẤY DỮ LIỆU LỊCH TRÌNH //',

    // Focus Screen
    focusTitle: 'CHẾ ĐỘ TẬP TRUNG',
    targetNode: 'MỤC TIÊU //:',
    generalSession: '[ PHIÊN TẬP TRUNG CHUNG ]',
    focusTab: 'TẬP TRUNG',
    shortBreakTab: 'NGHỈ NGẮN',
    longBreakTab: 'NGHỈ DÀI',
    protocolFocus: '>>> GIAO THỨC: TẬP TRUNG CAO ĐỘ <<<',
    protocolBreak: '>>> GIAO THỨC: NẠP LẠI NĂNG LƯỢNG <<<',
    elapsed: 'TIẾN ĐỘ:',
    cyclesCompleted: 'CHU KỲ HOÀN THÀNH:',
    pauseProtocol: 'TẠM DỪNG',
    engageFocus: 'BẮT ĐẦU TẬP TRUNG',
    reset: 'ĐẶT LẠI',
    hideConfig: '[ ẨN CẤU HÌNH ▲ ]',
    showConfig: '[ TÙY CHỈNH THỜI LƯỢNG ▼ ]',
    customDurationMatrix: 'MA TRẬN THỜI GIAN (PHÚT) //:',
    focusLabel: 'TẬP TRUNG //:',
    shortBreakLabel: 'NGHỈ NGẮN //:',
    longBreakLabel: 'NGHỈ DÀI //:',
    applyDurations: '> ÁP DỤNG THỜI GIAN MỚI <',
    focusIntel: 'THÔNG TIN PHIÊN //',
    focusingOn: 'Đang dồn năng lượng xử lý node:',
    generalFocusDesc: 'Chưa gắn với node cụ thể. Phiên tập trung sẽ được ghi nhận vào hiệu suất chung.',

    // Analytics Screen
    telemetryTitle: 'THỐNG KÊ TIẾN ĐỘ',
    efficiencyIndex: 'CHỈ SỐ HIỆU SUẤT //',
    statusOptimal: 'TỐI ƯU',
    statusNominal: 'BÌNH THƯỜNG',
    statusDegraded: 'GIẢM SÚT',
    totalNodes: 'TỔNG SỐ NODE',
    inProgress: 'ĐANG XỬ LÝ',
    overdue: 'QUÁ HẠN',
    productivityGraph: 'BIỂU ĐỒ NĂNG SUẤT //',
    dayTab: 'NGÀY',
    weekTab: 'TUẦN',
    monthTab: 'THÁNG',
    total: 'TỔNG',
    categoryAllocation: 'PHÂN BỔ DANH MỤC //',
    noCategoriesLogged: 'CHƯA CÓ DANH MỤC NÀO ĐƯỢC GHI NHẬN',
    nodesLabel: 'MỤC TIÊU',

    // Categories Screen
    categoriesTitle: 'DANH MỤC',
    addNewCategory: 'THÊM DANH MỤC MỚI',
    edit: 'SỬA',
    del: 'XÓA',
    newCategoryHeader: 'DANH MỤC MỚI //',
    editCategoryHeader: 'CHỈNH SỬA DANH MỤC //',
    categoryNameLabel: 'TÊN DANH MỤC //:',
    categoryNamePlaceholder: 'Học tập, Công việc...',
    colorThemeLabel: 'MÀU CHỦ ĐẠO //:',

    // Quarantine Screen
    quarantineTitle: 'VÙNG CÁCH LY',
    isolatedNodes: 'NODE BỊ CÔ LẬP:',
    purgeAllVault: '[ TIÊU HỦY TẤT CẢ ]',
    deletedPrefix: 'ĐÃ XÓA:',
    restoreNode: '> PHỤC HỒI NODE',
    purgeForever: '[ TIÊU HỦY VĨNH VIỄN ]',
    vaultEmpty: 'VÙNG CÁCH LY TRỐNG //',
    vaultEmptySub: 'Không có dữ liệu bị cô lập hoặc cần khôi phục.',

    // Auth
    login: 'ĐĂNG NHẬP',
    register: 'ĐĂNG KÝ',
    email: 'EMAIL //:',
    password: 'MẬT KHẨU //:',
    noAccount: 'Chưa có tài khoản?',
    hasAccount: 'Đã có tài khoản?',
    registerNow: '[ ĐĂNG KÝ NGAY ]',
    backToLogin: '[ QUAY LẠI LOGIN ]',
  },
  EN: {
    // Navigation & Drawer
    tasksDb: 'TASKS_DB',
    sysMenu: '[ ≡ SYS_MENU ]',
    systemControl: 'SYSTEM_CONTROL //',
    profileSettings: '> PROFILE_SETTINGS_',
    timeline: '> TIMELINE_',
    focusMode: '> FOCUS_MODE_',
    telemetry: '> TELEMETRY_STATS_',
    categories: '> CATEGORIES_',
    quarantineVault: '> QUARANTINE_VAULT_',
    alertSystem: 'ALERT_SYSTEM //:',
    alertStatus: 'STATUS:',
    alertActive: 'ACTIVE',
    alertMuted: 'MUTED',
    defaultOffset: 'DEFAULT_OFFSET //:',
    testSignal: '> TEST_ALERT_SIGNAL',
    disconnect: '> DISCONNECT (LOGOUT)_',
    backHome: '< SYS_HOME',
    return: '< RETURN',
    profile: 'PROFILE_HUB',

    // Search & Filter
    searchPlaceholder: 'SEARCH_QUERY //: type title, desc or tag...',
    matched: 'MATCHED:',
    filterMatrix: '[ FILTER_MATRIX ]',
    resetAll: '[ RESET_ALL ]',
    status: 'STATUS //:',
    priority: 'PRIORITY //:',
    category: 'CATEGORY //:',
    all: 'ALL',
    todo: 'TODO',
    completed: 'DONE',
    critical: 'CRITICAL',
    current: 'TODAY',
    future: 'UPCOMING',
    deadlineSort: 'DEADLINE:',
    sortAsc: 'ASC',
    sortDefault: 'DEFAULT',

    // Task & Forms
    addNode: 'ADD_NEW_NODE',
    initNewTask: 'INITIALIZE_NEW_TASK //',
    title: 'TITLE //:',
    titlePlaceholder: 'Enter title...',
    description: 'DESCRIPTION //:',
    descPlaceholder: 'Enter description...',
    tags: 'TAGS (COMMA_SEPARATED) //:',
    tagsPlaceholder: 'frontend, bug, v1.0...',
    deadline: 'DEADLINE //:',
    reminder: 'REMINDER_TIME //:',
    recurrence: 'RECURRENCE_PROTOCOL //:',
    execute: 'EXECUTE',
    cancel: 'CANCEL',
    save: 'SAVE',
    noTasksMatched: 'NO_NODES_MATCHED_QUERY //',
    clearFilters: '[ CLEAR_FILTERS ]',
    editNode: 'EDIT_NODE',
    modifyNode: 'MODIFY_NODE_DATA',
    subtasksProtocol: 'SUBTASKS_PROTOCOL //',
    addSubtaskPlaceholder: 'Add new subtask node...',

    // Calendar / Timeline
    statusFilter: 'STATUS_FILTER //:',
    timeFilter: 'TIME_FILTER //:',
    criticalOverdue: '>>> CRITICAL_OVERDUE //:',
    currentCycle: '>>> CURRENT_CYCLE (TODAY) //:',
    futureNodes: '>>> FUTURE_NODES (UPCOMING) //:',
    unscheduled: '>>> UNSCHEDULED //:',
    allNodes: 'ALL_NODES',
    noDataFound: 'NO_DATA_FOUND //',

    // Focus Screen
    focusTitle: 'CYBER_FOCUS',
    targetNode: 'TARGET_NODE //:',
    generalSession: '[ GENERAL_NEURAL_SESSION ]',
    focusTab: 'FOCUS',
    shortBreakTab: 'SHORT',
    longBreakTab: 'LONG',
    protocolFocus: '>>> PROTOCOL: DEEP_FOCUS <<<',
    protocolBreak: '>>> PROTOCOL: RECHARGE_ENERGY <<<',
    elapsed: 'ELAPSED:',
    cyclesCompleted: 'CYCLES_COMPLETED:',
    pauseProtocol: 'PAUSE_PROTOCOL',
    engageFocus: 'ENGAGE_FOCUS',
    reset: 'RESET',
    hideConfig: '[ HIDE_CUSTOM_CONFIG ▲ ]',
    showConfig: '[ CUSTOMIZE_DURATIONS_CONFIG ▼ ]',
    customDurationMatrix: 'CUSTOM_DURATION_MATRIX (MINUTES) //:',
    focusLabel: 'FOCUS //:',
    shortBreakLabel: 'SHORT_BREAK //:',
    longBreakLabel: 'LONG_BREAK //:',
    applyDurations: '> APPLY_DURATIONS_OVERWRITE <',
    focusIntel: 'FOCUS_SESSION_INTEL //',
    focusingOn: 'Focusing neural energy on node:',
    generalFocusDesc: 'Not attached to a specific node. Session will be logged generally.',

    // Analytics Screen
    telemetryTitle: 'TELEMETRY',
    efficiencyIndex: 'EFFICIENCY_INDEX //',
    statusOptimal: 'OPTIMAL',
    statusNominal: 'NOMINAL',
    statusDegraded: 'DEGRADED',
    totalNodes: 'TOTAL_NODES',
    inProgress: 'IN_PROGRESS',
    overdue: 'OVERDUE',
    productivityGraph: 'PRODUCTIVITY_GRAPH //',
    dayTab: 'DAY',
    weekTab: 'WEEK',
    monthTab: 'MONTH',
    total: 'TOTAL',
    categoryAllocation: 'CATEGORY_ALLOCATION //',
    noCategoriesLogged: 'NO_CATEGORIES_LOGGED',
    nodesLabel: 'NODES',

    // Categories Screen
    categoriesTitle: 'CATEGORIES',
    addNewCategory: 'ADD_NEW_CATEGORY',
    edit: 'EDIT',
    del: 'DEL',
    newCategoryHeader: 'NEW_CATEGORY //',
    editCategoryHeader: 'EDIT_CATEGORY //',
    categoryNameLabel: 'CATEGORY_NAME //:',
    categoryNamePlaceholder: 'Study, Work, Personal...',
    colorThemeLabel: 'COLOR_THEME //:',

    // Quarantine Screen
    quarantineTitle: 'QUARANTINE',
    isolatedNodes: 'ISOLATED_NODES:',
    purgeAllVault: '[ PURGE_ALL_VAULT ]',
    deletedPrefix: 'DELETED:',
    restoreNode: '> RESTORE_NODE',
    purgeForever: '[ PURGE_FOREVER ]',
    vaultEmpty: 'QUARANTINE_VAULT_IS_EMPTY //',
    vaultEmptySub: 'No isolated data or tasks to restore.',

    // Auth
    login: 'LOGIN',
    register: 'REGISTER',
    email: 'EMAIL //:',
    password: 'PASSWORD //:',
    noAccount: 'Need an identity?',
    hasAccount: 'Already operative?',
    registerNow: '[ REGISTER_NOW ]',
    backToLogin: '[ BACK_TO_LOGIN ]',
  }
};

export function formatDateTimeByZone(
  dateInput: string | Date | undefined | null,
  timezone: string = 'Asia/Ho_Chi_Minh',
  language: 'VI' | 'EN' = 'VI'
): string {
  if (!dateInput) return 'NONE';

  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return String(dateInput);

    return new Intl.DateTimeFormat(language === 'VI' ? 'vi-VN' : 'en-US', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(d);
  } catch {
    return String(dateInput);
  }
}