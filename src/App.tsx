import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import Home from "@/pages/Home";
import Thoughts from "@/pages/Thoughts";
import ThoughtDetail from "@/pages/ThoughtDetail";
import Treasure from "@/pages/Treasure";
import Moments from "@/pages/Moments";
import Music from "@/pages/Music";
import About from "@/pages/About";
import NotFound from "@/pages/NotFound";
import AdminLogin from "@/pages/admin/Login";
import AdminLayout from "@/components/admin/AdminLayout";
import AdminDashboard from "@/pages/admin/Dashboard";
import AdminArticles from "@/pages/admin/Articles";
import AdminArticleEditor from "@/pages/admin/ArticleEditor";
import AdminTools from "@/pages/admin/Tools";
import AdminPhotos from "@/pages/admin/Photos";
import AdminFriendLinks from "@/pages/admin/FriendLinksAdmin";
import AdminSettings from "@/pages/admin/Settings";
import CommandPalette from "@/components/search/CommandPalette";
import { useStore } from "./store/useStore";
import { useEffect } from "react";

// verifyToken function
function verifyToken(token: string | null): boolean {
  if (!token) return false;
  try { return atob(token) === 'admin-authenticated'; } catch { return false; }
}

export default function App() {
  const { setIsAdmin, commandPaletteOpen } = useStore();
  useEffect(() => {
    const token = localStorage.getItem('admin_auth_token');
    setIsAdmin(verifyToken(token));
  }, [setIsAdmin]);

  return (
    <BrowserRouter>
      <CommandPalette />
      <Routes>
        <Route path="/" element={<Layout><Home /></Layout>} />
        <Route path="/thoughts" element={<Layout><Thoughts /></Layout>} />
        <Route path="/thoughts/:id" element={<Layout><ThoughtDetail /></Layout>} />
        <Route path="/treasure" element={<Layout><Treasure /></Layout>} />
        <Route path="/moments" element={<Layout><Moments /></Layout>} />
        <Route path="/music" element={<Layout><Music /></Layout>} />
        <Route path="/about" element={<Layout><About /></Layout>} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="articles" element={<AdminArticles />} />
          <Route path="articles/new" element={<AdminArticleEditor />} />
          <Route path="articles/:id/edit" element={<AdminArticleEditor />} />
          <Route path="tools" element={<AdminTools />} />
          <Route path="photos" element={<AdminPhotos />} />
          <Route path="friend-links" element={<AdminFriendLinks />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>
        <Route path="*" element={<Layout><NotFound /></Layout>} />
      </Routes>
    </BrowserRouter>
  );
}
