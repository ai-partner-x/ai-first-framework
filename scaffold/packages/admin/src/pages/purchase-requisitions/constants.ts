/** 物料选项（模拟） */
export const materialOptions = [
  { code: "IT-001", name: 'MacBook Pro 14" M3', unit: "台", price: 18900 },
  { code: "IT-015", name: 'Dell 27" 4K显示器', unit: "台", price: 3500 },
  { code: "IT-032", name: "无线键鼠套装", unit: "套", price: 299 },
  { code: "OF-023", name: "A4复印纸 80g", unit: "包", price: 25 },
  { code: "FN-008", name: "人体工学办公椅", unit: "把", price: 2800 },
];

export const priorityOptions = [
  { value: "low", label: "低" },
  { value: "normal", label: "普通" },
  { value: "high", label: "高" },
  { value: "urgent", label: "紧急" },
];

export const purchaseOrgOptions = [
  { value: "1000", label: "1000 - 总部采购组织" },
  { value: "2000", label: "2000 - 华东采购组织" },
];

export const statusConfig = {
  draft: { label: "草稿", color: "gray" as const },
  pending: { label: "待审批", color: "yellow" as const },
  approved: { label: "已批准", color: "green" as const },
  rejected: { label: "已拒绝", color: "red" as const },
  processing: { label: "处理中", color: "blue" as const },
};

export interface LineItem {
  id: string;
  lineNum?: number;
  materialCode: string;
  materialName: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  amount: number;
  deliveryDate: string;
  note?: string;
}

export interface WorkflowStep {
  step: number;
  title: string;
  user: string;
  time: string;
  status: "completed" | "current" | "pending";
}

export const formatAmount = (amount: number) => `¥${amount.toLocaleString()}`;
