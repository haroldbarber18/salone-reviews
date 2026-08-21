"use client";

import ServicesListPage from "@/components/ServicesListPage";

export default function EmergencyServicesPage() {
  return (
    <ServicesListPage
      type="emergency"
      title="Emergency Services"
      subtitle="Police, hospitals, fire and urgent contacts by district."
    />
  );
}