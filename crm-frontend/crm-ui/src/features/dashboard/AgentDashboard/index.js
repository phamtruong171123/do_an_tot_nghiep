import React from "react";
import classNames from "classnames/bind";
import styles from "./styles.module.scss";
import { fetchAgentDashboard } from "../api";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Pie, PieChart, Cell,Bar,BarChart,
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

export default function AgentDashboard() {
  const [range, setRange] = React.useState("month"); // today | week | month
  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(false);

  const loadData = React.useCallback(async (r) => {
    setLoading(true);
    try {
      const res = await fetchAgentDashboard(r);
      setData(res);
    } catch (e) {
      console.error("Failed to load agent dashboard", e);
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

  const donutPercent = taskSummary.total ? completedPct : 0;


  const DONUT_COLORS = {
    completed: "#1d4ed8",
    active: "#10b981",
    overdue: "#ef4444",
  };


  const dealChartData = dealPoints.map((p) => ({
    date: p.date.slice(5),
    fullDate: p.date,
    count: p.contractCount,
  }));

  const taskBarData = [
    {
      name: "Tasks",
      completed: taskSummary.completed,
      active: activeCount > 0 ? activeCount : 0,
      overdue: taskSummary.overdue,
    },
  ];


  return (
    <div className={cx("page")}>
      <div className={cx("headerRow")}>
        {/*<div>*/}
        {/*  <h1 className={cx("title")}>Dashboard</h1>*/}
        {/*  <p className={cx("subtitle")}>*/}
        {/*    Overview of your deals and tasks – {formatRangeLabel(range)}*/}
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
          {/* LEFT: Tasks panel */}
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
                tasks.slice(0, 8).map((task) => (
                  <div key={task.id} className={cx("taskItem")}>
                    <div className={cx("taskMain")}>
                      <div className={cx("taskTitleRow")}>
                        <span
                          className={cx("taskType", `taskType-${task.type}`)}
                        >
                          {task.type === "deal_followup" ? "Deal" : "Ticket"}
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

          {/* RIGHT TOP: Deals chart – dùng Recharts */}
          <section className={cx("card", "dealsCard")}>
            <div className={cx("cardHeader")}>
              <div>
                <h2 className={cx("cardTitle")}>Deals</h2>
                <p className={cx("cardSubtitle")}>
                  Won deals this month
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
                      <linearGradient id="dealArea" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#2563eb" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="#2563eb" stopOpacity={0} />
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
                      fill="url(#dealArea)"
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

          {/* RIGHT BOTTOM: Tasks donut */}
          <section className={cx("card", "donutCard")}>
            <div className={cx("cardHeader")}>
              <div>
                <h2 className={cx("cardTitle")}>Tasks status</h2>
                <p className={cx("cardSubtitle")}>
                  Overview of tasks for {formatRangeLabel(range)}
                </p>
              </div>
            </div>

            <div className={cx("donutWrap")}>
              <div className={cx("donutChart")}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={donutData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={40}
                      outerRadius={60}
                      paddingAngle={2}
                    >
                      {donutData.map((entry) => (
                        <Cell
                          key={entry.key}
                          fill={DONUT_COLORS[entry.key]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value, name) => [`${value} tasks`, name]}
                    />
                  </PieChart>
                </ResponsiveContainer>

                {/* text ở giữa donut */}
                <div className={cx("donutCenter")}>
                  <div className={cx("donutValue")}>
                    {donutPercent}%
                  </div>
                  <div className={cx("donutLabel")}>Completed</div>
                </div>
              </div>

              <div className={cx("donutLegend")}>
                <div className={cx("legendItem")}>
                  <span className={cx("dot", "dotCompleted")} />
                  <div className={cx("legendText")}>
                    <div>Completed</div>
                    <div className={cx("legendSub")}>
                      {taskSummary.completed} tasks
                    </div>
                  </div>
                </div>
                <div className={cx("legendItem")}>
                  <span className={cx("dot", "dotActive")} />
                  <div className={cx("legendText")}>
                    <div>Active</div>
                    <div className={cx("legendSub")}>
                      {activeCount > 0 ? activeCount : 0} tasks
                    </div>
                  </div>
                </div>
                <div className={cx("legendItem")}>
                  <span className={cx("dot", "dotOverdue")} />
                  <div className={cx("legendText")}>
                    <div>Overdue</div>
                    <div className={cx("legendSub")}>
                      {taskSummary.overdue} tasks
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
