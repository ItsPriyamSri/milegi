"use client";

import { useParams } from "next/navigation";

import Wizard from "@/components/Wizard";

export default function ApplyPage() {
  const { id } = useParams<{ id: string }>();
  return <Wizard id={id} />;
}
