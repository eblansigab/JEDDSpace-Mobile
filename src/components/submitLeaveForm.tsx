import { supabase } from "../../lib/supabase";

export async function submitLeaveForm(startDate:string,endDate:string,type:string,reason:string){
    const {data:{user}} = await supabase.auth.getUser()
    const {data,error} = await supabase.from("leaveform").insert({start_date:startDate,end_date:endDate,type:type,reason:reason,created_by:user})
    if(error) console.log(error)
    else console.log("success\n",data)
}