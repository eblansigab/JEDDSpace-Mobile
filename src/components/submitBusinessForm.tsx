import { supabase } from "../../lib/supabase";

export async function submitBusinessForm(startDate:string,endDate:string,location:string,car:string,driver:string,contact:string){
    const {data:{user}} = await supabase.auth.getUser()
    const {data,error} = await supabase.from('businessform').insert({start_date:startDate,end_date:endDate,location:location,company_car:car,driver_name:driver,phone_num:contact,created_by:user})
    if(error) console.log(error)
    else console.log("success\n",data)
}