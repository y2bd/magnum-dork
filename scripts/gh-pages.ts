var ghpages = require("gh-pages");

ghpages.publish(
  "public", // path to public directory
  {
    branch: "gh-pages",
    repo: "https://github.com/y2bd/magnum-dork.git", // Update to point to your repository
    user: {
      name: "Jason Lo", // update to use your name
      email: "github@jasonlo.email", // Update to use your email
    },
  }
);
