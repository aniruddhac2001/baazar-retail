import { redirect } from "next/navigation";

/** Legacy /admin route → Next.js admin dashboard */
export default function AdminRedirectPage() {
  redirect("/admin-dashboard");
}
