import { useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { markTaskNotified } from '../features/settingsSlice';
import { triggerCyborgNotification } from '../services/notificationService';

export function useNotificationMonitor() {
  const dispatch = useAppDispatch();
  const tasks = useAppSelector((state) => state.tasks.tasksList);
  const { notificationsEnabled, defaultOffsetMinutes, notifiedTaskIds } = useAppSelector(
    (state) => state.settings
  );

  useEffect(() => {
    if (!notificationsEnabled) return;

    const interval = setInterval(() => {
      const now = new Date();

      tasks.forEach((task) => {
        if (task.status === 'COMPLETED') return;

        // 1. Kiểm tra mốc Reminder cụ thể (YYYY-MM-DDTHH:mm)
        if (task.reminder_time) {
          const reminderDate = new Date(task.reminder_time);
          const diffMinutes = (reminderDate.getTime() - now.getTime()) / 60000;

          // Báo trước trong phạm vi 1 phút của mốc reminder
          if (diffMinutes <= 0 && diffMinutes > -2) {
            const alertKey = `${task.id}_reminder`;
            if (!notifiedTaskIds.includes(alertKey)) {
              triggerCyborgNotification(
                task.title,
                `Thời gian nhắc nhở đã kích hoạt cho mục tiêu này.`
              );
              dispatch(markTaskNotified(alertKey));
            }
          }
        }

        // 2. Kiểm tra trước Deadline (due_date) theo số phút mặc định
        if (task.due_date) {
          // Xử lý cả định dạng YYYY-MM-DD và YYYY-MM-DDTHH:mm
          const deadlineTime = task.due_date.includes('T')
            ? new Date(task.due_date).getTime()
            : new Date(`${task.due_date}T23:59:59`).getTime();

          const minutesUntilDeadline = (deadlineTime - now.getTime()) / 60000;

          // Kích hoạt khi thời gian còn lại nhỏ hơn hoặc bằng cấu hình mặc định (nhưng chưa quá 3 tiếng)
          if (minutesUntilDeadline > 0 && minutesUntilDeadline <= defaultOffsetMinutes) {
            const alertKey = `${task.id}_deadline_${defaultOffsetMinutes}`;
            if (!notifiedTaskIds.includes(alertKey)) {
              triggerCyborgNotification(
                task.title,
                `Mục tiêu sắp hết hạn! Còn lại dưới ${Math.round(minutesUntilDeadline)} phút.`
              );
              dispatch(markTaskNotified(alertKey));
            }
          }

          // 3. Nhắc công việc đã quá hạn
          if (minutesUntilDeadline < 0 && minutesUntilDeadline > -60) {
            const alertKey = `${task.id}_overdue`;
            if (!notifiedTaskIds.includes(alertKey)) {
              triggerCyborgNotification(
                `CRITICAL OVERDUE: ${task.title}`,
                `Công việc chưa hoàn thành đã quá hạn thực thi!`
              );
              dispatch(markTaskNotified(alertKey));
            }
          }
        }
      });
    }, 15000); // Quét mỗi 15 giây

    return () => clearInterval(interval);
  }, [tasks, notificationsEnabled, defaultOffsetMinutes, notifiedTaskIds, dispatch]);
}