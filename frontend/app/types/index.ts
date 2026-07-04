export type Role='ops_pic'|'fte_ops'|'fte_mm'|'doc_officer'|'dock_officer'
export interface User{id:string;name:string;role:Role;is_admin?:boolean;email?:string;must_change_password?:boolean}
export interface TruckRequest{id:string;cluster:string;region:string;dock_no:string;backlogs:number;truck_size:string;truck_type:string;plate_number?:string|null;provide_time?:string|null;linehaul_trip_no?:string|null;status:string;created_by:string;created_at:string}
export interface Page<T>{data:T[];current_page:number;last_page:number;total:number}
export interface Metrics{total:number;awaiting_action:number;by_status:Record<string,number>}
