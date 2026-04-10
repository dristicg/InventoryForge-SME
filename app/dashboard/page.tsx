import { redirect } from "next/navigation";

export default function DashboardRoot() {
  // Redirect to the products page as the default dashboard view
  redirect("/dashboard/products");
}
