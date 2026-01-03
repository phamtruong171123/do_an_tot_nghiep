import { apiGet} from "../../lib/apiClient";

export async function fetchAgentDashboard(range = "today") {
  const param=new URLSearchParams();
  param.set("range", range);
  const res = await apiGet(`/api/dashboard/agent?${param.toString()}`);
  return res;
}

export async  function fetchAdminDashboard(range="today"){
  const param=new URLSearchParams();
  param.set("range", range);
  const res = await apiGet(`/api/dashboard/admin?${param.toString()}`);
  return res;
}