export type Role = 'ops_pic'|'fte_ops'|'fte_mm'|'doc_officer';
export type Status = 'PENDING'|'APPROVED'|'CANCELLED'|'REJECTED_BY_MM'|'ASSIGNED'|'FOR_DOCKING'|'DOCKED'|'CONFIRMED';
export interface User {id:string;name:string;role:Role;email?:string;ops_id?:string}
export interface TruckRequest {id:string;cluster:string;region:string;dock_no:string;backlogs:number;truck_size:string;truck_type:string;plate_number?:string;status:Status;created_at:string}
export interface Page<T> {data:T[];current_page:number;last_page:number;total:number}
