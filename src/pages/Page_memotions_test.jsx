import { RawHtmlPage } from '../parity/RawHtmlPage';
import { html_memotions } from '../parity/htmlImports';

// Parallel migration target. Keep `/memotions` untouched and iterate here.
export default function Page_memotions_test() {
  return <RawHtmlPage htmlSource={html_memotions} />;
}
