import {createContext,useContext,useState,type ReactNode} from "react";
import {useRows,type TableName} from "@/lib/db";
import {filterCenterRows} from "@/lib/center-filter";
import {Select,SelectContent,SelectItem,SelectTrigger,SelectValue} from "@/components/ui/select";
const CenterContext=createContext({center:"all",setCenter:(_value:string)=>{}});
export function CenterProvider({children}:{children:ReactNode}){
 const [center,setCenter]=useState("all");
 return <CenterContext.Provider value={{center,setCenter}}>{children}</CenterContext.Provider>;
}
export const useCenterScope=()=>useContext(CenterContext);
export function CenterSelector(){
 const {center,setCenter}=useCenterScope();const {data:centers=[]}=useRows("centers");
 return <Select value={center} onValueChange={setCenter}><SelectTrigger aria-label="কেন্দ্র নির্বাচন" className="w-full sm:w-56"><SelectValue placeholder="সব কেন্দ্র"/></SelectTrigger><SelectContent><SelectItem value="all">সব কেন্দ্র</SelectItem>{centers.map(c=><SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select>;
}
export function useCenterRows<T extends TableName>(table:T,opts?:{order?:string;ascending?:boolean}){
 const result=useRows(table,opts);const {center}=useCenterScope();const members=useRows("members");
 return {...result,data:result.data?filterCenterRows(result.data,center,members.data ?? [],table):undefined};
}