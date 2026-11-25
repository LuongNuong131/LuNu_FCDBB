import { ref } from "vue";
import api from "../api";
import { formatFieldDistance } from "../utils/football";
import { useToast } from "./useToast";

export const useCheckin = () => {
  const checking = ref(false);
  const { addToast } = useToast();

  const checkin = async (matchId, onSuccess) => {
    if (!navigator.geolocation)
      return addToast("Trình duyệt không hỗ trợ định vị.", "warning");
    if (checking.value) return;
    checking.value = true;
    try {
      const { coords } = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0,
        });
      });
      const { data } = await api.post("/attendance/checkin", {
        matchId,
        lat: coords.latitude,
        lng: coords.longitude,
      });
      addToast(
        `Điểm danh thành công · Cách sân ${formatFieldDistance(data.distance)}.`,
        "success",
      );
      await onSuccess();
    } catch (e) {
      addToast(
        e.response?.data?.message ||
          (e.code === 1
            ? "Cho phép truy cập vị trí để điểm danh."
            : e.code === 2 || e.code === 3
              ? "Chưa lấy được vị trí. Bật GPS và thử lại."
              : "Không thể điểm danh. Thử lại."),
        "error",
      );
    } finally {
      checking.value = false;
    }
  };

  return { checking, checkin };
};
