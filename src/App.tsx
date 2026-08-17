import { lazy, Suspense, useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { useStore } from "./store/useStore";
import { fetchAuthMe } from "./services/api";

// 路由懒加载：按需下载，首屏更快
const Home = lazy(() => import("@/pages/Home"));
const Thoughts = lazy(() => import("@/pages/Thoughts"));
const ThoughtDetail = lazy(() => import("@/pages/ThoughtDetail"));
const Treasure = lazy(() => import("@/pages/Treasure"));
const Timeline = lazy(() => import("@/pages/Timeline"));
const Music = lazy(() => import("@/pages/Music"));
const Moments = lazy(() => import("@/pages/Moments"));
const World60s = lazy(() => import("@/pages/World60s"));
const HotAll = lazy(() => import("@/pages/HotAll"));
const About = lazy(() => import("@/pages/About"));
const NotFound = lazy(() => import("@/pages/NotFound"));
const AdminLogin = lazy(() => import("@/pages/admin/Login"));
const AdminLayout = lazy(() => import("@/components/admin/AdminLayout"));
const AdminDashboard = lazy(() => import("@/pages/admin/Dashboard"));
const AdminArticles = lazy(() => import("@/pages/admin/Articles"));
const AdminArticleEditor = lazy(() => import("@/pages/admin/ArticleEditor"));
const AdminTools = lazy(() => import("@/pages/admin/Tools"));
const AdminMusic = lazy(() => import("@/pages/admin/Music"));
const AdminTimeline = lazy(() => import("@/pages/admin/AdminTimeline"));
const AdminAboutPage = lazy(() => import("@/pages/admin/AdminAboutPage"));
const AdminFriendLinks = lazy(() => import("@/pages/admin/FriendLinksAdmin"));
const AdminSettings = lazy(() => import("@/pages/admin/Settings"));
const CommandPalette = lazy(() => import("@/components/search/CommandPalette"));

/** 页面加载占位（与主视觉一致，避免白屏闪烁） */
function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
      <div className="w-10 h-10 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" aria-label="加载中" />
    </div>
  );
}

export default function App() {
  const commandPaletteOpen = useStore((s) => s.commandPaletteOpen);

  // 启动时校验管理员登录态
  useEffect(() => {
    (async () => {
      const token = localStorage.getItem('admin_token');
      if (!token) {
        useStore.getState().setIsAdmin(false);
        return;
      }
      try {
        const res = await fetchAuthMe();
        useStore.getState().setIsAdmin(!!res?.authenticated);
      } catch {
        useStore.getState().setIsAdmin(false);
      }
    })();
  }, []);

  return (
    <BrowserRouter>
      {commandPaletteOpen && (
        <Suspense fallback={null}>
          <CommandPalette />
        </Suspense>
      )}
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Layout><Home /></Layout>} />
          <Route path="/thoughts" element={<Layout><Thoughts /></Layout>} />
          <Route path="/thoughts/:id" element={<Layout><ThoughtDetail /></Layout>} />
          <Route path="/treasure" element={<Layout><Treasure /></Layout>} />
          <Route path="/timeline" element={<Layout><Timeline /></Layout>} />
          <Route path="/music" element={<Layout><Music /></Layout>} />
          <Route path="/moments" element={<Layout><Moments /></Layout>} />
          <Route path="/60s" element={<Layout><World60s /></Layout>} />
          <Route path="/all-hot" element={<Layout><HotAll /></Layout>} />
          <Route path="/about" element={<Layout><About /></Layout>} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="articles" element={<AdminArticles />} />
            <Route path="articles/new" element={<AdminArticleEditor />} />
            <Route path="articles/:id/edit" element={<AdminArticleEditor />} />
            <Route path="tools" element={<AdminTools />} />
            <Route path="music" element={<AdminMusic />} />
            <Route path="timeline" element={<AdminTimeline />} />
            <Route path="about" element={<AdminAboutPage />} />
            <Route path="friend-links" element={<AdminFriendLinks />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>
          <Route path="*" element={<Layout><NotFound /></Layout>} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
