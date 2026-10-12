# Architecture rules

- Use the existing announcements table for public news and admin publishing; do not create a parallel content store.
- Build the events calendar from published almanac events so calendar and examination schedules share one source of truth.
- Keep the resource centre as navigation to existing school workflows rather than duplicating results or submission logic.
- Express the shared visual palette with HSL semantic tokens in the global stylesheet and Tailwind configuration.