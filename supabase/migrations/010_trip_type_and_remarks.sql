-- Add trip_type enum and remarks column to requests table
-- This replaces truck_type with trip_type for Ops PIC workflow

create type public.trip_type as enum ('1st MDT', '2nd MDT', 'Adv Request');

alter table public.requests 
add column trip_type public.trip_type,
add column remarks text;

-- Migrate existing truck_type values to trip_type if applicable
-- For now, we'll keep truck_type for backward compatibility with Midmile workflow
-- Ops PIC will use trip_type, Midmile will continue using truck_type

-- Add comment to clarify usage
comment on column public.requests.trip_type is 'Trip type selected by Ops PIC (1st MDT, 2nd MDT, Adv Request)';
comment on column public.requests.remarks is 'Additional remarks or notes for the request (long text)';
comment on column public.requests.truck_type is 'Truck type assigned by FTE Midmile (WETLEASE, DRYLEASE)';
