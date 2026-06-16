const SAMPLE_USER_NAMES = {
  gm_sample: { en: "General Manager Sample", zh: "总经理样例" },
  procurement_sample: { en: "Procurement Sample", zh: "采购负责人样例" },
  warehouse_sample: { en: "Warehouse Sample", zh: "仓库负责人样例" },
  production_sample: { en: "Production Sample", zh: "生产负责人样例" },
  qc_sample: { en: "QC Lab Sample", zh: "实验室负责人样例" },
  sales_sample: { en: "Sales Sample", zh: "销售负责人样例" },
  finance_sample: { en: "Finance Sample", zh: "财务负责人样例" },
  export_sample: { en: "Import Export Sample", zh: "进出口负责人样例" },
  logistics_sample: { en: "Logistics Sample", zh: "物流负责人样例" },
  hr_sample: { en: "HR Sample", zh: "人事负责人样例" },
  maintenance_sample: { en: "Maintenance Sample", zh: "设备维护负责人样例" }
};

const DOC_TRANSLATIONS = {
  "采购申请": "Purchase request",
  "供应商比价表": "Supplier comparison sheet",
  "采购订单模板": "Purchase order template",
  "发票": "Invoice",
  "装箱单": "Packing list",
  "提单": "Bill of lading",
  "原产地证": "Certificate of origin",
  "标签": "Label"
};

const STATUS_LABELS = {
  not_started: { en: "Not Started", zh: "未开始" },
  in_progress: { en: "In Progress", zh: "进行中" },
  pending_approval: { en: "Pending Approval", zh: "待审批" },
  approved: { en: "Approved", zh: "已批准" },
  completed: { en: "Completed", zh: "已完成" },
  exception: { en: "Exception", zh: "异常" }
};

const RISK_LABELS = {
  low: { en: "Low", zh: "低" },
  medium: { en: "Medium", zh: "中" },
  high: { en: "High", zh: "高" },
  critical: { en: "Critical", zh: "严重" }
};

function localizedData(data, key, lang, fallback = "") {
  if (!data) return fallback;
  return data[`${key}_${lang}`] ?? data[key] ?? fallback;
}

function displayUserName(user, lang) {
  if (!user) return "";
  return SAMPLE_USER_NAMES[user.username]?.[lang] || user.full_name || user.email || "Team member";
}

function recordTitle(record, lang) {
  return localizedData(record.data, "title", lang, record.title);
}

function recordContingency(record, lang) {
  return localizedData(record.data, "contingency", lang, record.contingency);
}

function translateDocs(docs, lang) {
  if (lang !== "en") return docs;
  return docs.map((doc) => DOC_TRANSLATIONS[doc] || doc);
}

function statusLabel(status, lang) {
  return STATUS_LABELS[status]?.[lang] || status || "-";
}

function riskLabel(risk, lang) {
  return RISK_LABELS[risk]?.[lang] || risk || "-";
}

export function daysUntil(dateValue) {
  if (!dateValue) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const date = new Date(`${dateValue}T00:00:00`);
  if (Number.isNaN(date.getTime())) return null;
  return Math.round((date - today) / 86400000);
}

export function recordScore(record) {
  const due = daysUntil(record.deadline);
  let score = 1;
  if (record.risk === "critical") score += 9;
  if (record.risk === "high") score += 5;
  if (record.status === "exception") score += 7;
  if (due !== null && due < 0) score += 8;
  if (due === 0) score += 4;
  const docs = missingDocs(record);
  if (docs.length) score += Math.min(6, docs.length * 2);
  marketAlerts(record, "en").forEach((alert) => {
    score += alert.severity === "critical" ? 8 : 4;
  });
  return score;
}

export function missingDocs(record) {
  const required = splitDocs(localizedData(record.data, "requiredDocs", "zh", record.data?.requiredDocs || record.data?.required_docs));
  const received = splitDocs(localizedData(record.data, "receivedDocs", "zh", record.data?.receivedDocs || record.data?.received_docs));
  return required.filter((doc) => !received.some((item) => item.toLowerCase() === doc.toLowerCase()));
}

