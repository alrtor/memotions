import { RawHtmlPage } from '../parity/RawHtmlPage';
import { html_leaderboard } from '../parity/htmlImports';

export default function Page_leaderboard() {
  return <RawHtmlPage htmlSource={html_leaderboard} />;
}
