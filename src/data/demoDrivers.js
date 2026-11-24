// FICTIONAL driver profiles for demonstration. No real people, documents or
// vehicles have been checked. Check statuses are simulated.
const id = (n) => `22222222-2222-4222-8222-00000000000${n}`

export const DRIVER_IDS = { thabo: id(1), lindiwe: id(2), pieter: id(3), sipho: id(4), ayesha: id(5), johan: id(6), kagiso: id(7), riaan: id(8) }

export function demoDrivers(ago) {
  const d = (n, ref, full_name, vehicle_make, vehicle_model, vehicle_colour, registration_number, verification_status, permit_status, rating, verifiedDaysAgo, checks = ['passed', 'passed']) => ({
    id: id(n), driver_reference: ref, full_name, vehicle_make, vehicle_model, vehicle_colour, registration_number,
    verification_status, permit_status, rating, id_check_status: checks[0], registration_check_status: checks[1],
    verified_at: verifiedDaysAgo == null ? null : ago(verifiedDaysAgo * 1440), is_demo: true, created_at: ago(200 * 1440),
  })
  return [
    d(1, 'CPT-DRV-001', 'Thabo Mokoena', 'Toyota', 'Corolla', 'White', 'CA 123-456', 'verified', 'valid', 4.8, 12),
    d(2, 'CPT-DRV-002', 'Lindiwe Dlamini', 'Volkswagen', 'Polo Vivo', 'Silver', 'CA 456-789', 'verified', 'valid', 4.9, 20),
    d(3, 'CPT-DRV-003', 'Pieter van der Merwe', 'Toyota', 'Corolla Quest', 'Grey', 'CA 234-118', 'verified', 'valid', 4.7, 34),
    d(4, 'CPT-DRV-004', 'Sipho Ndlovu', 'Suzuki', 'Dzire', 'Blue', 'CA 771-302', 'verified', 'valid', 4.6, 41),
    d(5, 'CPT-DRV-005', 'Ayesha Davids', 'Kia', 'Rio', 'Black', 'CA 908-245', 'verified', 'valid', 4.9, 8),
    d(6, 'CPT-DRV-006', 'Johan Peters', 'Nissan', 'Almera', 'White', 'CA 315-660', 'pending', 'pending', 4.5, null, ['passed', 'pending']),
    d(7, 'CPT-DRV-007', 'Kagiso Molefe', 'Toyota', 'Etios', 'Red', 'CA 552-019', 'suspended', 'suspended', 4.1, 90),
    d(8, 'CPT-DRV-008', 'Riaan Jacobs', 'Hyundai', 'Accent', 'Silver', 'CA 640-877', 'rejected', 'expired', 3.9, null, ['failed', 'passed']),
  ]
}
