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

export const MODULE_EXTRA_FIELDS = {
  organization: [
    { id: "department", en: "Department", zh: "部门", type: "text" },
    { id: "position", en: "Position", zh: "岗位", type: "text" },
    { id: "permission", en: "Permission Scope", zh: "权限范围", type: "textarea", full: true }
  ],
  documents: [
    { id: "documentNo", en: "Document No.", zh: "文件编号", type: "text" },
    { id: "version", en: "Version", zh: "版本", type: "text" },
    { id: "requiredDocs", en: "Required Documents", zh: "必须文件", type: "textarea", full: true },
    { id: "receivedDocs", en: "Received Documents", zh: "已收文件", type: "textarea", full: true }
  ],
  procurement: [
    { id: "supplier", en: "Supplier", zh: "供应商", type: "text" },
    { id: "item", en: "Purchase Item", zh: "采购物料", type: "text" },
    { id: "quantity", en: "Quantity", zh: "数量", type: "number" },
    { id: "amount", en: "Amount", zh: "金额", type: "number" },
    { id: "requiredDocs", en: "Required Docs", zh: "必须文件", type: "textarea", full: true },
    { id: "receivedDocs", en: "Received Docs", zh: "已收文件", type: "textarea", full: true }
  ],
  warehouse: [
    { id: "sku", en: "SKU", zh: "物料/产品编码", type: "text" },
    { id: "batchNo", en: "Batch No.", zh: "批次号", type: "text" },
    { id: "quantity", en: "Current Stock", zh: "当前库存", type: "number" },
    { id: "reorderLevel", en: "Safety Stock", zh: "安全库存", type: "number" },
    { id: "expiryDate", en: "Expiry Date", zh: "有效期", type: "date" },
    { id: "location", en: "Location", zh: "库位", type: "text" }
  ],
  production: [
    { id: "product", en: "Product", zh: "产品", type: "text" },
    { id: "batchNo", en: "Batch No.", zh: "生产批次", type: "text" },
    { id: "quantity", en: "Planned Qty", zh: "计划数量", type: "number" },
    { id: "actualQuantity", en: "Actual Qty", zh: "实际数量", type: "number" },
    { id: "lossRate", en: "Loss Rate %", zh: "损耗率 %", type: "number" }
  ],
  sales: [
    { id: "customer", en: "Customer", zh: "客户", type: "text" },
    { id: "product", en: "Product", zh: "产品", type: "text" },
    { id: "amount", en: "Quote / Order Amount", zh: "报价/订单金额", type: "number" },
    { id: "paymentDue", en: "Payment Due", zh: "回款日期", type: "date" },
    { id: "nextFollowUp", en: "Next Follow-up", zh: "下次跟进", type: "date" }
  ],
  finance: [
    { id: "transactionType", en: "Type", zh: "类型", type: "text" },
    { id: "party", en: "Customer / Supplier", zh: "客户/供应商", type: "text" },
    { id: "amount", en: "Amount", zh: "金额", type: "number" },
    { id: "paymentDue", en: "Payment Due", zh: "收/付款到期日", type: "date" }
  ],
  import_export: [
    { id: "shipmentNo", en: "Shipment No.", zh: "货运编号", type: "text" },
    { id: "supplier", en: "Supplier", zh: "供应商", type: "text" },
    { id: "port", en: "Port", zh: "港口", type: "text" },
    { id: "eta", en: "ETA", zh: "预计到港", type: "date" },
    { id: "requiredDocs", en: "Required Documents", zh: "必须单证", type: "textarea", full: true },
    { id: "receivedDocs", en: "Received Documents", zh: "已收单证", type: "textarea", full: true }
  ],
  logistics: [
    { id: "deliveryNo", en: "Delivery No.", zh: "发货单号", type: "text" },
    { id: "customer", en: "Customer", zh: "客户", type: "text" },
    { id: "driver", en: "Driver / Vehicle", zh: "司机/车辆", type: "text" },
    { id: "quantity", en: "Delivery Qty", zh: "发货数量", type: "number" },
    { id: "eta", en: "Expected Delivery", zh: "预计签收", type: "date" }
  ],
  hr: [
    { id: "employee", en: "Employee / Candidate", zh: "员工/候选人", type: "text" },
    { id: "department", en: "Department", zh: "部门", type: "text" },
    { id: "position", en: "Position", zh: "岗位", type: "text" },
    { id: "trainingDue", en: "Training / Certificate Due", zh: "培训/证件到期", type: "date" }
  ],
  maintenance: [
    { id: "equipment", en: "Equipment", zh: "设备名称", type: "text" },
    { id: "equipmentNo", en: "Equipment No.", zh: "设备编号", type: "text" },
    { id: "maintenanceDue", en: "Maintenance Due", zh: "保养到期", type: "date" },
    { id: "downtimeHours", en: "Downtime Hours", zh: "停机小时", type: "number" },
    { id: "sparePart", en: "Spare Part", zh: "备件", type: "text" }
  ],
  lab: [
    { id: "sampleNo", en: "Sample No.", zh: "样品编号", type: "text" },
    { id: "product", en: "Product / Material", zh: "产品/原料", type: "text" },
    { id: "testItem", en: "Test Item", zh: "检测项目", type: "text" },
    { id: "result", en: "Result", zh: "检测结果", type: "text" },
    { id: "coaNo", en: "COA No.", zh: "COA 编号", type: "text" }
  ],
  affairs: [
    { id: "meeting", en: "Meeting / Source", zh: "会议/来源", type: "text" },
    { id: "decision", en: "Decision", zh: "决定事项", type: "textarea", full: true },
    { id: "nextStep", en: "Next Step", zh: "下一步", type: "textarea", full: true }
  ]
};

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
