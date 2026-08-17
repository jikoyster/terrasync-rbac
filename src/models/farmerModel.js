import { supabase } from "./supabaseClient";

const publicFields =
  "farmer_id, rsbsa_number, name, crops, status, address, phone, email, created_at, updated_at";

export async function authenticateFarmer(identifier, password) {
  const { data, error } = await supabase.rpc("authenticate_farmer", {
    p_identifier: identifier,
    p_password: password
  });

  if (error) throw error;
  return data?.[0] ?? null;
}

export async function listFarmers() {
  const { data, error } = await supabase
    .from("farmers")
    .select(publicFields)
    .order("name", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function getFarmer(farmerId) {
  const { data, error } = await supabase
    .from("farmers")
    .select(publicFields)
    .eq("farmer_id", farmerId)
    .single();

  if (error) throw error;
  return data;
}

export async function getFarmerProfile(farmerId) {
  const { data, error } = await supabase.rpc("get_farmer_profile", {
    p_farmer_id: Number(farmerId)
  });

  if (error) throw error;
  return data?.[0] ?? null;
}

export async function createFarmer(payload) {
  const { data, error } = await supabase.rpc("admin_create_farmer", {
    p_rsbsa_number: payload.rsbsa_number,
    p_name: payload.name,
    p_crops: payload.crops || null,
    p_status: payload.status,
    p_address: payload.address || null,
    p_phone: payload.phone,
    p_email: payload.email || null,
    p_password: payload.password || null
  });

  if (error) throw error;
  return data?.[0] ?? null;
}

export async function updateFarmer(farmerId, payload) {
  const { data, error } = await supabase.rpc("admin_update_farmer", {
    p_farmer_id: Number(farmerId),
    p_rsbsa_number: payload.rsbsa_number,
    p_name: payload.name,
    p_crops: payload.crops || null,
    p_status: payload.status,
    p_address: payload.address || null,
    p_phone: payload.phone,
    p_email: payload.email || null,
    p_password: payload.password || null
  });

  if (error) throw error;
  return data?.[0] ?? null;
}

export async function updateOwnFarmerProfile(farmerId, payload) {
  const { data, error } = await supabase.rpc("update_own_farmer_profile", {
    p_farmer_id: Number(farmerId),
    p_current_password: payload.current_password,
    p_rsbsa_number: payload.rsbsa_number,
    p_name: payload.name,
    p_crops: payload.crops || null,
    p_status: payload.status,
    p_address: payload.address || null,
    p_phone: payload.phone,
    p_email: payload.email || null,
    p_new_password: payload.new_password || null
  });

  if (error) throw error;
  return data?.[0] ?? null;
}

export async function deleteFarmer(farmerId) {
  const { error } = await supabase
    .from("farmers")
    .delete()
    .eq("farmer_id", Number(farmerId));

  if (error) throw error;
}
