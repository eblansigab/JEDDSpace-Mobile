import { supabase } from "../../lib/supabase";

export async function submitLeaveForm(
  startDate: string,
  endDate: string,
  type: string,
  reason: string,
) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const employee_id = await getEmpId(user);

  const { data, error } = await supabase.from("leaveform").insert({
    start_date: startDate,
    end_date: endDate,
    type: type,
    reason: reason,
    created_by: user?.id,
  });
  if (error) {
    console.error(error);
    return false;
  } else {
    console.log("success\n", data);
    return true;
  }
}

async function getEmpId(u: any) {
  const { data } = await supabase
    .from("employee")
    .select("employee_id")
    .eq("user_id", u?.id);
  console.log(data);
  return data;
}
