import { supabase } from "../../lib/supabase";
//import {File} from "expo-file-system"
import {decode} from "base64-arraybuffer"

export async function uploadFile(uri:string|undefined,file:any){
    if(file && uri){
        const {data,error} = await supabase.storage.from("test").upload(uri!,decode(file))
        if(error) console.log(error)
        else console.log(data)

    }
    // v change this to an alert component later
    else console.log("no file selected")
}