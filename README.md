Run with "npm run dev"

# Check-in UI steps completed, kinda

NOTES for checking in stuff
- need to completely rework checkinAsset in api.ts, to take in usda files from checkinstep2.tsx to add to S3
- possibly separate this from a new metadataUpdate call in api.ts, taking in info from checkinstep3.tsx

Currently:
- Contains front-end only
- Doesn't use express.js backend, which will be tested on a separate branch. This will include all the actual API calls to eventually connect to MongoDB and S3 databases
- Mock data follows data structure schemas as outlined in design doc, and parses through them to display on asset browser/asset details pages
  - This includes logic for following commit history using "lastCommitId" to get the initial asset creator
- Doesn't include check-in step pages.
- Doesn't include log in page or functionality.