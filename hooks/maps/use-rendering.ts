import { useState } from "react";

// 1. นิยาม Interface ให้ชัดเจนและยืดหยุ่นขึ้น
interface RenderItem {
  id: number;
  label: string;
  value: string;
}

interface RenderingState {
  count: number;
  components: RenderItem[];
}

const useRendering = () => {
  const [state, setState] = useState<RenderingState>({
    count: 0,
    components: [],
  });

  // ฟังก์ชันภายในสำหรับสร้างอาเรย์ข้อมูล (ขยับลอจิกออกจากหน้าจอ)
  const generateComponentList = (totalCount: number): RenderItem[] => {
    const list: RenderItem[] = [];
    
    const loopArray = Array.from({ length: totalCount });
    loopArray.forEach((_, index) => {
      const componentNo = totalCount - index; // เรียงลำดับจากมากไปน้อย
      list.push({
        id: componentNo,
        label: `Component No ${componentNo}`,
        value: `Rendering Test No ${componentNo}`,
      });
    });

    return list;
  };

  const addComponent = (numberToAdd: number) => {
    setState((prevState) => {
      const newCount = prevState.count + numberToAdd;
      return {
        count: newCount,
        components: generateComponentList(newCount), // สั่งเจนชุดข้อมูลใหม่ทันทีที่ State เปลี่ยน
      };
    });
  };

  return {
    components: state.components, // ส่งออกอาเรย์พร้อมใช้วาด UI ทันที
    addComponent,
  };
};

export { useRendering, RenderItem };