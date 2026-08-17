import {
  createFarmer,
  deleteFarmer,
  getFarmer,
  getFarmerProfile,
  listFarmers,
  updateFarmer,
  updateOwnFarmerProfile
} from "../models/farmerModel";

export async function fetchFarmers() {
  return listFarmers();
}

export async function fetchFarmer(farmerId) {
  return getFarmer(farmerId);
}

export async function fetchFarmerProfile(farmerId) {
  return getFarmerProfile(farmerId);
}

export async function addFarmer(form) {
  return createFarmer(normalizeFarmer(form, true));
}

export async function editFarmer(farmerId, form) {
  return updateFarmer(farmerId, normalizeFarmer(form, true));
}

export async function editOwnFarmerProfile(farmerId, form) {
  return updateOwnFarmerProfile(farmerId, {
    ...normalizeFarmer(form, false),
    current_password: form.current_password,
    new_password: form.new_password
  });
}

export async function removeFarmer(farmerId) {
  return deleteFarmer(farmerId);
}

function normalizeFarmer(form, includePassword) {
  const payload = {
    rsbsa_number: form.rsbsa_number.trim(),
    name: form.name.trim(),
    crops: form.crops?.trim() || null,
    status: form.status,
    address: form.address?.trim() || null,
    phone: form.phone.trim(),
    email: form.email?.trim() || null
  };

  if (includePassword) {
    payload.password = form.password?.trim() || null;
  }

  return payload;
}
