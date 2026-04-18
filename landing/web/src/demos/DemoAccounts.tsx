import { Shield, User } from "lucide-react";
import { DEMO_ACCOUNTS } from "./demo-data";
import { cn } from "@/lib/cn";

export function DemoAccounts() {
  return (
    <div className="p-5">
      <h3 className="mb-4 text-sm font-semibold text-gray-700">Comptes</h3>
      <div className="space-y-2">
        {DEMO_ACCOUNTS.map((acc) => (
          <div
            key={acc.id}
            className="flex items-center gap-3 rounded-lg border border-gray-100 bg-gray-50 px-4 py-3"
          >
            <div
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full",
                acc.role === "ADMIN" ? "bg-indigo-100" : "bg-gray-200"
              )}
            >
              {acc.role === "ADMIN" ? (
                <Shield className="h-4 w-4 text-indigo-600" />
              ) : (
                <User className="h-4 w-4 text-gray-500" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-700">{acc.username}</p>
            </div>
            <span
              className={cn(
                "rounded-full px-2.5 py-0.5 text-xs font-medium",
                acc.role === "ADMIN"
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-200 text-gray-600"
              )}
            >
              {acc.role === "ADMIN" ? "Admin" : "User"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
