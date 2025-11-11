"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navigation = [
  {
    name: "Routing & Navigation",
    items: [
      { name: "Async Params", href: "/dashboard", icon: "🔄" },
      { name: "Route Groups", href: "/about", icon: "📂" },
      { name: "Parallel Routes", href: "/photos", icon: "🔀" },
      { name: "Middleware", href: "/middleware-demo", icon: "🛡️" },
    ],
  },
  {
    name: "Data Fetching",
    items: [
      { name: "Server Actions", href: "/forms", icon: "📝" },
      { name: "Route Handlers", href: "/api-demo", icon: "🚀" },
      { name: "Streaming", href: "/streaming", icon: "🌊" },
      { name: "Cache", href: "/cache-demo", icon: "⚡" },
    ],
  },
  {
    name: "Optimization",
    items: [
      { name: "Image & Font", href: "/images", icon: "🎨" },
      { name: "Metadata & SEO", href: "/blog", icon: "🔍" },
      { name: "View Transitions", href: "/gallery", icon: "✨" },
    ],
  },
  {
    name: "Error Handling",
    items: [{ name: "Error Boundaries", href: "/error-demo", icon: "⚠️" }],
  },
  {
    name: "Authentication",
    items: [
      { name: "Login", href: "/login", icon: "🔐" },
      { name: "Admin", href: "/admin", icon: "👤" },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-white border-r border-gray-200 fixed left-0 top-16 bottom-0 overflow-y-auto hidden lg:block">
      <div className="p-4">
        <div className="mb-6">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Features
          </h2>
        </div>

        <nav className="space-y-6">
          {navigation.map((section) => (
            <div key={section.name}>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                {section.name}
              </h3>
              <ul className="space-y-1">
                {section.items.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                          isActive
                            ? "bg-blue-50 text-blue-700"
                            : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                        }`}
                      >
                        <span className="mr-3 text-lg">{item.icon}</span>
                        <span>{item.name}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* 技術スタック */}
        <div className="mt-8 pt-8 border-t border-gray-200">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Tech Stack
          </h3>
          <div className="text-xs text-gray-600 space-y-1">
            <p>• Next.js 16.0.1</p>
            <p>• React 19.2.0</p>
            <p>• TypeScript 5</p>
            <p>• Tailwind CSS 3</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
