import './App.css';
import { Navigate, Route, Routes } from 'react-router-dom';
import Page_about from './pages/Page_about';
import Page_auth from './pages/Page_auth';
import Page_categories from './pages/Page_categories';
import Page_comments from './pages/Page_comments';
import Page_create_backup from './pages/Page_create_backup';
import Page_create from './pages/Page_create';
import Page_explore from './pages/Page_explore';
import Page_HallofFame from './pages/Page_HallofFame';
import Page_leaderboard from './pages/Page_leaderboard';
import Page_lineage from './pages/Page_lineage';
import Page_logo from './pages/Page_logo';
import Page_memotions from './pages/Page_memotions';
import Page_memotions_test from './pages/Page_memotions_test';
import Page_mood from './pages/Page_mood';
import Page_notifications from './pages/Page_notifications';
import Page_other from './pages/Page_other';
import Page_others_profile from './pages/Page_others_profile';
import Page_own_profile from './pages/Page_own_profile';
import Page_privacy from './pages/Page_privacy';
import Page_profile from './pages/Page_profile';
import Page_profile_backup from './pages/Page_profile_backup';
import Page_remix from './pages/Page_remix';
import Page_search from './pages/Page_search';
import Page_settings from './pages/Page_settings';
import Page_share from './pages/Page_share';
import Page_tos from './pages/Page_tos';
import Page_trending from './pages/Page_trending';

export default function App() {
  return (
    <Routes>
      <Route path="/about" element={<Page_about />} />
      <Route path="/auth" element={<Page_auth />} />
      <Route path="/categories" element={<Page_categories />} />
      <Route path="/comments" element={<Page_comments />} />
      <Route path="/create_backup" element={<Page_create_backup />} />
      <Route path="/create" element={<Page_create />} />
      <Route path="/explore" element={<Page_explore />} />
      <Route path="/HallofFame" element={<Page_HallofFame />} />
      <Route path="/leaderboard" element={<Page_leaderboard />} />
      <Route path="/lineage" element={<Page_lineage />} />
      <Route path="/logo" element={<Page_logo />} />
      <Route path="/memotions" element={<Page_memotions />} />
      <Route path="/memotions_test" element={<Page_memotions_test />} />
      <Route path="/mood" element={<Page_mood />} />
      <Route path="/notifications" element={<Page_notifications />} />
      <Route path="/other" element={<Page_other />} />
      <Route path="/others_profile" element={<Page_others_profile />} />
      <Route path="/own_profile" element={<Page_own_profile />} />
      <Route path="/privacy" element={<Page_privacy />} />
      <Route path="/profile" element={<Page_profile />} />
      <Route path="/profile_backup" element={<Page_profile_backup />} />
      <Route path="/remix" element={<Page_remix />} />
      <Route path="/search" element={<Page_search />} />
      <Route path="/settings" element={<Page_settings />} />
      <Route path="/share" element={<Page_share />} />
      <Route path="/tos" element={<Page_tos />} />
      <Route path="/trending" element={<Page_trending />} />
      <Route path="/" element={<Navigate to="/memotions" replace />} />
      <Route path="*" element={<Navigate to="/memotions" replace />} />
    </Routes>
  );
}
