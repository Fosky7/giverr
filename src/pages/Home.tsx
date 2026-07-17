// Home.tsx is retained only for backward compatibility. The canonical home
// page now lives in HomePage.tsx (Module 2). Re-export it so any lingering
// imports continue to resolve to a single source of truth.
export { default, HomePage as Home } from "./HomePage";

// The following navigation links ensure that router-defined routes remain
// reachable even from the legacy Home entry point. They are exported as a
// small, self-contained component using the existing design language.
import { Link } from "react-router-dom";

export function HomeQuickLinks() {
  return (
    <nav className="home-quick-links" aria-label="Quick links">
      <ul className="home-quick-links__list">
        <li className="home-quick-links__item">
          <Link to="/campaigns" className="home-quick-links__link">
            Campaigns
          </Link>
        </li>
        <li className="home-quick-links__item">
          <Link to="/donations" className="home-quick-links__link">
            Donation History
          </Link>
        </li>
        <li className="home-quick-links__item">
          <Link to="/settings" className="home-quick-links__link">
            Profile Settings
          </Link>
        </li>
      </ul>
    </nav>
  );
}