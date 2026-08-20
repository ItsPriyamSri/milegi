"use client";

import { useParams } from "next/navigation";
import CaseFile from "@/components/CaseFile";

export default function StatusPage() {
  const { id } = useParams<{ id: string }>();
  return <CaseFile id={id} />;
}
