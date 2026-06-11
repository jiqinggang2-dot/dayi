export const MODULES = [
  { id: "organization", zh: "组织架构", en: "Organization", index: "01" },
  { id: "documents", zh: "文件管理制度", en: "Document Control", index: "02" },
  { id: "procurement", zh: "采购管理", en: "Procurement", index: "03" },
  { id: "warehouse", zh: "仓库管理", en: "Warehouse", index: "04" },
  { id: "production", zh: "生产管理", en: "Production", index: "05" },
  { id: "sales", zh: "销售管理", en: "Sales / CRM", index: "06" },
  { id: "finance", zh: "财务管理", en: "Finance", index: "07" },
  { id: "import_export", zh: "进出口管理", en: "Import & Export", index: "08" },
  { id: "logistics", zh: "物流运输管理", en: "Logistics", index: "09" },
  { id: "hr", zh: "人事管理", en: "HR", index: "10" },
  { id: "maintenance", zh: "设备维护管理", en: "Maintenance", index: "11" },
  { id: "lab", zh: "实验室管理", en: "Laboratory / QC", index: "12" },
  { id: "affairs", zh: "实时事务管理", en: "Real-time Affairs", index: "13" }
];

export const STATUSES = [
  { id: "not_started", zh: "未开始", en: "Not Started" },
  { id: "in_progress", zh: "进行中", en: "In Progress" },
  { id: "pending_approval", zh: "待审批", en: "Pending Approval" },
  { id: "approved", zh: "已批准", en: "Approved" },
  { id: "completed", zh: "已完成", en: "Completed" },
  { id: "exception", zh: "异常", en: "Exception" }
];

export const RISKS = [
  { id: "low", zh: "低", en: "Low" },
  { id: "medium", zh: "中", en: "Medium" },
  { id: "high", zh: "高", en: "High" },
  { id: "critical", zh: "严重", en: "Critical" }
];

export const ROLE_SEEDS = [
  {
    id: "super_admin",
    zh: "CEO / 超级管理员",
    en: "CEO / Super Admin",
    moduleIds: MODULES.map((module) => module.id),
    isSuperAdmin: true,
    canManageUsers: true
  },
  {
    id: "general_manager",
    zh: "总经理",
    en: "General Manager",
    moduleIds: MODULES.map((module) => module.id).filter((id) => id !== "finance"),
    canManageUsers: false
  },
  { id: "procurement_manager", zh: "采购经理", en: "Procurement Manager", moduleIds: ["procurement", "warehouse", "import_export"] },
  { id: "warehouse_manager", zh: "仓库主管", en: "Warehouse Supervisor", moduleIds: ["warehouse", "procurement", "logistics"] },
  { id: "production_manager", zh: "生产经理", en: "Production Manager", moduleIds: ["production", "warehouse", "maintenance", "lab"] },
  { id: "qc_manager", zh: "质量/实验室负责人", en: "QC / Lab Manager", moduleIds: ["lab", "production", "documents"] },
  { id: "sales_manager", zh: "销售经理", en: "Sales Manager", moduleIds: ["sales", "warehouse", "logistics"] },
  { id: "finance_manager", zh: "财务经理", en: "Finance Manager", moduleIds: ["finance", "procurement", "sales", "import_export"] },
  { id: "import_export_manager", zh: "进出口负责人", en: "Import/Export Manager", moduleIds: ["import_export", "procurement", "warehouse", "logistics"] },
  { id: "logistics_coordinator", zh: "物流运输协调", en: "Logistics Coordinator", moduleIds: ["logistics", "warehouse", "sales"] },
  { id: "hr_admin", zh: "人事行政", en: "HR Admin", moduleIds: ["hr", "organization", "documents"] },
  { id: "maintenance_supervisor", zh: "设备维护主管", en: "Maintenance Supervisor", moduleIds: ["maintenance", "production", "warehouse"] }
];

export function labelFor(item, lang = "en") {
  return lang === "zh" ? item.zh : item.en;
}

export function moduleById(id) {
  return MODULES.find((module) => module.id === id);
}

export function optionLabel(options, id, lang = "en") {
  const item = options.find((option) => option.id === id);
  return item ? labelFor(item, lang) : id || "";
}

export function accessibleModulesFor(profile) {
  if (!profile?.role) return [];
  if (profile.role.is_super_admin) return MODULES;
  const ids = profile.role.module_ids || [];
  return MODULES.filter((module) => ids.includes(module.id));
}
