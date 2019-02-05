import ContextualNav from './contextual_nav';
import ContextualSidebar from './contextual_sidebar';

export default function initLayoutNav() {
  const contextualNav = new ContextualNav();
  contextualNav.bindEvents();

  const contextualSidebar = new ContextualSidebar();
  contextualSidebar.bindEvents();
}
