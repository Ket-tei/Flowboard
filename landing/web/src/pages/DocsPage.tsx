import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import logoSrc from "@/assets/logo.png";

type Page = "actualite" | "tutoriels" | "api" | "mcp";

interface Post {
  title: string;
  date: string;
  body: string;
}

const POSTS: Post[] = [
  {
    title: "Lancement de Flowboard",
    date: "17 mai 2025",
    body: "Flowboard est maintenant disponible. Gérez vos écrans dynamiques depuis un tableau de bord centralisé, créez des playlists et déployez votre instance en quelques minutes.",
  },
];

function NavBar() {
  return (
    <header className="sticky top-0 z-40 border-b border-gray-100 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-none items-center justify-between px-6">
        <a href="/" className="flex items-center gap-2">
          <img src={logoSrc} alt="Flowboard" className="h-6 w-auto" />
          <span className="text-sm font-semibold text-gray-800">Flowboard</span>
        </a>
        <a href="/" className="text-sm text-gray-500 transition-colors hover:text-gray-800">
          ← Retour
        </a>
      </div>
    </header>
  );
}

function ActualitePage() {
  return (
    <div className="max-w-2xl">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Actualité</h1>
      <div className="space-y-8">
        {POSTS.map((post) => (
          <article key={post.title} className="border-b border-gray-100 pb-8 last:border-0">
            <p className="mb-1 text-xs font-medium uppercase tracking-wider text-gray-400">
              {post.date}
            </p>
            <h2 className="mb-3 text-lg font-semibold text-gray-900">{post.title}</h2>
            <p className="leading-relaxed text-gray-600">{post.body}</p>
          </article>
        ))}
      </div>
    </div>
  );
}

function MarkdownPage({ slug }: { slug: string }) {
  const titles: Record<string, string> = {
    tutoriels: "Tutoriels",
    api: "API",
    mcp: "MCP",
  };
  return (
    <div className="max-w-2xl">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">{titles[slug] ?? slug}</h1>
      <p className="text-gray-400 italic">Documentation en cours de rédaction.</p>
    </div>
  );
}

interface SidebarItemProps {
  label: string;
  active: boolean;
  onClick: () => void;
}

function SidebarLeaf({ label, active, onClick }: SidebarItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center rounded-md px-3 py-2 text-left text-sm transition-colors ${
        active
          ? "border-l-2 border-indigo-600 bg-indigo-50 pl-[10px] font-medium text-indigo-700"
          : "text-gray-700 hover:bg-gray-100"
      }`}
    >
      {label}
    </button>
  );
}

function SidebarGroup({
  label,
  open,
  onToggle,
  children,
}: {
  label: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-1.5 rounded-md px-3 py-2 text-left text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
      >
        {open ? (
          <ChevronDown className="h-4 w-4 shrink-0 text-gray-400" />
        ) : (
          <ChevronRight className="h-4 w-4 shrink-0 text-gray-400" />
        )}
        {label}
      </button>
      {open && <div className="ml-4 mt-0.5 space-y-0.5 border-l border-gray-200 pl-2">{children}</div>}
    </div>
  );
}

export function DocsPage() {
  const [currentPage, setCurrentPage] = useState<Page>("actualite");
  const [docsOpen, setDocsOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col bg-white font-sans text-gray-900">
      <NavBar />
      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="w-60 shrink-0 border-r border-gray-100 bg-gray-50 px-3 py-6">
          <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
            Navigation
          </p>
          <nav className="space-y-0.5">
            <SidebarLeaf
              label="Actualité"
              active={currentPage === "actualite"}
              onClick={() => setCurrentPage("actualite")}
            />
            <SidebarGroup
              label="Docs"
              open={docsOpen}
              onToggle={() => setDocsOpen((o) => !o)}
            >
              <SidebarLeaf
                label="Tutoriels"
                active={currentPage === "tutoriels"}
                onClick={() => setCurrentPage("tutoriels")}
              />
              <SidebarLeaf
                label="Api"
                active={currentPage === "api"}
                onClick={() => setCurrentPage("api")}
              />
              <SidebarLeaf
                label="Mcp"
                active={currentPage === "mcp"}
                onClick={() => setCurrentPage("mcp")}
              />
            </SidebarGroup>
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto px-10 py-8">
          {currentPage === "actualite" && <ActualitePage />}
          {currentPage !== "actualite" && <MarkdownPage slug={currentPage} />}
        </main>
      </div>
    </div>
  );
}
