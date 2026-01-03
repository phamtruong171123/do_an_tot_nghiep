import React from "react";
import classNames from "classnames/bind";
import styles from "./styles.module.scss";
import { fetchAdminDashboard } from "../api";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell, BarChart, Bar,
} from "recharts";

const cx = classNames.bind(styles);

function formatDateTime(value) {
  if (!value) return "-";
  const d = new Date(value);
  return d.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatRangeLabel(range) {
  switch (range) {
    case "today":
      return "Today";
    case "week":
      return "This week";
    case "month":
      return "This month";
    default:
      return range;
  }
}

const STAGE_LABELS = {
  POTENTIAL: "Potential",
  NEGOTIATION: "Negotiation",
  PENDING_CONTRACT_APPROVAL: "Pending approval",
  CONTRACT: "Contract",
  LOST: "Lost",
};

const STAGE_COLORS = [
  "#2563eb",
  "#10b981",
  "#f97316",
  "#8b5cf6",
  "#ef4444",
];

export default function AdminDashboard() {
  const [range, setRange] = React.useState("month");
  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(false);

  const loadData = React.useCallback(async (r) => {
    setLoading(true);
    try {
      const res = await fetchAdminDashboard(r);
      setData(res);
    } catch (e) {
      console.error("Failed to load admin dashboard", e);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadData(range);
  }, [range, loadData]);

  const taskSummary =
    data?.taskSummary || { total: 0, completed: 0, overdue: 0 };
  const tasks = data?.tasks || [];
  const dealPoints = data?.dealChart?.points || [];
  const stageSummary = data?.stageSummary || [];


  const totalForPercent = taskSummary.total || 1;
  const completedPct = Math.round(
    (taskSummary.completed / totalForPercent) * 100
  );
  const overduePct = Math.round(
    (taskSummary.overdue / totalForPercent) * 100
  );
  const activeCount =
    taskSummary.total - taskSummary.completed - taskSummary.overdue;
  const activePct = Math.max(0, 100 - completedPct - overduePct);

  const donutData = [
    { key: "completed", name: "Completed", value: taskSummary.completed },
    { key: "active", name: "Active", value: activeCount > 0 ? activeCount : 0 },
    { key: "overdue", name: "Overdue", value: taskSummary.overdue },
  ];

  const DONUT_COLORS = {
    completed: "#1d4ed8",
    active: "#10b981",
    overdue: "#ef4444",
  };

  const dealChartData = dealPoints.map((p) => ({
    date: p.date.slice(5), // "MM-DD"
    fullDate: p.date,
    count: p.contractCount,
  }));


  const totalDeals = stageSummary.reduce((sum, s) => sum + s.count, 0);
  const stagePieData =
    totalDeals > 0
      ? stageSummary.map((s) => ({
        name: STAGE_LABELS[s.stage] || s.stage,
        value: s.count,
      }))
      : [];


  const taskBarData=[
    {
      name:"Tasks",
      completed: taskSummary.completed,
      active: activeCount > 0 ? activeCount : 0,
      overdue: taskSummary.overdue,
    }
  ]

  return (
    <div className={cx("page")}>
      <div className={cx("headerRow")}>
        {/*<div>*/}
        {/*  <h1 className={cx("title")}>Admin dashboard</h1>*/}
        {/*  <p className={cx("subtitle")}>*/}
        {/*    Overview of approvals, tickets and deals – {formatRangeLabel(range)}*/}
        {/*  </p>*/}
        {/*</div>*/}

        <div className={cx("rangeToggle")}>
          {["today", "week", "month"].map((r) => (
            <button
              key={r}
              type="button"
              className={cx("rangeBtn", { active: range === r })}
              onClick={() => setRange(r)}
            >
              {formatRangeLabel(r)}
            </button>
          ))}
        </div>
      </div>

      {loading && !data ? (
        <div className={cx("loading")}>Loading...</div>
      ) : (
        <div className={cx("grid")}>
          {/* LEFT: Tasks panel (deal approval + ticket admin) */}
          <section className={cx("card", "tasksCard")}>
            <div className={cx("cardHeader")}>
              <div>
                <h2 className={cx("cardTitle")}>Tasks</h2>
                <p className={cx("cardSubtitle")}>
                  {taskSummary.completed} completed out of {taskSummary.total}{" "}
                  tasks
                </p>
              </div>
            </div>

            <div className={cx("progressWrap")}>
              <div className={cx("taskBarChart")}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={taskBarData}
                    layout="vertical"
                    margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
                    stackOffset="expand" // hiển thị theo tỉ lệ %
                  >
                    {/* Ẩn trục, chỉ dùng 1 thanh ngang */}
                    <XAxis type="number" hide />
                    <YAxis type="category" dataKey="name" hide />
                    <Tooltip
                      formatter={(value, name) => [`${value} tasks`, name]}
                    />
                    <Bar
                      dataKey="completed"
                      stackId="tasks"
                      fill={DONUT_COLORS.completed}
                    />
                    <Bar
                      dataKey="active"
                      stackId="tasks"
                      fill={DONUT_COLORS.active}
                    />
                    <Bar
                      dataKey="overdue"
                      stackId="tasks"
                      fill={DONUT_COLORS.overdue}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className={cx("progressLegend")}>
                <span className={cx("dot", "dotCompleted")} /> Completed
                <span className={cx("dot", "dotActive")} /> Active
                <span className={cx("dot", "dotOverdue")} /> Overdue
              </div>
            </div>


            <div className={cx("taskList")}>
              {tasks.length === 0 ? (
                <div className={cx("emptyState")}>
                  No tasks for this period.
                </div>
              ) : (
                tasks.slice(0, 10).map((task) => (
                  <div key={task.id} className={cx("taskItem")}>
                    <div className={cx("taskMain")}>
                      <div className={cx("taskTitleRow")}>
                        <span
                          className={cx("taskType", `taskType-${task.type}`)}
                        >
                          {task.type === "deal_approval"
                            ? "Approval"
                            : "Ticket"}
                        </span>
                        <span
                          className={cx(
                            "taskStatus",
                            `taskStatus-${task.status}`
                          )}
                        >
                          {task.status === "pending"
                            ? "Pending"
                            : task.status === "overdue"
                              ? "Overdue"
                              : "Done"}
                        </span>
                      </div>
                      <div className={cx("taskTitle")}>{task.title}</div>
                      <div className={cx("taskMeta")}>
                        <span>Due: {formatDateTime(task.dueAt)}</span>
                        {task.dealStage && (
                          <span className={cx("taskStage")}>
                            Stage: {task.dealStage}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* RIGHT TOP: Deals overview (won contracts this month) */}
          <section className={cx("card", "dealsCard")}>
            <div className={cx("cardHeader")}>
              <div>
                <h2 className={cx("cardTitle")}>Deals overview</h2>
                <p className={cx("cardSubtitle")}>
                  Contracts won this month
                </p>
              </div>
            </div>

            {dealChartData.length === 0 ? (
              <div className={cx("emptyStateSmall")}>
                No contracts closed this month.
              </div>
            ) : (
              <div className={cx("rechartWrap")}>
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart
                    data={dealChartData}
                    margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="dealAreaAdmin" x1="0" y1="0" x2="0" y2="1">
                        <stop
                          offset="0%"
                          stopColor="#2563eb"
                          stopOpacity={0.35}
                        />
                        <stop
                          offset="100%"
                          stopColor="#2563eb"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>

                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11, fill: "#9ca3af" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fontSize: 11, fill: "#9ca3af" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      cursor={{ stroke: "#93c5fd", strokeWidth: 1 }}
                      contentStyle={{
                        fontSize: 12,
                        borderRadius: 8,
                        border: "1px solid #e5e7eb",
                      }}
                      formatter={(value) => [`${value} deals`, "Contracts"]}
                      labelFormatter={(label, payload) =>
                        payload && payload[0]?.payload?.fullDate
                          ? `Date: ${payload[0].payload.fullDate}`
                          : label
                      }
                    />
                    <Area
                      type="monotone"
                      dataKey="count"
                      stroke="#2563eb"
                      strokeWidth={2}
                      fill="url(#dealAreaAdmin)"
                      dot={{
                        r: 4,
                        stroke: "#2563eb",
                        strokeWidth: 2,
                        fill: "#fff",
                      }}
                      activeDot={{ r: 5 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </section>

          {/* RIGHT BOTTOM: Deals by stage (pie) */}
          <section className={cx("card", "donutCard")}>
            <div className={cx("cardHeader")}>
              <div>
                <h2 className={cx("cardTitle")}>Deals by stage</h2>
                <p className={cx("cardSubtitle")}>
                  Current distribution of deals by stage
                </p>
              </div>
            </div>

            {stagePieData.length === 0 ? (
              <div className={cx("emptyStateSmall")}>
                No deals found for stages.
              </div>
            ) : (
              <div className={cx("donutWrap")}>
                <div style={{ width: 140, height: 140 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stagePieData}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={40}
                        outerRadius={60}
                        paddingAngle={2}
                      >
                        {stagePieData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={
                              STAGE_COLORS[index % STAGE_COLORS.length]
                            }
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value, name) => [`${value} deals`, name]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className={cx("donutLegend")}>
                  {stagePieData.map((s, idx) => {
                    const color = STAGE_COLORS[idx % STAGE_COLORS.length];
                    const percent =
                      totalDeals > 0
                        ? Math.round((s.value / totalDeals) * 100)
                        : 0;
                    return (
                      <div key={s.name} className={cx("legendItem")}>
                        <span
                          className={cx("dot")}
                          style={{ background: color }}
                        />
                        <div className={cx("legendText")}>
                          <div>
                            {s.name} – {percent}%
                          </div>
                          <div className={cx("legendSub")}>
                            {s.value} deals
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
