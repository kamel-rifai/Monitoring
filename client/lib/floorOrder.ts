// Custom floor order configuration
export const FLOOR_ORDER = [
  10, // الطابق العاشر
  9, // الطابق التاسع
  8, // الطابق الثامن
  7, // الطابق السابع
  6, // الطابق السادس
  5, // الطابق الخامس
  4, // الطابق الرابع
  13,
  14,
  3, // كبين ال IT
  2, // الطابق الثاني
  12, // كبين الاسعاف
  11, // العيادات
  1, // الطابق الأرضي
  0, // Underground Floor // كبين التدريب
];

// Function to sort floors according to custom order
export const sortFloorsByCustomOrder = (floors: number[]): number[] => {
  return floors.sort((a, b) => {
    const aIndex = FLOOR_ORDER.indexOf(a);
    const bIndex = FLOOR_ORDER.indexOf(b);

    // If floor is not in the custom order, put it at the end
    if (aIndex === -1 && bIndex === -1) return a - b;
    if (aIndex === -1) return 1;
    if (bIndex === -1) return -1;

    return aIndex - bIndex;
  });
};

// Floor title mapping
export const getFloorTitle = (floor: number): string => {
  switch (floor) {
    case 0:
      return "Underground Floor";
    case 1:
      return "الطابق الأرضي";
    case 2:
      return "الطابق الثاني";
    case 3:
      return "كبين التدريب";
    case 4:
      return "الطابق الرابع";
    case 5:
      return "الطابق الخامس";
    case 6:
      return "الطابق السادس";
    case 7:
      return "الطابق السابع";
    case 8:
      return "الطابق الثامن";
    case 9:
      return "الطابق التاسع";
    case 10:
      return "الطابق العاشر";
    case 11:
      return "العيادات";
    case 12:
      return "كبين الاسعاف";
    case 13:
      return "IT Section";
    case 14:
      return "Server Room";
    default:
      return `Floor ${floor}`;
  }
};
