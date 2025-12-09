// app/vehicle/page.tsx
import type { Metadata } from "next";
import VehicleApp from "@/components/vehicle/VehicleApp";

export const metadata: Metadata = {
    title: "차량 운행 관리 시스템",
    description: "사내 차량 배차 및 운행 일지 관리",
};

export default function VehiclePage() {
    return <VehicleApp />;
}
