# Contributing to ChronoMap

Thanks for wanting to help! ChronoMap is small and friendly: every contribution counts, from a typo fix to a new tool.

## Ways to help

- **Report a bug.** Open an [issue](https://github.com/agenciaRSE/chronomap/issues/new/choose) and include the page, the city or time zone, the time you expected and the time you saw. For time zone bugs, the exact date matters (daylight saving changes on different days around the world).
- **Suggest an idea.** Open an issue before writing code for a new tool, so we can agree on the approach.
- **Translate.** English and Spanish are complete today. To add a language, open an issue first: we will agree on the folder and the strings to translate.
- **Add data.** Cities live in `src/cities.json`, airports in `src/airports.json`, time zone abbreviations in `src/zones.json`.

## Development

1. Fork the repo and create a branch: `git checkout -b fix/dst-in-chile`.
2. Install and run: `npm install` and `npm run dev` (Node.js 22+).
3. Before opening the pull request, make sure these pass:

   ```bash
   npm run lint
   npm test
   npm run build
   ```

4. Open a pull request explaining **what** changes and **why**. Screenshots help a lot for anything visual.

## Guidelines

- Keep it **client-side and private**: no accounts, no trackers, no new third-party scripts. The Content Security Policy in `vercel.json` will block them anyway.
- Time math goes through the IANA time zone database (`Intl`, `date-fns-tz`). Never hard-code UTC offsets: they change with daylight saving.
- Add or update a test in `test/` when you change time zone logic, redirects or page content.
- Keep the English and Spanish pages in sync when you change copy.
- Small pull requests get reviewed faster than big ones.

By contributing you agree that your work is released under the [MIT License](LICENSE).
