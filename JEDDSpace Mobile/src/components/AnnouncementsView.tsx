import { useEffect, useState } from "react"
import { FlatList, Text, View } from "react-native"
import { supabase } from "../../lib/supabase"

export function AnnouncementsView(){
    const [announcements,getAnnouncements] = useState<any[]|null>()
    useEffect(
        ()=>{searchAnnouncements()},[]
    )
    async function searchAnnouncements(){
        const {data,error} = await supabase.from("announcement").select()
        getAnnouncements(data)
    }
    return(
        <View>
            <FlatList data={announcements} renderItem={({item})=>(
                <Text>{item.body}</Text>
            )}
            />
        </View>
    )
}