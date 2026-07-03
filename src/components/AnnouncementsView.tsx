import { useEffect, useState } from "react"
import { FlatList, Text, View } from "react-native"
import { supabase } from "../../lib/supabase"

export function AnnouncementsView(){
    async function searchAnnouncements(){
        const {data} = await supabase.from("announcement").select()
        getAnnouncements(data)
    }

    const [announcements,getAnnouncements] = useState<any[]|null>()
    useEffect(
        ()=>{void searchAnnouncements()},[]
    )
    return(
        <View>
            <FlatList data={announcements} renderItem={({item})=>(
                <Text>{item.body}</Text>
            )}
            />
        </View>
    )
}