import { redirect } from "next/navigation";
import { readSession } from "@/server/session-cookie";
import { hydrate } from "@/server/store";

export async function requireOperator(role: "institute" | "dwo") {
  await hydrate();
  const session = await readSession();
  if (!session || session.role !== role) redirect(role === "institute" ? "/sansthan" : "/dwo");
  return session;
}
