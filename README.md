Run with "npm run dev"

Currently:
- Contains front-end only
- Doesn't use express.js backend, which will be tested on a separate branch. This will include all the actual API calls to eventually connect to MongoDB and S3 databases
- Mock data follows data structure schemas as outlined in design doc, and parses through them to display on asset browser/asset details pages
  - This includes logic for following commit history using "lastCommitId" to get the initial asset creator
- Doesn't include check-in step pages.
- Doesn't include log in page or functionality.

Built with:
- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

With help from Lovable for UI elements and code structuring