function splitDocs(value) {
  return String(value || "")
    .split(/[,;，；、\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function buildAlerts(records = [], lang = "en") {
  return records.flatMap((record) => {
    const alerts = [];
    const due = daysUntil(record.deadline);
    if (!["completed", "approved"].includes(record.status)) {
      if (due !== null && due < 0) {
        alerts.push({
          record,
          severity: "critical",
          reason: lang === "zh" ? `已超时 ${Math.abs(due)} 天` : `${Math.abs(due)} day(s) overdue`
        });
      } else if (due === 0) {
        alerts.push({ record, severity: "warning", reason: lang === "zh" ? "今天到期" : "Due today" });
      }
    }
    if (["critical", "high"].includes(record.risk)) {
      alerts.push({
        record,
        severity: record.risk === "critical" ? "critical" : "warning",
        reason: lang === "zh" ? `${record.risk === "critical" ? "严重" : "高"}风险` : `${record.risk} risk`
      });
    }
    const docs = missingDocs(record);
    if (docs.length) {
      alerts.push({
        record,
        severity: docs.length > 2 ? "critical" : "warning",
        reason: lang === "zh" ? `缺少文件：${docs.join("、")}` : `Missing documents: ${translateDocs(docs, lang).join(", ")}`
      });
    }
    alerts.push(...marketAlerts(record, lang).map((alert) => ({ record, ...alert })));
    return alerts;
  });
}

function marketAlerts(record, lang) {
  if (record.module_id !== "market_intelligence") return [];
  const data = record.data || {};
  const alerts = [];
  const priceChange = Number(data.priceChangePercent);
  const freightCost = Number(data.freightCostUsd);
  const inventoryCover = Number(data.inventoryCoverDays);
  const restriction = String(data.exportRestrictionLevel || data.exportRestrictionLevel_en || data.exportRestrictionLevel_zh || "").toLowerCase();
  const policy = String(data.chinaPolicyStatus || data.chinaPolicyStatus_en || data.chinaPolicyStatus_zh || "").toLowerCase();

  if (Number.isFinite(priceChange) && Math.abs(priceChange) >= 15) {
    alerts.push({
      severity: Math.abs(priceChange) >= 30 ? "critical" : "warning",
      reason: lang === "zh" ? `价格波动 ${priceChange}%` : `Price movement ${priceChange}%`
    });
  }
  if (["高", "严重", "受限", "暂停", "high", "critical", "suspended", "ban", "restricted"].some((word) => restriction.includes(word) || policy.includes(word))) {
    alerts.push({
      severity: ["严重", "暂停", "critical", "suspend", "ban"].some((word) => restriction.includes(word) || policy.includes(word)) ? "critical" : "warning",
      reason: lang === "zh" ? "出口限制 / 政策风险" : "Export restriction / policy risk"
    });
  }
  if (Number.isFinite(freightCost) && freightCost >= 90) {
    alerts.push({
      severity: freightCost >= 130 ? "critical" : "warning",
      reason: lang === "zh" ? `运费偏高：${freightCost} USD/吨` : `High freight cost USD ${freightCost}/t`
    });
  }
  if (Number.isFinite(inventoryCover) && inventoryCover <= 30) {
    alerts.push({
      severity: inventoryCover <= 15 ? "critical" : "warning",
      reason: lang === "zh" ? `库存仅覆盖 ${inventoryCover} 天` : `Inventory cover ${inventoryCover} day(s)`
    });
  }
  return alerts;
}

export function groupReminders(records = [], users = []) {
  const byOwner = new Map();
  records
    .filter((record) => !["completed", "approved"].includes(record.status))
    .forEach((record) => {
      const ownerId = record.owner_user_id;
      if (!ownerId) return;
      if (!byOwner.has(ownerId)) {
        byOwner.set(ownerId, {
          owner: users.find((user) => user.id === ownerId),
          records: [],
          score: 0
        });
      }
      const score = recordScore(record);
      const group = byOwner.get(ownerId);
      group.records.push({ ...record, score });
      group.score += score;
    });
  return Array.from(byOwner.values())
    .map((group) => ({
      ...group,
      records: group.records.sort((a, b) => b.score - a.score)
    }))
    .sort((a, b) => b.score - a.score);
}

export function reminderMessage(group, modules, lang = "en") {
  const ownerName = displayUserName(group.owner, lang);
  const intro =
    lang === "zh"
      ? [`${ownerName}，你好。`, "这是 DA YI 管理系统自动生成的项目进展提醒。", "请今天回复：当前进展、卡点、下一步、预计完成时间。"]
      : [`Hello ${ownerName},`, "This is an automatic project progress reminder from the DA YI management system.", "Please reply today with current progress, blockers, next step and expected completion time."];
  const body = group.records.slice(0, 8).flatMap((record, index) => {
    const module = modules.find((item) => item.id === record.module_id);
    const due = daysUntil(record.deadline);
    const dueText =
      due === null
        ? "-"
        : due < 0
          ? lang === "zh" ? `已超时 ${Math.abs(due)} 天` : `${Math.abs(due)} day(s) overdue`
          : due === 0
            ? lang === "zh" ? "今天到期" : "due today"
            : lang === "zh" ? `${due} 天后到期` : `due in ${due} day(s)`;
    const moduleName = lang === "zh" ? module?.zh : module?.en;
    return [
      `${index + 1}. ${recordTitle(record, lang)}`,
      lang === "zh"
        ? `   模块：${moduleName || record.module_id} | 状态：${statusLabel(record.status, lang)} | 风险：${riskLabel(record.risk, lang)} | 截止：${record.deadline || "-"}（${dueText}）`
        : `   Module: ${moduleName || record.module_id} | Status: ${statusLabel(record.status, lang)} | Risk: ${riskLabel(record.risk, lang)} | Deadline: ${record.deadline || "-"} (${dueText})`,
      recordContingency(record, lang)
        ? lang === "zh" ? `   预案：${recordContingency(record, lang)}` : `   Contingency: ${recordContingency(record, lang)}`
        : "",
      record.module_id === "market_intelligence" && localizedData(record.data, "recommendedAction", lang)
        ? lang === "zh" ? `   建议动作：${localizedData(record.data, "recommendedAction", lang)}` : `   Recommended action: ${localizedData(record.data, "recommendedAction", lang)}`
        : ""
    ].filter(Boolean);
  });
  return [...intro, "", ...body, "", lang === "zh" ? "请今天下班前回复。" : "Please reply before the end of today."].join("\n");
}
