import { supabase } from "../../lib/supabase";

export async function submitBusinessForm(
  project: string,
  startDate: string,
  endDate: string,
  location: string,
  car: string,
  driver: string,
  contact: string,
) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data, error } = await supabase.from("businessform").insert({
    project_name: project,
    start_date: startDate,
    end_date: endDate,
    location: location,
    company_car: car,
    driver_name: driver,
    phone_num: contact,
    created_by: user?.id,
  });
  if (error) {
    console.log(error);
    return false;
  }
  console.log("success\n", data);
  return true;
}
