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
  marketAlerts(record).forEach((alert) => {
    score += alert.severity === "critical" ? 8 : 4;
  });
  return score;
}

export function missingDocs(record) {
  const required = splitDocs(record.data?.requiredDocs || record.data?.required_docs);
  const received = splitDocs(record.data?.receivedDocs || record.data?.received_docs);
  return required.filter((doc) => !received.some((item) => item.toLowerCase() === doc.toLowerCase()));
}

function splitDocs(value) {
  return String(value || "")
    .split(/[,;，；\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function buildAlerts(records = []) {
  return records.flatMap((record) => {
    const alerts = [];
    const due = daysUntil(record.deadline);
    if (!["completed", "approved"].includes(record.status)) {
      if (due !== null && due < 0) {
        alerts.push({ record, severity: "critical", reason: `${Math.abs(due)} day(s) overdue` });
      } else if (due === 0) {
        alerts.push({ record, severity: "warning", reason: "Due today" });
      }
    }
    if (["critical", "high"].includes(record.risk)) {
      alerts.push({ record, severity: record.risk === "critical" ? "critical" : "warning", reason: `${record.risk} risk` });
    }
    const docs = missingDocs(record);
    if (docs.length) {
      alerts.push({ record, severity: docs.length > 2 ? "critical" : "warning", reason: `Missing documents: ${docs.join(", ")}` });
    }
    alerts.push(...marketAlerts(record).map((alert) => ({ record, ...alert })));
    return alerts;
  });
}

function marketAlerts(record) {
  if (record.module_id !== "market_intelligence") return [];
  const data = record.data || {};
  const alerts = [];
  const priceChange = Number(data.priceChangePercent);
  const freightCost = Number(data.freightCostUsd);
  const inventoryCover = Number(data.inventoryCoverDays);
  const restriction = String(data.exportRestrictionLevel || "").toLowerCase();
  const policy = String(data.chinaPolicyStatus || "").toLowerCase();

  if (Number.isFinite(priceChange) && Math.abs(priceChange) >= 15) {
    alerts.push({
      severity: Math.abs(priceChange) >= 30 ? "critical" : "warning",
      reason: `Price movement ${priceChange}%`
    });
  }
  if (["high", "critical", "suspended", "ban", "restricted"].some((word) => restriction.includes(word) || policy.includes(word))) {
    alerts.push({
      severity: restriction.includes("critical") || policy.includes("suspend") || policy.includes("ban") ? "critical" : "warning",
      reason: "Export restriction / policy risk"
    });
  }
  if (Number.isFinite(freightCost) && freightCost >= 90) {
    alerts.push({
      severity: freightCost >= 130 ? "critical" : "warning",
      reason: `High freight cost USD ${freightCost}/t`
    });
  }
  if (Number.isFinite(inventoryCover) && inventoryCover <= 30) {
    alerts.push({
      severity: inventoryCover <= 15 ? "critical" : "warning",
      reason: `Inventory cover ${inventoryCover} day(s)`
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
  const ownerName = group.owner?.full_name || group.owner?.email || "Team member";
  const intro =
    lang === "zh"
      ? [`${ownerName}，你好。`, "这是 DA YI 管理系统自动生成的项目进展提醒。", "请今天回复：当前进展、卡点、下一步、预计完成时间。"]
      : [`Hello ${ownerName},`, "This is an automatic project progress reminder from the DA YI management system.", "Please reply today with current progress, blockers, next step and expected completion time."];
  const body = group.records.slice(0, 8).flatMap((record, index) => {
    const module = modules.find((item) => item.id === record.module_id);
    const due = daysUntil(record.deadline);
    const dueText = due === null ? "-" : due < 0 ? `${Math.abs(due)} day(s) overdue` : due === 0 ? "due today" : `due in ${due} day(s)`;
    return [
      `${index + 1}. ${record.title}`,
      `   Module: ${module?.en || record.module_id} | Status: ${record.status} | Risk: ${record.risk} | Deadline: ${record.deadline || "-"} (${dueText})`,
      record.contingency ? `   Contingency: ${record.contingency}` : "",
      record.module_id === "market_intelligence" && record.data?.recommendedAction ? `   Recommended action: ${record.data.recommendedAction}` : ""
    ].filter(Boolean);
  });
  return [...intro, "", ...body, "", "Please reply before the end of today."].join("\n");
}
